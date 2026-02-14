# Low-Level Design: Subscription Engine Logic

## 1. Overview

The Subscription Engine is the core business logic component responsible for:
- Generating delivery schedules
- Managing pause/resume operations
- Calculating dates and extending subscriptions
- Tracking delivery status

---

## 2. Subscription Creation Flow

### 2.1 Input Parameters
```typescript
interface CreateSubscriptionDTO {
  studentId: string;
  mealPlanId: string;
  startDate: string; // YYYY-MM-DD
}
```

### 2.2 Subscription Creation Algorithm

```typescript
async function createSubscription(dto: CreateSubscriptionDTO) {
  // Step 1: Validate inputs
  const student = await validateStudent(dto.studentId);
  const mealPlan = await validateMealPlan(dto.mealPlanId);
  const school = await getSchool(mealPlan.schoolId);
  
  // Step 2: Validate start date
  if (new Date(dto.startDate) < new Date()) {
    throw new Error("Start date cannot be in the past");
  }
  
  // Step 3: Get school operating days
  const operatingDays = parseOperatingDays(school.operatingDays);
  // e.g., ["MON", "TUE", "WED", "THU", "FRI"]
  
  // Step 4: Generate delivery schedule
  const schedule = generateDeliverySchedule(
    dto.startDate,
    mealPlan.durationDays,
    operatingDays
  );
  
  // Step 5: Calculate end date
  const endDate = schedule[schedule.length - 1].date;
  
  // Step 6: Create subscription record
  const subscription = await db.subscription.create({
    data: {
      subscriptionNumber: generateSubscriptionNumber(),
      parentId: student.parentId,
      studentId: dto.studentId,
      schoolId: mealPlan.schoolId,
      mealPlanId: dto.mealPlanId,
      startDate: dto.startDate,
      originalEndDate: endDate,
      currentEndDate: endDate,
      totalDays: mealPlan.durationDays,
      remainingDays: mealPlan.durationDays,
      totalAmount: mealPlan.totalPrice,
      status: 'PENDING'
    }
  });
  
  // Step 7: Create subscription_days records
  await db.subscriptionDay.createMany({
    data: schedule.map(day => ({
      subscriptionId: subscription.id,
      scheduledDate: day.date,
      status: 'SCHEDULED'
    }))
  });
  
  return subscription;
}
```

---

## 3. Delivery Schedule Generation

### 3.1 Algorithm

```typescript
interface ScheduleDay {
  date: string;
  dayOfWeek: string;
}

function generateDeliverySchedule(
  startDate: string,
  totalDays: number,
  operatingDays: string[]
): ScheduleDay[] {
  const schedule: ScheduleDay[] = [];
  let currentDate = new Date(startDate);
  let daysGenerated = 0;
  
  while (daysGenerated < totalDays) {
    const dayOfWeek = getDayName(currentDate); // "MON", "TUE", etc.
    
    // Check if this day is an operating day
    if (operatingDays.includes(dayOfWeek)) {
      schedule.push({
        date: formatDate(currentDate),
        dayOfWeek: dayOfWeek
      });
      daysGenerated++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedule;
}

// Helper functions
function getDayName(date: Date): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[date.getDay()];
}

function parseOperatingDays(operatingDaysString: string): string[] {
  // "MON,TUE,WED,THU,FRI" -> ["MON", "TUE", "WED", "THU", "FRI"]
  return operatingDaysString.split(',').map(d => d.trim());
}
```

### 3.2 Example Execution

**Input:**
- Start Date: 2026-03-01 (Sunday)
- Duration: 5 days
- Operating Days: MON, TUE, WED, THU, FRI

**Output:**
```javascript
[
  { date: "2026-03-02", dayOfWeek: "MON" },  // Skip Sunday
  { date: "2026-03-03", dayOfWeek: "TUE" },
  { date: "2026-03-04", dayOfWeek: "WED" },
  { date: "2026-03-05", dayOfWeek: "THU" },
  { date: "2026-03-06", dayOfWeek: "FRI" }
]
```

---

## 4. Pause Management Logic

### 4.1 Create Pause Request

```typescript
interface CreatePauseRequestDTO {
  subscriptionId: string;
  pauseFromDate: string;
  pauseToDate: string;
  reason?: string;
}

async function createPauseRequest(dto: CreatePauseRequestDTO) {
  // Step 1: Validate subscription
  const subscription = await db.subscription.findUnique({
    where: { id: dto.subscriptionId },
    include: { school: true }
  });
  
  if (subscription.status !== 'ACTIVE') {
    throw new Error("Can only pause active subscriptions");
  }
  
  // Step 2: Validate dates
  const today = new Date();
  const pauseFrom = new Date(dto.pauseFromDate);
  const pauseTo = new Date(dto.pauseToDate);
  
  if (pauseFrom < today) {
    throw new Error("Cannot pause past dates");
  }
  
  if (pauseTo <= pauseFrom) {
    throw new Error("End date must be after start date");
  }
  
  if (pauseTo > new Date(subscription.currentEndDate)) {
    throw new Error("Pause dates exceed subscription period");
  }
  
  // Step 3: Check for overlapping pause requests
  const overlapping = await checkOverlappingPauseRequests(
    dto.subscriptionId,
    dto.pauseFromDate,
    dto.pauseToDate
  );
  
  if (overlapping) {
    throw new Error("Overlapping pause request exists");
  }
  
  // Step 4: Calculate affected days
  const operatingDays = parseOperatingDays(subscription.school.operatingDays);
  const affectedDays = calculateAffectedDays(
    dto.pauseFromDate,
    dto.pauseToDate,
    operatingDays
  );
  
  // Step 5: Create pause request
  const pauseRequest = await db.pauseRequest.create({
    data: {
      subscriptionId: dto.subscriptionId,
      parentId: subscription.parentId,
      pauseFromDate: dto.pauseFromDate,
      pauseToDate: dto.pauseToDate,
      pauseDays: affectedDays.length,
      reason: dto.reason,
      status: 'PENDING'
    }
  });
  
  return {
    pauseRequest,
    affectedDays,
    newEndDate: calculateNewEndDate(
      subscription.currentEndDate,
      affectedDays.length
    )
  };
}
```

### 4.2 Calculate Affected Days

```typescript
function calculateAffectedDays(
  fromDate: string,
  toDate: string,
  operatingDays: string[]
): string[] {
  const affectedDays: string[] = [];
  let currentDate = new Date(fromDate);
  const endDate = new Date(toDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = getDayName(currentDate);
    
    if (operatingDays.includes(dayOfWeek)) {
      affectedDays.push(formatDate(currentDate));
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return affectedDays;
}
```

**Example:**
- Pause From: 2026-03-10 (Monday)
- Pause To: 2026-03-14 (Friday)
- Operating Days: MON-FRI

**Result:**
```javascript
affectedDays = [
  "2026-03-10",  // MON
  "2026-03-11",  // TUE
  "2026-03-12",  // WED
  "2026-03-13",  // THU
  "2026-03-14"   // FRI
]
// pauseDays = 5
```

### 4.3 Process Pause Request (Approval)

```typescript
async function approvePauseRequest(pauseRequestId: string, adminId: string) {
  const pauseRequest = await db.pauseRequest.findUnique({
    where: { id: pauseRequestId },
    include: { subscription: { include: { school: true } } }
  });
  
  if (pauseRequest.status !== 'PENDING') {
    throw new Error("Pause request already processed");
  }
  
  // Start transaction
  await db.$transaction(async (tx) => {
    // Step 1: Update pause request status
    await tx.pauseRequest.update({
      where: { id: pauseRequestId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });
    
    // Step 2: Update subscription_days to PAUSED
    await tx.subscriptionDay.updateMany({
      where: {
        subscriptionId: pauseRequest.subscriptionId,
        scheduledDate: {
          gte: pauseRequest.pauseFromDate,
          lte: pauseRequest.pauseToDate
        },
        status: 'SCHEDULED'
      },
      data: {
        status: 'PAUSED'
      }
    });
    
    // Step 3: Calculate new end date
    const operatingDays = parseOperatingDays(
      pauseRequest.subscription.school.operatingDays
    );
    
    const pausedDays = calculateAffectedDays(
      pauseRequest.pauseFromDate,
      pauseRequest.pauseToDate,
      operatingDays
    );
    
    // Step 4: Extend subscription
    const newEndDate = await extendSubscription(
      pauseRequest.subscriptionId,
      pausedDays.length,
      operatingDays,
      tx
    );
    
    // Step 5: Update subscription
    await tx.subscription.update({
      where: { id: pauseRequest.subscriptionId },
      data: {
        currentEndDate: newEndDate,
        pausedDays: {
          increment: pausedDays.length
        }
      }
    });
    
    // Step 6: Mark pause request as processed
    await tx.pauseRequest.update({
      where: { id: pauseRequestId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });
  });
}
```

### 4.4 Extend Subscription

```typescript
async function extendSubscription(
  subscriptionId: string,
  daysToExtend: number,
  operatingDays: string[],
  tx: PrismaTransaction
): Promise<string> {
  // Get current subscription
  const subscription = await tx.subscription.findUnique({
    where: { id: subscriptionId }
  });
  
  // Find the last scheduled day
  const lastDay = await tx.subscriptionDay.findFirst({
    where: { subscriptionId },
    orderBy: { scheduledDate: 'desc' }
  });
  
  // Generate extension schedule
  let currentDate = new Date(lastDay.scheduledDate);
  currentDate.setDate(currentDate.getDate() + 1); // Start from next day
  
  const extensionDays: string[] = [];
  let daysGenerated = 0;
  
  while (daysGenerated < daysToExtend) {
    const dayOfWeek = getDayName(currentDate);
    
    if (operatingDays.includes(dayOfWeek)) {
      extensionDays.push(formatDate(currentDate));
      daysGenerated++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Create new subscription_days
  await tx.subscriptionDay.createMany({
    data: extensionDays.map(date => ({
      subscriptionId: subscriptionId,
      scheduledDate: date,
      status: 'SCHEDULED'
    }))
  });
  
  // Return new end date
  return extensionDays[extensionDays.length - 1];
}
```

**Example:**
- Original End Date: 2026-03-31
- Paused Days: 5
- Operating Days: MON-FRI

**Process:**
1. Last scheduled day: 2026-03-31 (Monday)
2. Generate 5 more operating days starting from 2026-04-01
3. New dates: 2026-04-01, 02, 03, 04, 07 (skip weekend)
4. New End Date: 2026-04-07

---

## 5. Delivery Status Tracking

### 5.1 Mark Delivery as Completed

```typescript
async function markDeliveryCompleted(
  subscriptionId: string,
  date: string
) {
  await db.$transaction(async (tx) => {
    // Update subscription_day
    await tx.subscriptionDay.updateMany({
      where: {
        subscriptionId: subscriptionId,
        scheduledDate: date,
        status: 'SCHEDULED'
      },
      data: {
        status: 'DELIVERED',
        deliveryConfirmedAt: new Date()
      }
    });
    
    // Increment delivered count
    await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        deliveredDays: { increment: 1 },
        remainingDays: { decrement: 1 }
      }
    });
  });
}
```

### 5.2 Check Subscription Completion

```typescript
async function checkAndCompleteSubscription(subscriptionId: string) {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId }
  });
  
  if (subscription.remainingDays === 0 && subscription.status === 'ACTIVE') {
    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
    
    // Send completion notification
    await sendNotification(subscription.parentId, {
      type: 'SUBSCRIPTION_COMPLETED',
      subscriptionId: subscriptionId
    });
  }
}
```

---

## 6. Payment Integration

### 6.1 Activate Subscription After Payment

```typescript
async function activateSubscriptionAfterPayment(
  subscriptionId: string,
  orderId: string
) {
  await db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      activatedAt: new Date(),
      paidAmount: { increment: /* order amount */ }
    }
  });
  
  // Send activation notification
  await sendNotification(subscription.parentId, {
    type: 'SUBSCRIPTION_ACTIVATED',
    subscriptionId: subscriptionId
  });
}
```

---

## 7. Background Jobs

### 7.1 Daily Delivery Job

Runs every day at 6:00 AM to prepare today's delivery list.

```typescript
async function processDailyDeliveries() {
  const today = formatDate(new Date());
  
  // Get all scheduled deliveries for today
  const deliveries = await db.subscriptionDay.findMany({
    where: {
      scheduledDate: today,
      status: 'SCHEDULED'
    },
    include: {
      subscription: {
        include: {
          student: true,
          school: true,
          mealPlan: true
        }
      }
    }
  });
  
  // Group by school
  const deliveriesBySchool = groupBy(deliveries, 'subscription.schoolId');
  
  // Send notifications to school admins/delivery partners
  for (const [schoolId, schoolDeliveries] of Object.entries(deliveriesBySchool)) {
    await notifySchoolDeliveries(schoolId, schoolDeliveries);
  }
  
  // Send reminder to parents
  for (const delivery of deliveries) {
    await sendNotification(delivery.subscription.parentId, {
      type: 'DELIVERY_REMINDER',
      date: today,
      studentName: delivery.subscription.student.fullName
    });
  }
}
```

### 7.2 Subscription Expiry Job

Runs daily to check and mark completed subscriptions.

```typescript
async function processSubscriptionExpiry() {
  const activeSubscriptions = await db.subscription.findMany({
    where: { status: 'ACTIVE' }
  });
  
  for (const subscription of activeSubscriptions) {
    if (subscription.remainingDays === 0) {
      await checkAndCompleteSubscription(subscription.id);
    }
  }
}
```

---

## 8. Edge Cases & Validations

### 8.1 Validations

1. **No past date subscriptions**: Start date >= today
2. **No overlapping pause requests**: Check date ranges
3. **Pause only active subscriptions**: status = 'ACTIVE'
4. **Minimum notice for pause**: 1 day in advance
5. **Cannot pause delivered days**: Only SCHEDULED days
6. **Subscription must be paid**: Payment verification before activation

### 8.2 Edge Cases

1. **Holiday Management**: Schools can mark specific dates as holidays
   - Auto-skip those dates in schedule generation
   - Don't count as operating days

2. **Mid-subscription plan changes**: Not supported in v1
   - User must complete current subscription

3. **Refunds on cancellation**:
   - Refund = (remainingDays / totalDays) × totalAmount
   - Process via payment gateway

4. **Multiple students, same school**:
   - Each student = separate subscription
   - Combine deliveries for logistics

---

## 9. State Machine

### Subscription Status Flow

```
PENDING → [Payment Success] → ACTIVE → [All delivered] → COMPLETED
         ↓                      ↓
    [Payment Failed]      [User cancels]
         ↓                      ↓
     CANCELLED              CANCELLED
```

### Subscription Day Status Flow

```
SCHEDULED → [Pause approved] → PAUSED
          → [Delivered] → DELIVERED
          → [Cancelled] → CANCELLED
```

---

## 10. Performance Optimizations

1. **Batch Operations**: Create subscription_days in bulk
2. **Indexed Queries**: Index on subscriptionId, scheduledDate, status
3. **Caching**: Cache school operating days (rarely changes)
4. **Async Jobs**: Use BullMQ for background processing
5. **Read Replicas**: Use for reporting queries

---

## 11. Testing Scenarios

### Unit Tests
- `generateDeliverySchedule()` with various operating days
- `calculateAffectedDays()` with weekends/holidays
- `extendSubscription()` boundary conditions

### Integration Tests
- Full subscription creation flow
- Pause request → approval → extension
- Payment → activation
- Daily delivery job execution

### Edge Case Tests
- Pause entire subscription period
- Multiple pause requests sequentially
- Subscription starting on non-operating day
- School operating days change mid-subscription

---

## 12. Monitoring & Alerts

### Key Metrics
- Subscription creation rate
- Payment success rate
- Average pause requests per subscription
- Delivery completion rate

### Alerts
- Failed payment webhooks
- Unprocessed pause requests > 24 hours
- Delivery job failures
- Subscription status inconsistencies

---

This subscription engine forms the heart of the platform and must be thoroughly tested before production deployment.
