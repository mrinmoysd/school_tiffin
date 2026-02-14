# Low-Level Design: API Specifications

## 1. API Architecture

### 1.1 General Specifications
- **Base URL**: `https://api.schooltiffin.com`
- **API Version**: `/api/v1`
- **Protocol**: HTTPS only
- **Auth**: JWT Bearer Token
- **Response Format**: JSON
- **Request Format**: JSON (Content-Type: application/json)

### 1.2 Standard Response Envelope

```typescript
// Success Response
{
  "success": true,
  "data": <object | array | null>,
  "message": "Operation successful",
  "timestamp": "2026-02-06T10:30:00Z"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": <object | null>
  },
  "timestamp": "2026-02-06T10:30:00Z"
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 1.3 HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

## 2. Authentication APIs

### 2.1 Register
**POST** `/api/v1/auth/register`

```typescript
// Request
{
  "email": "parent@example.com",
  "phone": "+919876543210",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "role": "PARENT"
}

// Response (201)
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "parent@example.com",
    "fullName": "John Doe",
    "role": "PARENT"
  }
}
```

### 2.2 Login
**POST** `/api/v1/auth/login`

```typescript
// Request
{
  "email": "parent@example.com",
  "password": "SecurePass123!"
}

// Response (200)
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "parent@example.com",
      "fullName": "John Doe",
      "role": "PARENT"
    }
  }
}
```

### 2.3 Send OTP
**POST** `/api/v1/auth/send-otp`

```typescript
// Request
{
  "phone": "+919876543210"
}

// Response (200)
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresIn": 300
  }
}
```

### 2.4 Verify OTP
**POST** `/api/v1/auth/verify-otp`

```typescript
// Request
{
  "phone": "+919876543210",
  "otp": "123456"
}

// Response (200)
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {...}
  }
}
```

### 2.5 Refresh Token
**POST** `/api/v1/auth/refresh`

```typescript
// Request
{
  "refreshToken": "refresh_token_here"
}

// Response (200)
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

### 2.6 Logout
**POST** `/api/v1/auth/logout`
**Auth Required**: Yes

```typescript
// Response (200)
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. User & Student APIs

### 3.1 Get Current User Profile
**GET** `/api/v1/users/me`
**Auth Required**: Yes

```typescript
// Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "parent@example.com",
    "fullName": "John Doe",
    "phone": "+919876543210",
    "role": "PARENT",
    "emailVerified": true,
    "phoneVerified": true
  }
}
```

### 3.2 Update Profile
**PATCH** `/api/v1/users/me`
**Auth Required**: Yes

```typescript
// Request
{
  "fullName": "John Updated Doe",
  "phone": "+919876543211"
}

// Response (200)
{
  "success": true,
  "data": { /* updated user */ }
}
```

### 3.3 List Students
**GET** `/api/v1/students`
**Auth Required**: Yes (Parent)

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "Alice Doe",
      "grade": "Grade 5",
      "schoolId": "uuid",
      "schoolName": "ABC School",
      "allergies": "Peanuts",
      "isActive": true
    }
  ]
}
```

### 3.4 Create Student
**POST** `/api/v1/students`
**Auth Required**: Yes (Parent)

```typescript
// Request
{
  "fullName": "Alice Doe",
  "dateOfBirth": "2015-05-20",
  "grade": "Grade 5",
  "schoolId": "uuid",
  "allergies": "Peanuts",
  "dietaryPreferences": "Vegetarian"
}

// Response (201)
{
  "success": true,
  "data": { /* created student */ }
}
```

### 3.5 Update Student
**PATCH** `/api/v1/students/:studentId`
**Auth Required**: Yes (Parent)

### 3.6 Delete Student
**DELETE** `/api/v1/students/:studentId`
**Auth Required**: Yes (Parent)

---

## 4. School APIs

### 4.1 List Schools
**GET** `/api/v1/schools`
**Auth Required**: No (Public)
**Query Params**: `?city=Mumbai&isServiceAvailable=true`

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "ABC International School",
      "code": "ABC001",
      "city": "Mumbai",
      "address": "123 Main St",
      "isServiceAvailable": true,
      "operatingDays": "MON,TUE,WED,THU,FRI"
    }
  ]
}
```

### 4.2 Get School Details
**GET** `/api/v1/schools/:schoolId`

```typescript
// Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "ABC International School",
    "code": "ABC001",
    "address": "123 Main St",
    "city": "Mumbai",
    "contactEmail": "info@abc.com",
    "contactPhone": "+911234567890",
    "deliveryInstructions": "Deliver at Gate 2",
    "isServiceAvailable": true,
    "operatingDays": "MON,TUE,WED,THU,FRI"
  }
}
```

### 4.3 Create School (Admin)
**POST** `/api/v1/schools`
**Auth Required**: Yes (Admin)

```typescript
// Request
{
  "name": "ABC International School",
  "code": "ABC001",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "contactEmail": "info@abc.com",
  "contactPhone": "+911234567890",
  "operatingDays": "MON,TUE,WED,THU,FRI"
}

// Response (201)
{
  "success": true,
  "data": { /* created school */ }
}
```

### 4.4 Update School (Admin)
**PATCH** `/api/v1/schools/:schoolId`
**Auth Required**: Yes (Admin)

### 4.5 Toggle Service Availability (Admin)
**PATCH** `/api/v1/schools/:schoolId/service-availability`
**Auth Required**: Yes (Admin)

```typescript
// Request
{
  "isServiceAvailable": false
}
```

---

## 5. Meal Plan APIs

### 5.1 List Meal Plans
**GET** `/api/v1/meal-plans`
**Query Params**: `?schoolId=uuid&isActive=true`

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "schoolId": "uuid",
      "name": "Monthly Lunch Plan",
      "description": "Nutritious lunch for 30 days",
      "planType": "LUNCH",
      "durationDays": 30,
      "pricePerDay": 80.00,
      "totalPrice": 2400.00,
      "imageUrl": "https://...",
      "isActive": true
    }
  ]
}
```

### 5.2 Get Meal Plan Details
**GET** `/api/v1/meal-plans/:mealPlanId`

```typescript
// Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "schoolId": "uuid",
    "schoolName": "ABC School",
    "name": "Monthly Lunch Plan",
    "planType": "LUNCH",
    "durationDays": 30,
    "totalPrice": 2400.00,
    "menuItems": [
      {
        "dayOfWeek": "MONDAY",
        "items": "Dal, Rice, Roti, Salad",
        "calories": 450,
        "allergenInfo": "Contains gluten"
      },
      // ...
    ]
  }
}
```

### 5.3 Create Meal Plan (Admin)
**POST** `/api/v1/meal-plans`
**Auth Required**: Yes (Admin)

```typescript
// Request
{
  "schoolId": "uuid",
  "name": "Monthly Lunch Plan",
  "description": "Nutritious lunch",
  "planType": "LUNCH",
  "durationDays": 30,
  "pricePerDay": 80.00,
  "totalPrice": 2400.00,
  "imageUrl": "https://..."
}

// Response (201)
{
  "success": true,
  "data": { /* created meal plan */ }
}
```

### 5.4 Update Meal Plan (Admin)
**PATCH** `/api/v1/meal-plans/:mealPlanId`
**Auth Required**: Yes (Admin)

---

## 6. Menu Item APIs

### 6.1 Get Menu Items
**GET** `/api/v1/meal-plans/:mealPlanId/menu`

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dayOfWeek": "MONDAY",
      "items": "Dal, Rice, Roti, Salad",
      "description": "Balanced vegetarian meal",
      "calories": 450,
      "allergenInfo": "Contains gluten",
      "imageUrl": "https://..."
    },
    // ...
  ]
}
```

### 6.2 Create Menu Item (Admin)
**POST** `/api/v1/meal-plans/:mealPlanId/menu`
**Auth Required**: Yes (Admin)

```typescript
// Request
{
  "dayOfWeek": "MONDAY",
  "items": "Dal, Rice, Roti, Salad",
  "description": "Balanced vegetarian meal",
  "calories": 450,
  "allergenInfo": "Contains gluten"
}
```

### 6.3 Update Menu Item (Admin)
**PATCH** `/api/v1/menu-items/:menuItemId`
**Auth Required**: Yes (Admin)

---

## 7. Subscription APIs

### 7.1 Create Subscription
**POST** `/api/v1/subscriptions`
**Auth Required**: Yes (Parent)

```typescript
// Request
{
  "studentId": "uuid",
  "mealPlanId": "uuid",
  "startDate": "2026-03-01"
}

// Response (201)
{
  "success": true,
  "data": {
    "subscriptionId": "uuid",
    "subscriptionNumber": "SUB20260001",
    "studentId": "uuid",
    "mealPlanId": "uuid",
    "startDate": "2026-03-01",
    "endDate": "2026-03-31",
    "totalDays": 22,  // Excluding weekends
    "totalAmount": 1760.00,
    "status": "PENDING",
    "deliverySchedule": [
      { "date": "2026-03-01", "status": "SCHEDULED" },
      { "date": "2026-03-03", "status": "SCHEDULED" },
      // ...
    ]
  }
}
```

### 7.2 Get Subscription Details
**GET** `/api/v1/subscriptions/:subscriptionId`
**Auth Required**: Yes (Parent/Admin)

```typescript
// Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "subscriptionNumber": "SUB20260001",
    "student": {
      "id": "uuid",
      "fullName": "Alice Doe"
    },
    "school": {
      "id": "uuid",
      "name": "ABC School"
    },
    "mealPlan": {
      "id": "uuid",
      "name": "Monthly Lunch Plan"
    },
    "startDate": "2026-03-01",
    "currentEndDate": "2026-03-31",
    "totalDays": 22,
    "deliveredDays": 5,
    "pausedDays": 2,
    "remainingDays": 15,
    "totalAmount": 1760.00,
    "paidAmount": 1760.00,
    "status": "ACTIVE"
  }
}
```

### 7.3 List User Subscriptions
**GET** `/api/v1/subscriptions`
**Auth Required**: Yes (Parent)
**Query Params**: `?status=ACTIVE&studentId=uuid`

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "subscriptionNumber": "SUB20260001",
      "studentName": "Alice Doe",
      "mealPlanName": "Monthly Lunch Plan",
      "startDate": "2026-03-01",
      "currentEndDate": "2026-03-31",
      "status": "ACTIVE",
      "remainingDays": 15
    }
  ]
}
```

### 7.4 Get Delivery Schedule
**GET** `/api/v1/subscriptions/:subscriptionId/schedule`
**Auth Required**: Yes (Parent/Admin)

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "date": "2026-03-01",
      "status": "DELIVERED",
      "deliveryConfirmedAt": "2026-03-01T12:30:00Z"
    },
    {
      "date": "2026-03-03",
      "status": "PAUSED"
    },
    {
      "date": "2026-03-04",
      "status": "SCHEDULED"
    }
  ]
}
```

### 7.5 Cancel Subscription
**POST** `/api/v1/subscriptions/:subscriptionId/cancel`
**Auth Required**: Yes (Parent/Admin)

```typescript
// Request
{
  "reason": "Student changed school"
}

// Response (200)
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "refundAmount": 800.00,
    "refundStatus": "PROCESSING"
  }
}
```

---

## 8. Pause Management APIs

### 8.1 Create Pause Request
**POST** `/api/v1/pause-requests`
**Auth Required**: Yes (Parent)

```typescript
// Request
{
  "subscriptionId": "uuid",
  "pauseFromDate": "2026-03-10",
  "pauseToDate": "2026-03-15",
  "reason": "Family vacation"
}

// Response (201)
{
  "success": true,
  "data": {
    "pauseRequestId": "uuid",
    "subscriptionId": "uuid",
    "pauseFromDate": "2026-03-10",
    "pauseToDate": "2026-03-15",
    "pauseDays": 4,  // Excluding weekends
    "newEndDate": "2026-04-04",  // Extended
    "status": "PENDING"
  }
}
```

### 8.2 List Pause Requests
**GET** `/api/v1/pause-requests`
**Auth Required**: Yes (Parent)
**Query Params**: `?subscriptionId=uuid&status=PENDING`

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "subscriptionNumber": "SUB20260001",
      "pauseFromDate": "2026-03-10",
      "pauseToDate": "2026-03-15",
      "pauseDays": 4,
      "reason": "Family vacation",
      "status": "PENDING",
      "createdAt": "2026-02-28T10:00:00Z"
    }
  ]
}
```

### 8.3 Cancel Pause Request
**DELETE** `/api/v1/pause-requests/:pauseRequestId`
**Auth Required**: Yes (Parent)

### 8.4 Approve/Reject Pause Request (Admin)
**PATCH** `/api/v1/pause-requests/:pauseRequestId/status`
**Auth Required**: Yes (Admin)

```typescript
// Request
{
  "status": "APPROVED"  // or "REJECTED"
}

// Response (200)
{
  "success": true,
  "message": "Pause request approved",
  "data": {
    "pauseRequestId": "uuid",
    "status": "APPROVED",
    "approvedAt": "2026-03-01T09:00:00Z"
  }
}
```

---

## 9. Order & Payment APIs

### 9.1 Create Payment Intent
**POST** `/api/v1/payments/create-intent`
**Auth Required**: Yes (Parent)

```typescript
// Request
{
  "subscriptionId": "uuid",
  "amount": 1760.00
}

// Response (200)
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD20260001",
    "amount": 1760.00,
    "currency": "INR",
    "paymentGatewayOrderId": "order_xyz123",
    "paymentKey": "rzp_test_key"
  }
}
```

### 9.2 Verify Payment
**POST** `/api/v1/payments/verify`
**Auth Required**: Yes (Parent)

```typescript
// Request (Razorpay example)
{
  "orderId": "uuid",
  "paymentId": "pay_xyz789",
  "signature": "signature_hash"
}

// Response (200)
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "orderId": "uuid",
    "subscriptionId": "uuid",
    "paymentStatus": "SUCCESS",
    "subscriptionStatus": "ACTIVE"
  }
}
```

### 9.3 Payment Webhook (Razorpay/Stripe)
**POST** `/api/v1/webhooks/payment`
**Auth**: Webhook signature verification

```typescript
// Handles async payment notifications from gateway
// Updates order and subscription status
```

### 9.4 Get Order Details
**GET** `/api/v1/orders/:orderId`
**Auth Required**: Yes (Parent/Admin)

```typescript
// Response (200)
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD20260001",
    "subscriptionNumber": "SUB20260001",
    "amount": 1760.00,
    "taxAmount": 0,
    "finalAmount": 1760.00,
    "paymentStatus": "SUCCESS",
    "paymentMethod": "UPI",
    "createdAt": "2026-03-01T10:00:00Z",
    "transactions": [
      {
        "transactionId": "TXN001",
        "amount": 1760.00,
        "status": "SUCCESS",
        "gatewayTransactionId": "pay_xyz789"
      }
    ]
  }
}
```

### 9.5 List Orders
**GET** `/api/v1/orders`
**Auth Required**: Yes (Parent/Admin)
**Query Params**: `?status=SUCCESS&page=1&limit=20`

---

## 10. Notification APIs

### 10.1 List Notifications
**GET** `/api/v1/notifications`
**Auth Required**: Yes

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Subscription Activated",
      "body": "Your subscription SUB20260001 is now active",
      "notificationType": "SUBSCRIPTION",
      "isRead": false,
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ]
}
```

### 10.2 Mark Notification as Read
**PATCH** `/api/v1/notifications/:notificationId/read`
**Auth Required**: Yes

### 10.3 Mark All as Read
**PATCH** `/api/v1/notifications/read-all`
**Auth Required**: Yes

### 10.4 Register FCM Token
**POST** `/api/v1/notifications/register-token`
**Auth Required**: Yes

```typescript
// Request
{
  "fcmToken": "fcm_device_token",
  "platform": "android"  // or "ios"
}
```

---

## 11. Admin APIs

### 11.1 Dashboard Stats
**GET** `/api/v1/admin/dashboard`
**Auth Required**: Yes (Admin)

```typescript
// Response (200)
{
  "success": true,
  "data": {
    "activeSubscriptions": 150,
    "todayDeliveries": 120,
    "monthlyRevenue": 250000.00,
    "pendingPauseRequests": 5,
    "activeSchools": 12
  }
}
```

### 11.2 Delivery Schedule (School-wise)
**GET** `/api/v1/admin/deliveries`
**Auth Required**: Yes (Admin)
**Query Params**: `?schoolId=uuid&date=2026-03-01`

```typescript
// Response (200)
{
  "success": true,
  "data": [
    {
      "studentName": "Alice Doe",
      "grade": "Grade 5",
      "mealPlanName": "Lunch Plan",
      "subscriptionNumber": "SUB20260001",
      "deliveryStatus": "SCHEDULED"
    }
  ]
}
```

### 11.3 Export Deliveries
**GET** `/api/v1/admin/deliveries/export`
**Auth Required**: Yes (Admin)
**Query Params**: `?schoolId=uuid&date=2026-03-01&format=csv`

```typescript
// Returns CSV/PDF file for download
```

### 11.4 User Management
**GET** `/api/v1/admin/users`
**Auth Required**: Yes (Admin)
**Query Params**: `?role=PARENT&page=1&limit=20`

### 11.5 Reports
**GET** `/api/v1/admin/reports/sales`
**Auth Required**: Yes (Admin)
**Query Params**: `?fromDate=2026-03-01&toDate=2026-03-31&schoolId=uuid`

```typescript
// Response (200)
{
  "success": true,
  "data": {
    "totalRevenue": 50000.00,
    "totalSubscriptions": 25,
    "schoolBreakdown": [
      {
        "schoolName": "ABC School",
        "revenue": 30000.00,
        "subscriptionCount": 15
      }
    ]
  }
}
```

---

## 12. CMS APIs

### 12.1 Get Page Content
**GET** `/api/v1/cms/:slug`

```typescript
// Response (200)
{
  "success": true,
  "data": {
    "slug": "terms-and-conditions",
    "title": "Terms and Conditions",
    "content": "<html content>",
    "publishedAt": "2026-01-01T00:00:00Z"
  }
}
```

### 12.2 Create/Update Page (Admin)
**POST/PATCH** `/api/v1/cms`
**Auth Required**: Yes (Admin)

---

## 13. File Upload APIs

### 13.1 Upload Image
**POST** `/api/v1/uploads/image`
**Auth Required**: Yes (Admin)
**Content-Type**: multipart/form-data

```typescript
// Request (FormData)
{
  "file": <binary>,
  "category": "meal_plan"  // school, menu, etc.
}

// Response (200)
{
  "success": true,
  "data": {
    "url": "https://cdn.schooltiffin.com/images/meal_plan_xyz.jpg",
    "filename": "meal_plan_xyz.jpg"
  }
}
```

---

## 14. Rate Limiting

- **Global**: 100 requests/minute per IP
- **Auth endpoints**: 5 requests/minute per IP
- **Payment endpoints**: 10 requests/minute per user

---

## 15. API Security

### 15.1 JWT Structure
```typescript
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "PARENT",
  "iat": 1234567890,
  "exp": 1234571490  // 1 hour expiry
}
```

### 15.2 Protected Routes
All routes except:
- `/api/v1/auth/register`
- `/api/v1/auth/login`
- `/api/v1/auth/send-otp`
- `/api/v1/auth/verify-otp`
- `/api/v1/schools` (list/get)
- `/api/v1/meal-plans` (list/get)
- `/api/v1/cms/:slug`

### 15.3 CORS Policy
```typescript
{
  origin: ["https://app.schooltiffin.com", "https://admin.schooltiffin.com"],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"]
}
```

---

## 16. Idempotency

Payment APIs use **Idempotency-Key** header:
```
Idempotency-Key: <uuid>
```

If duplicate key received within 24 hours, return cached response.

---

## 17. Postman Collection

See `School_Tiffin_API.postman_collection.json` for complete API collection with examples.
