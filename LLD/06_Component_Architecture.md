# Low-Level Design: Component Architecture

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────┬───────────────────────────────────┤
│   React Native App      │   React Admin Panel               │
│   (iOS & Android)       │   (Web Browser)                   │
│   - Parent Interface    │   - Admin Dashboard               │
│   - Student Management  │   - School Management             │
│   - Subscriptions       │   - Order Management              │
│   - Payments            │   - Reports                       │
└────────────┬────────────┴──────────┬────────────────────────┘
             │                       │
             └───────────┬───────────┘
                         │ HTTPS/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY / LOAD BALANCER              │
│                     (NGINX / AWS ALB)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER (Node.js)                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Layer (Controllers & Routes)                    │  │
│  │  - Authentication, Users, Schools, Subscriptions     │  │
│  │  - Orders, Payments, Notifications, CMS              │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │                                             │
│  ┌─────────────▼────────────────────────────────────────┐  │
│  │  Service Layer (Business Logic)                      │  │
│  │  - SubscriptionService, PaymentService               │  │
│  │  - NotificationService, AuthService                  │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │                                             │
│  ┌─────────────▼────────────────────────────────────────┐  │
│  │  Repository Layer (Data Access)                      │  │
│  │  - Prisma ORM / TypeORM                              │  │
│  └─────────────┬────────────────────────────────────────┘  │
│                │                                             │
│  ┌─────────────▼────────────────────────────────────────┐  │
│  │  Background Jobs (BullMQ Workers)                    │  │
│  │  - Daily Deliveries, Notifications, Cleanup          │  │
│  └──────────────────────────────────────────────────────┘  │
└───┬──────────┬──────────┬──────────┬──────────────────┬────┘
    │          │          │          │                  │
    ▼          ▼          ▼          ▼                  ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐  ┌──────────────┐
│PostgreSQL Redis   │  S3      │ FCM     │  │ Razorpay/    │
│Database│ Cache &  │  Object  │ Push    │  │ Stripe       │
│        │ Queue    │  Storage │ Notif.  │  │ Payment      │
└────────┘ └────────┘ └────────┘ └─────────┘  └──────────────┘
```

---

## 2. Backend Architecture (Detailed)

### 2.1 Module Structure (NestJS)

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── config/                    # Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── s3.config.ts
│   │
│   ├── common/                    # Shared utilities
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── utils/
│   │       ├── date.util.ts
│   │       └── response.util.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── refresh.strategy.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       ├── login.dto.ts
│   │   │       └── otp.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── students/
│   │   │   ├── students.module.ts
│   │   │   ├── students.controller.ts
│   │   │   ├── students.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── schools/
│   │   │   ├── schools.module.ts
│   │   │   ├── schools.controller.ts
│   │   │   ├── schools.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── meal-plans/
│   │   │   ├── meal-plans.module.ts
│   │   │   ├── meal-plans.controller.ts
│   │   │   ├── meal-plans.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── subscriptions/
│   │   │   ├── subscriptions.module.ts
│   │   │   ├── subscriptions.controller.ts
│   │   │   ├── subscriptions.service.ts
│   │   │   ├── subscription-engine.service.ts  # Core logic
│   │   │   └── dto/
│   │   │
│   │   ├── pause-requests/
│   │   │   ├── pause-requests.module.ts
│   │   │   ├── pause-requests.controller.ts
│   │   │   ├── pause-requests.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── gateways/
│   │   │   │   ├── razorpay.gateway.ts
│   │   │   │   └── stripe.gateway.ts
│   │   │   └── dto/
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── providers/
│   │   │   │   ├── fcm.provider.ts
│   │   │   │   ├── email.provider.ts
│   │   │   │   └── sms.provider.ts
│   │   │   └── dto/
│   │   │
│   │   ├── cms/
│   │   │   ├── cms.module.ts
│   │   │   ├── cms.controller.ts
│   │   │   ├── cms.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── uploads/
│   │   │   ├── uploads.module.ts
│   │   │   ├── uploads.controller.ts
│   │   │   └── uploads.service.ts
│   │   │
│   │   └── admin/
│   │       ├── admin.module.ts
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts
│   │       └── dto/
│   │
│   ├── jobs/                      # Background jobs
│   │   ├── jobs.module.ts
│   │   ├── delivery/
│   │   │   ├── delivery.processor.ts
│   │   │   └── delivery-cron.service.ts
│   │   ├── notification/
│   │   │   └── notification.processor.ts
│   │   ├── subscription/
│   │   │   └── subscription.processor.ts
│   │   ├── payment/
│   │   │   └── payment.processor.ts
│   │   └── cleanup/
│   │       └── cleanup.processor.ts
│   │
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── database.module.ts
│   │
│   └── types/                     # TypeScript types
│       ├── express.d.ts
│       └── interfaces/
│
├── test/                          # E2E tests
├── .env.example
├── .env
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 3. Mobile App Architecture (React Native)

### 3.1 Project Structure

```
mobile-app/
├── src/
│   ├── App.tsx                    # Root component
│   │
│   ├── navigation/
│   │   ├── AppNavigator.tsx       # Main navigator
│   │   ├── AuthNavigator.tsx      # Auth flow
│   │   └── MainNavigator.tsx      # Logged-in flow
│   │
│   ├── features/                  # Feature-based modules
│   │   │
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   └── OTPScreen.tsx
│   │   │   ├── components/
│   │   │   │   └── AuthForm.tsx
│   │   │   └── hooks/
│   │   │       ├── useLogin.ts
│   │   │       └── useRegister.ts
│   │   │
│   │   ├── schools/
│   │   │   ├── screens/
│   │   │   │   ├── SchoolListScreen.tsx
│   │   │   │   └── SchoolDetailScreen.tsx
│   │   │   └── components/
│   │   │       └── SchoolCard.tsx
│   │   │
│   │   ├── meals/
│   │   │   ├── screens/
│   │   │   │   ├── MealPlansScreen.tsx
│   │   │   │   └── MenuDetailScreen.tsx
│   │   │   └── components/
│   │   │       ├── MealPlanCard.tsx
│   │   │       └── MenuList.tsx
│   │   │
│   │   ├── subscription/
│   │   │   ├── screens/
│   │   │   │   ├── CreateSubscriptionScreen.tsx
│   │   │   │   ├── SubscriptionDetailScreen.tsx
│   │   │   │   └── DeliveryScheduleScreen.tsx
│   │   │   └── components/
│   │   │       ├── SubscriptionCard.tsx
│   │   │       ├── DatePicker.tsx
│   │   │       └── ScheduleCalendar.tsx
│   │   │
│   │   ├── pause/
│   │   │   ├── screens/
│   │   │   │   └── PauseRequestScreen.tsx
│   │   │   └── components/
│   │   │       └── DateRangePicker.tsx
│   │   │
│   │   ├── orders/
│   │   │   ├── screens/
│   │   │   │   ├── OrdersScreen.tsx
│   │   │   │   └── OrderDetailScreen.tsx
│   │   │   └── components/
│   │   │       └── OrderCard.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── screens/
│   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   ├── EditProfileScreen.tsx
│   │   │   │   └── StudentsScreen.tsx
│   │   │   └── components/
│   │   │       └── StudentCard.tsx
│   │   │
│   │   └── notifications/
│   │       ├── screens/
│   │       │   └── NotificationsScreen.tsx
│   │       └── components/
│   │           └── NotificationCard.tsx
│   │
│   ├── components/                # Shared components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── Header.tsx
│   │
│   ├── store/                     # State management
│   │   ├── index.ts               # Store configuration
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   ├── subscriptionSlice.ts
│   │   │   └── notificationSlice.ts
│   │   └── middleware/
│   │       └── api.middleware.ts
│   │
│   ├── services/                  # API services
│   │   ├── api.ts                 # Axios instance
│   │   ├── auth.service.ts
│   │   ├── subscription.service.ts
│   │   ├── school.service.ts
│   │   ├── payment.service.ts
│   │   └── notification.service.ts
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useNotifications.ts
│   │
│   ├── utils/
│   │   ├── storage.ts             # Async Storage wrapper
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   │
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── android/
├── ios/
├── package.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

### 3.2 State Management (Redux Toolkit)

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import subscriptionReducer from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    subscription: subscriptionReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```typescript
// store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginDTO, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { logout, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
```

### 3.3 API Service Layer

```typescript
// services/api.ts
import axios from 'axios';
import { getTokens, storeTokens } from '../utils/storage';

const API_BASE_URL = 'https://api.schooltiffin.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const tokens = await getTokens();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const tokens = await getTokens();
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken
        });
        
        const { accessToken } = response.data.data;
        await storeTokens(accessToken, tokens.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        // Navigate to login
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 4. Admin Panel Architecture (React)

### 4.1 Project Structure

```
admin-panel/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   │
│   ├── layouts/
│   │   ├── MainLayout.tsx         # Sidebar + Header
│   │   └── AuthLayout.tsx
│   │
│   ├── pages/
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   │
│   │   ├── schools/
│   │   │   ├── SchoolsListPage.tsx
│   │   │   ├── SchoolCreatePage.tsx
│   │   │   └── SchoolEditPage.tsx
│   │   │
│   │   ├── meals/
│   │   │   ├── MealPlansListPage.tsx
│   │   │   ├── MealPlanCreatePage.tsx
│   │   │   └── MenuManagementPage.tsx
│   │   │
│   │   ├── subscriptions/
│   │   │   ├── SubscriptionsListPage.tsx
│   │   │   └── SubscriptionDetailPage.tsx
│   │   │
│   │   ├── orders/
│   │   │   ├── OrdersListPage.tsx
│   │   │   └── OrderDetailPage.tsx
│   │   │
│   │   ├── users/
│   │   │   ├── UsersListPage.tsx
│   │   │   └── UserDetailPage.tsx
│   │   │
│   │   ├── pause-requests/
│   │   │   └── PauseRequestsPage.tsx
│   │   │
│   │   ├── deliveries/
│   │   │   └── DeliveriesPage.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── SalesReportPage.tsx
│   │   │   └── SubscriptionReportPage.tsx
│   │   │
│   │   └── cms/
│   │       └── CMSPage.tsx
│   │
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── DataTable.tsx
│   │   ├── StatCard.tsx
│   │   └── DateRangePicker.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── school.service.ts
│   │   ├── subscription.service.ts
│   │   └── order.service.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   └── useTable.ts
│   │
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validation.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── styles/
│       └── theme.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts (or webpack.config.js)
└── .env
```

### 4.2 Data Fetching (React Query)

```typescript
// hooks/useFetch.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSchools() {
  return useQuery({
    queryKey: ['schools'],
    queryFn: () => schoolService.getAll()
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSchoolDTO) => schoolService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    }
  });
}
```

---

## 5. Data Flow Diagrams

### 5.1 Subscription Creation Flow

```
Mobile App                    Backend                      Database
    │                            │                            │
    │ 1. POST /subscriptions     │                            │
    ├───────────────────────────>│                            │
    │                            │ 2. Validate inputs         │
    │                            │ 3. Get meal plan & school  │
    │                            ├───────────────────────────>│
    │                            │<───────────────────────────┤
    │                            │ 4. Generate schedule       │
    │                            │ 5. Create subscription     │
    │                            ├───────────────────────────>│
    │                            │ 6. Create subscription_days│
    │                            ├───────────────────────────>│
    │                            │<───────────────────────────┤
    │ 7. Return subscription     │                            │
    │<───────────────────────────┤                            │
    │ 8. Navigate to payment     │                            │
    │                            │                            │
    │ 9. POST /payments/create   │                            │
    ├───────────────────────────>│                            │
    │                            │ 10. Create order           │
    │                            ├───────────────────────────>│
    │                            │ 11. Call payment gateway   │
    │                            ├───────────> Razorpay       │
    │ 12. Return payment intent  │                            │
    │<───────────────────────────┤                            │
    │ 13. Show payment UI        │                            │
    │ 14. User completes payment │                            │
    │                            │ 15. Webhook received       │
    │                            │<──────────── Razorpay      │
    │                            │ 16. Queue payment job      │
    │                            ├───────────> Redis Queue    │
    │                            │ 17. Update order & sub     │
    │                            ├───────────────────────────>│
    │                            │ 18. Send notification      │
    │ 19. Push notification      │                            │
    │<───────────────────────────┤                            │
```

### 5.2 Pause Request Flow

```
Mobile App              Backend              Admin Panel        Database
    │                      │                      │                │
    │ 1. POST /pause       │                      │                │
    ├─────────────────────>│                      │                │
    │                      │ 2. Validate dates    │                │
    │                      │ 3. Calculate days    │                │
    │                      │ 4. Create request    │                │
    │                      ├─────────────────────────────────────>│
    │ 5. Return request    │                      │                │
    │<─────────────────────┤                      │                │
    │                      │                      │                │
    │                      │  6. Admin views list │                │
    │                      │<─────────────────────┤                │
    │                      │  7. Approve request  │                │
    │                      │<─────────────────────┤                │
    │                      │ 8. Queue pause job   │                │
    │                      ├───────> Redis Queue  │                │
    │                      │ 9. Process pause     │                │
    │                      │ 10. Update schedule  │                │
    │                      ├─────────────────────────────────────>│
    │                      │ 11. Extend sub dates │                │
    │                      ├─────────────────────────────────────>│
    │ 12. Notification     │                      │                │
    │<─────────────────────┤                      │                │
```

---

## 6. Security Architecture

### 6.1 API Security Layers

```
Request
  │
  ▼
Rate Limiting (Express Rate Limit)
  │
  ▼
CORS Validation
  │
  ▼
JWT Authentication (Passport JWT Strategy)
  │
  ▼
Role-Based Authorization (Custom Guard)
  │
  ▼
Input Validation (Class Validator)
  │
  ▼
Controller Logic
  │
  ▼
Service Layer (Business Logic)
  │
  ▼
Repository Layer (Data Access)
  │
  ▼
Database (PostgreSQL)
```

### 6.2 Data Encryption

- **Passwords**: bcrypt (10 rounds)
- **Tokens**: JWT with HS256
- **Sensitive Data**: AES-256 (if needed)
- **In Transit**: TLS 1.3
- **At Rest**: Database encryption

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE CDN                        │
│                    (Static Assets / Images)                  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                       LOAD BALANCER                          │
│                     (AWS ALB / NGINX)                        │
└──────┬─────────────────────┬────────────────────┬───────────┘
       │                     │                    │
       ▼                     ▼                    ▼
┌──────────┐          ┌──────────┐         ┌──────────┐
│  API     │          │  API     │         │  Worker  │
│  Server 1│          │  Server 2│         │  Process │
│  (Node)  │          │  (Node)  │         │  (Jobs)  │
└────┬─────┘          └────┬─────┘         └────┬─────┘
     │                     │                    │
     └──────────┬──────────┴────────────────────┘
                │
     ┌──────────┴──────────┐
     │                     │
     ▼                     ▼
┌──────────┐        ┌──────────┐
│PostgreSQL│        │  Redis   │
│ Primary  │        │  Cluster │
└────┬─────┘        └──────────┘
     │
     ▼
┌──────────┐
│PostgreSQL│
│ Replica  │
│(Read-only│
└──────────┘
```

### 7.1 Container Architecture (Docker)

```dockerfile
# Dockerfile for Backend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/schooltiffin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  worker:
    build: ./backend
    command: node dist/worker.js
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/schooltiffin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:14-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=schooltiffin
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 8. Monitoring & Observability

### 8.1 Logging Stack

```
Application Logs
      │
      ▼
Winston/Pino (Logger)
      │
      ▼
LogStash / Fluentd
      │
      ▼
Elasticsearch
      │
      ▼
Kibana (Visualization)
```

### 8.2 Metrics & Monitoring

- **APM**: New Relic / Datadog
- **Error Tracking**: Sentry
- **Uptime Monitoring**: Pingdom / UptimeRobot
- **Custom Metrics**: Prometheus + Grafana

---

This completes the component architecture design covering all layers of the system.
