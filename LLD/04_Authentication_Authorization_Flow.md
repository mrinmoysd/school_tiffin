# Low-Level Design: Authentication & Authorization Flow

## 1. Overview

The platform implements **JWT-based authentication** with **refresh tokens** and **role-based access control (RBAC)**.

### Supported Auth Methods
1. Email + Password
2. Phone + OTP
3. Social Login (Future: Google, Facebook)

---

## 2. User Roles

```typescript
enum UserRole {
  PARENT = 'PARENT',          // Mobile app users
  ADMIN = 'ADMIN',            // Full admin panel access
  SCHOOL_ADMIN = 'SCHOOL_ADMIN'  // Future: School-specific access
}
```

### Role Permissions

| Feature | PARENT | ADMIN | SCHOOL_ADMIN |
|---------|--------|-------|--------------|
| View own subscriptions | ✓ | ✓ | - |
| Create subscriptions | ✓ | ✓ | - |
| Manage students | ✓ | ✓ | - |
| View all users | - | ✓ | - |
| Manage schools | - | ✓ | ✓ |
| Manage meal plans | - | ✓ | ✓ |
| View all orders | - | ✓ | ✓ |
| Approve pause requests | - | ✓ | - |
| Access reports | - | ✓ | ✓ |
| Manage CMS | - | ✓ | - |

---

## 3. Registration Flow

### 3.1 Email/Password Registration

```typescript
// API: POST /api/v1/auth/register
interface RegisterDTO {
  email: string;
  phone?: string;
  password: string;
  fullName: string;
  role: 'PARENT';  // Default, admins created manually
}

async function register(dto: RegisterDTO) {
  // Step 1: Validate input
  validateEmail(dto.email);
  validatePassword(dto.password); // Min 8 chars, 1 uppercase, 1 number
  
  // Step 2: Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: dto.email }
  });
  
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }
  
  // Step 3: Hash password
  const passwordHash = await bcrypt.hash(dto.password, 10);
  
  // Step 4: Create user
  const user = await db.user.create({
    data: {
      email: dto.email,
      phone: dto.phone,
      passwordHash: passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      isActive: true,
      emailVerified: false,
      phoneVerified: false
    }
  });
  
  // Step 5: Send verification email (async)
  await sendVerificationEmail(user.email, user.id);
  
  // Step 6: Return user (without password)
  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  };
}
```

### 3.2 Email Verification

```typescript
// API: POST /api/v1/auth/verify-email
interface VerifyEmailDTO {
  token: string;  // JWT with userId + expiresIn
}

async function verifyEmail(dto: VerifyEmailDTO) {
  // Decode token
  const payload = jwt.verify(dto.token, JWT_EMAIL_SECRET);
  
  // Update user
  await db.user.update({
    where: { id: payload.userId },
    data: { emailVerified: true }
  });
  
  return { message: 'Email verified successfully' };
}
```

---

## 4. Login Flow

### 4.1 Email/Password Login

```typescript
// API: POST /api/v1/auth/login
interface LoginDTO {
  email: string;
  password: string;
}

async function login(dto: LoginDTO) {
  // Step 1: Find user by email
  const user = await db.user.findUnique({
    where: { email: dto.email }
  });
  
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  // Step 2: Check if account is active
  if (!user.isActive) {
    throw new ForbiddenError('Account is deactivated');
  }
  
  // Step 3: Verify password
  const isPasswordValid = await bcrypt.compare(
    dto.password,
    user.passwordHash
  );
  
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }
  
  // Step 4: Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);
  
  // Step 5: Update last login
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  
  // Step 6: Return response
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      emailVerified: user.emailVerified
    }
  };
}
```

### 4.2 Phone + OTP Login

#### Send OTP

```typescript
// API: POST /api/v1/auth/send-otp
interface SendOTPDTO {
  phone: string;
}

async function sendOTP(dto: SendOTPDTO) {
  // Step 1: Validate phone format
  validatePhoneNumber(dto.phone);
  
  // Step 2: Generate 6-digit OTP
  const otp = generateRandomOTP(); // e.g., "123456"
  
  // Step 3: Store OTP in Redis with 5-minute TTL
  await redis.setex(
    `otp:${dto.phone}`,
    300,  // 5 minutes
    otp
  );
  
  // Step 4: Send OTP via SMS gateway
  await sendSMS(dto.phone, `Your OTP is: ${otp}. Valid for 5 minutes.`);
  
  // Step 5: Rate limiting (max 3 OTP requests per hour per phone)
  await incrementOTPRateLimit(dto.phone);
  
  return {
    message: 'OTP sent successfully',
    expiresIn: 300
  };
}
```

#### Verify OTP

```typescript
// API: POST /api/v1/auth/verify-otp
interface VerifyOTPDTO {
  phone: string;
  otp: string;
}

async function verifyOTP(dto: VerifyOTPDTO) {
  // Step 1: Get OTP from Redis
  const storedOTP = await redis.get(`otp:${dto.phone}`);
  
  if (!storedOTP) {
    throw new UnauthorizedError('OTP expired or invalid');
  }
  
  // Step 2: Verify OTP
  if (storedOTP !== dto.otp) {
    throw new UnauthorizedError('Invalid OTP');
  }
  
  // Step 3: Delete OTP from Redis
  await redis.del(`otp:${dto.phone}`);
  
  // Step 4: Find or create user
  let user = await db.user.findUnique({
    where: { phone: dto.phone }
  });
  
  if (!user) {
    // Auto-register user with phone
    user = await db.user.create({
      data: {
        phone: dto.phone,
        fullName: `User ${dto.phone.slice(-4)}`,
        role: 'PARENT',
        phoneVerified: true,
        isActive: true,
        // No password for OTP users
        passwordHash: null
      }
    });
  } else {
    // Mark phone as verified
    await db.user.update({
      where: { id: user.id },
      data: { phoneVerified: true, lastLoginAt: new Date() }
    });
  }
  
  // Step 5: Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);
  
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role
    }
  };
}
```

---

## 5. JWT Token Management

### 5.1 Token Structure

#### Access Token
```typescript
interface AccessTokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: UserRole;
  iat: number;  // Issued at
  exp: number;  // Expiry (1 hour from iat)
}

// Example
{
  "userId": "uuid-1234",
  "email": "parent@example.com",
  "role": "PARENT",
  "iat": 1707216000,
  "exp": 1707219600  // 1 hour later
}
```

#### Refresh Token
```typescript
interface RefreshTokenPayload {
  userId: string;
  tokenId: string;  // Unique token identifier
  iat: number;
  exp: number;  // Expiry (7 days from iat)
}
```

### 5.2 Generate Tokens

```typescript
async function generateTokens(user: User) {
  // Access Token (1 hour)
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );
  
  // Refresh Token (7 days)
  const refreshTokenId = generateUUID();
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tokenId: refreshTokenId
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  // Store refresh token in database
  await db.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  
  return { accessToken, refreshToken };
}
```

### 5.3 Refresh Access Token

```typescript
// API: POST /api/v1/auth/refresh
interface RefreshTokenDTO {
  refreshToken: string;
}

async function refreshAccessToken(dto: RefreshTokenDTO) {
  // Step 1: Verify refresh token
  let payload;
  try {
    payload = jwt.verify(dto.refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
  
  // Step 2: Check if token exists in database and not revoked
  const storedToken = await db.refreshToken.findUnique({
    where: {
      id: payload.tokenId,
      isRevoked: false
    },
    include: { user: true }
  });
  
  if (!storedToken) {
    throw new UnauthorizedError('Refresh token revoked or not found');
  }
  
  // Step 3: Check expiry
  if (new Date() > storedToken.expiresAt) {
    throw new UnauthorizedError('Refresh token expired');
  }
  
  // Step 4: Generate new access token
  const accessToken = jwt.sign(
    {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );
  
  return { accessToken };
}
```

---

## 6. Logout Flow

```typescript
// API: POST /api/v1/auth/logout
// Auth Required: Yes

async function logout(userId: string, refreshToken?: string) {
  if (refreshToken) {
    // Revoke specific refresh token
    const payload = jwt.decode(refreshToken);
    
    await db.refreshToken.update({
      where: { id: payload.tokenId },
      data: { isRevoked: true }
    });
  } else {
    // Revoke all refresh tokens for user
    await db.refreshToken.updateMany({
      where: { userId: userId },
      data: { isRevoked: true }
    });
  }
  
  return { message: 'Logged out successfully' };
}
```

---

## 7. Middleware & Guards

### 7.1 JWT Authentication Middleware

```typescript
async function authenticateJWT(req, res, next) {
  try {
    // Step 1: Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7); // Remove "Bearer "
    
    // Step 2: Verify token
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Step 3: Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token'
      }
    });
  }
}
```

### 7.2 Role-Based Authorization Guard

```typescript
function requireRole(...allowedRoles: UserRole[]) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
    
    next();
  };
}

// Usage
app.get('/api/v1/admin/users', 
  authenticateJWT, 
  requireRole(UserRole.ADMIN), 
  getUsersController
);
```

### 7.3 Resource Ownership Guard

```typescript
async function requireOwnership(req, res, next) {
  // Example: Ensure parent can only access their own students
  const studentId = req.params.studentId;
  const userId = req.user.userId;
  
  const student = await db.student.findUnique({
    where: { id: studentId }
  });
  
  if (!student) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Student not found' }
    });
  }
  
  if (student.parentId !== userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
  }
  
  next();
}
```

---

## 8. Password Management

### 8.1 Forgot Password

```typescript
// API: POST /api/v1/auth/forgot-password
interface ForgotPasswordDTO {
  email: string;
}

async function forgotPassword(dto: ForgotPasswordDTO) {
  const user = await db.user.findUnique({
    where: { email: dto.email }
  });
  
  if (!user) {
    // Don't reveal if email exists
    return { message: 'If email exists, reset link sent' };
  }
  
  // Generate reset token (valid for 1 hour)
  const resetToken = jwt.sign(
    { userId: user.id, purpose: 'password_reset' },
    process.env.JWT_RESET_SECRET,
    { expiresIn: '1h' }
  );
  
  // Send reset email
  const resetLink = `https://app.schooltiffin.com/reset-password?token=${resetToken}`;
  await sendEmail(user.email, 'Password Reset', `Click here: ${resetLink}`);
  
  return { message: 'If email exists, reset link sent' };
}
```

### 8.2 Reset Password

```typescript
// API: POST /api/v1/auth/reset-password
interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

async function resetPassword(dto: ResetPasswordDTO) {
  // Verify token
  const payload = jwt.verify(dto.token, process.env.JWT_RESET_SECRET);
  
  if (payload.purpose !== 'password_reset') {
    throw new UnauthorizedError('Invalid token');
  }
  
  // Validate new password
  validatePassword(dto.newPassword);
  
  // Hash new password
  const passwordHash = await bcrypt.hash(dto.newPassword, 10);
  
  // Update user
  await db.user.update({
    where: { id: payload.userId },
    data: { passwordHash }
  });
  
  // Revoke all refresh tokens (force re-login)
  await db.refreshToken.updateMany({
    where: { userId: payload.userId },
    data: { isRevoked: true }
  });
  
  return { message: 'Password reset successfully' };
}
```

### 8.3 Change Password (Authenticated)

```typescript
// API: POST /api/v1/auth/change-password
// Auth Required: Yes
interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

async function changePassword(userId: string, dto: ChangePasswordDTO) {
  const user = await db.user.findUnique({ where: { id: userId } });
  
  // Verify current password
  const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Current password incorrect');
  }
  
  // Validate and hash new password
  validatePassword(dto.newPassword);
  const passwordHash = await bcrypt.hash(dto.newPassword, 10);
  
  // Update password
  await db.user.update({
    where: { id: userId },
    data: { passwordHash }
  });
  
  return { message: 'Password changed successfully' };
}
```

---

## 9. Security Measures

### 9.1 Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Optional: 1 special character

```typescript
function validatePassword(password: string) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!regex.test(password)) {
    throw new ValidationError('Password does not meet requirements');
  }
}
```

### 9.2 Rate Limiting

```redis
# Login attempts: 5 per 15 minutes per email
SETEX rate:login:email@example.com 900 1
INCR rate:login:email@example.com

# OTP requests: 3 per hour per phone
SETEX rate:otp:+919876543210 3600 1
INCR rate:otp:+919876543210
```

### 9.3 Brute Force Protection
- Lock account after 5 failed login attempts
- Require CAPTCHA after 3 failed attempts
- Auto-unlock after 30 minutes

### 9.4 Token Security
- Store JWT secrets in environment variables
- Use strong, random secrets (256-bit)
- Rotate secrets periodically
- Implement token blacklisting for logout

### 9.5 HTTPS Only
- Enforce HTTPS in production
- Set secure cookie flags
- Enable HSTS headers

---

## 10. Mobile App Token Storage

### 10.1 Secure Storage

```typescript
// React Native: Use @react-native-async-storage/async-storage
// With encryption via react-native-keychain

import * as Keychain from 'react-native-keychain';

// Store tokens
async function storeTokens(accessToken: string, refreshToken: string) {
  await Keychain.setGenericPassword('auth_tokens', JSON.stringify({
    accessToken,
    refreshToken
  }), {
    service: 'com.schooltiffin.auth'
  });
}

// Retrieve tokens
async function getTokens() {
  const credentials = await Keychain.getGenericPassword({
    service: 'com.schooltiffin.auth'
  });
  
  if (credentials) {
    return JSON.parse(credentials.password);
  }
  return null;
}

// Delete tokens (logout)
async function clearTokens() {
  await Keychain.resetGenericPassword({
    service: 'com.schooltiffin.auth'
  });
}
```

### 10.2 Axios Interceptor for Auto-Refresh

```typescript
import axios from 'axios';

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token
        const tokens = await getTokens();
        
        // Request new access token
        const response = await axios.post('/api/v1/auth/refresh', {
          refreshToken: tokens.refreshToken
        });
        
        const { accessToken } = response.data.data;
        
        // Update stored tokens
        await storeTokens(accessToken, tokens.refreshToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        await clearTokens();
        // Navigate to login screen
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 11. Admin Panel Authentication

### 11.1 Same JWT System
- Admin users login via admin panel
- Same token generation logic
- Role-based route protection

### 11.2 Admin Creation
- Admins cannot self-register
- Created manually via database script or super admin
- Initial super admin created during deployment

```typescript
// Script: create-admin.ts
import { db } from './database';
import bcrypt from 'bcrypt';

async function createAdmin(email: string, password: string, fullName: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  
  await db.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true
    }
  });
  
  console.log('Admin created successfully');
}

// Usage: ts-node create-admin.ts admin@schooltiffin.com SecurePass123! "Admin User"
```

---

## 12. Session Management

### 12.1 Single Device vs Multi-Device
- **Current**: Multi-device (multiple refresh tokens allowed)
- **Future**: Optionally restrict to single device

### 12.2 Token Revocation
- On logout: Revoke refresh token
- On password change: Revoke all refresh tokens
- On account deactivation: Revoke all refresh tokens

---

## 13. Audit Logging

Log all authentication events:

```typescript
async function logAuthEvent(event: string, userId: string, metadata: any) {
  await db.auditLog.create({
    data: {
      userId,
      action: event,
      entityType: 'AUTH',
      newData: metadata,
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
      createdAt: new Date()
    }
  });
}

// Events to log:
// - USER_REGISTERED
// - USER_LOGGED_IN
// - USER_LOGGED_OUT
// - PASSWORD_CHANGED
// - PASSWORD_RESET_REQUESTED
// - PASSWORD_RESET_COMPLETED
// - OTP_SENT
// - OTP_VERIFIED
// - TOKEN_REFRESHED
```

---

## 14. Future Enhancements

1. **Multi-Factor Authentication (MFA)**
   - TOTP-based (Google Authenticator)
   - SMS-based secondary verification

2. **Social Login**
   - Google OAuth
   - Facebook Login
   - Apple Sign In

3. **Biometric Authentication**
   - Fingerprint
   - Face ID (iOS)
   - Face unlock (Android)

4. **Session Management Dashboard**
   - View active sessions
   - Revoke specific sessions

---

This completes the authentication and authorization design for the platform.
