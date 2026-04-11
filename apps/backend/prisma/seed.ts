import {
  DeliveryStatus,
  OrderStatus,
  PauseRequestStatus,
  Prisma,
  PrismaClient,
  SubscriptionStatus,
  TransactionStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import process from 'node:process';

const prisma = new PrismaClient();

const rupees = (amount: number) => new Prisma.Decimal(amount);
const DAY_TO_INDEX: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

function atUtcNoon(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0));
}

function generateOperationalDates(
  startDate: Date,
  totalDays: number,
  operatingDaysCsv: string,
): Date[] {
  const allowedDays = new Set(
    operatingDaysCsv
      .split(',')
      .map(d => d.trim().toUpperCase())
      .map(d => DAY_TO_INDEX[d])
      .filter((d): d is number => typeof d === 'number'),
  );

  const out: Date[] = [];
  let cursor = atUtcNoon(startDate);

  while (out.length < totalDays) {
    if (allowedDays.has(cursor.getUTCDay())) {
      out.push(new Date(cursor));
    }
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    cursor = atUtcNoon(cursor);
  }

  return out;
}

async function resetDatabase() {
  console.log('🧹 Resetting existing data...');

  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.fCMToken.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pauseRequest.deleteMany();
  await prisma.subscriptionDay.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.mealPlanTypeMaster.deleteMany();
  await prisma.student.deleteMany();
  await prisma.cmsPage.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database reset complete');
}

async function main() {
  console.log('🌱 Starting full database seed...');

  // Default behavior is reset+seed so reruns are deterministic.
  // Set SEED_RESET=false if you only want insert/upsert behavior.
  if (process.env.SEED_RESET !== 'false') {
    await resetDatabase();
  }

  await prisma.appSetting.upsert({
    where: { key: 'TAX_PERCENTAGE' },
    update: {
      value: '0',
      description: 'Global tax percentage applied to all orders',
    },
    create: {
      key: 'TAX_PERCENTAGE',
      value: '0',
      description: 'Global tax percentage applied to all orders',
    },
  });

  await prisma.appSetting.upsert({
    where: { key: 'APP_LOGO_URL' },
    update: {
      value: '',
      description: 'Global application logo URL used across admin and mobile clients',
    },
    create: {
      key: 'APP_LOGO_URL',
      value: '',
      description: 'Global application logo URL used across admin and mobile clients',
    },
  });

  const passwords = {
    admin: 'Admin@123',
    schoolAdmin: 'SchoolAdmin@123',
    parentOne: 'Parent@123',
    parentTwo: 'Parent@123',
  };

  const [adminHash, schoolAdminHash, parentOneHash, parentTwoHash] = await Promise.all([
    bcrypt.hash(passwords.admin, 10),
    bcrypt.hash(passwords.schoolAdmin, 10),
    bcrypt.hash(passwords.parentOne, 10),
    bcrypt.hash(passwords.parentTwo, 10),
  ]);

  // 1) Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@schooltiffin.com',
      phoneNumber: '+919900000001',
      passwordHash: adminHash,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const schoolAdmin = await prisma.user.create({
    data: {
      email: 'schooladmin@schooltiffin.com',
      phoneNumber: '+919900000002',
      passwordHash: schoolAdminHash,
      firstName: 'School',
      lastName: 'Operations Admin',
      role: UserRole.SCHOOL_ADMIN,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const parentOne = await prisma.user.create({
    data: {
      email: 'parent1@schooltiffin.com',
      phoneNumber: '+919900000003',
      passwordHash: parentOneHash,
      firstName: 'Amit',
      lastName: 'Sharma',
      role: UserRole.PARENT,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const parentTwo = await prisma.user.create({
    data: {
      email: 'parent2@schooltiffin.com',
      phoneNumber: '+919900000004',
      passwordHash: parentTwoHash,
      firstName: 'Neha',
      lastName: 'Verma',
      role: UserRole.PARENT,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // 2) Schools
  const schoolOne = await prisma.school.create({
    data: {
      name: 'Green Valley Public School',
      code: 'GVPS-001',
      address: 'Sector 18, Navi Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400701',
      contactEmail: 'office@gvps.edu.in',
      contactPhone: '+912212345678',
      operatingDays: 'MON,TUE,WED,THU,FRI',
      isServiceAvailable: true,
      deliveryInstructions: 'Deliver to school cafeteria before 10:30 AM',
    },
  });

  const schoolTwo = await prisma.school.create({
    data: {
      name: 'Sunrise International School',
      code: 'SIS-002',
      address: 'Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      contactEmail: 'admin@sunrise.edu.in',
      contactPhone: '+914012345678',
      operatingDays: 'MON,TUE,WED,THU,FRI,SAT',
      isServiceAvailable: true,
      deliveryInstructions: 'Deliver to block B reception',
    },
  });

  // 3) Students
  const studentOne = await prisma.student.create({
    data: {
      parentId: parentOne.id,
      firstName: 'Riya',
      lastName: 'Sharma',
      grade: '5',
      section: 'A',
      schoolId: schoolOne.id,
      allergies: 'Peanuts',
      dietaryPreferences: 'Vegetarian',
      isActive: true,
    },
  });

  const studentTwo = await prisma.student.create({
    data: {
      parentId: parentOne.id,
      firstName: 'Arjun',
      lastName: 'Sharma',
      grade: '2',
      section: 'B',
      schoolId: schoolOne.id,
      dietaryPreferences: 'No mushrooms',
      isActive: true,
    },
  });

  const studentThree = await prisma.student.create({
    data: {
      parentId: parentTwo.id,
      firstName: 'Ishaan',
      lastName: 'Verma',
      grade: '7',
      section: 'C',
      schoolId: schoolTwo.id,
      dietaryPreferences: 'High protein',
      isActive: true,
    },
  });

  // 4) Meal Plans
  const mealPlanTypes = await prisma.$transaction([
    prisma.mealPlanTypeMaster.upsert({
      where: { code: 'BREAKFAST' },
      update: { displayName: 'Breakfast', description: 'Morning meal plans', sortOrder: 10 },
      create: {
        code: 'BREAKFAST',
        displayName: 'Breakfast',
        description: 'Morning meal plans',
        sortOrder: 10,
      },
    }),
    prisma.mealPlanTypeMaster.upsert({
      where: { code: 'LUNCH' },
      update: { displayName: 'Lunch', description: 'Midday meal plans', sortOrder: 20 },
      create: {
        code: 'LUNCH',
        displayName: 'Lunch',
        description: 'Midday meal plans',
        sortOrder: 20,
      },
    }),
    prisma.mealPlanTypeMaster.upsert({
      where: { code: 'SNACK' },
      update: { displayName: 'Snack', description: 'Light snack meal plans', sortOrder: 30 },
      create: {
        code: 'SNACK',
        displayName: 'Snack',
        description: 'Light snack meal plans',
        sortOrder: 30,
      },
    }),
    prisma.mealPlanTypeMaster.upsert({
      where: { code: 'COMBO' },
      update: { displayName: 'Combo', description: 'Combined meal plans', sortOrder: 40 },
      create: {
        code: 'COMBO',
        displayName: 'Combo',
        description: 'Combined meal plans',
        sortOrder: 40,
      },
    }),
  ]);

  const mealPlanTypeByCode = mealPlanTypes.reduce<Record<string, string>>((acc, type) => {
    acc[type.code] = type.id;
    return acc;
  }, {});

  const mealPlanOne = await prisma.mealPlan.create({
    data: {
      schoolId: schoolOne.id,
      name: 'Standard Lunch Plan',
      description: 'Balanced lunch for weekdays',
      mealPlanTypeId: mealPlanTypeByCode.LUNCH,
      durationDays: 30,
      pricePerDay: rupees(10000),
      totalPrice: rupees(300000),
      currency: 'INR',
      isActive: true,
    },
  });

  const mealPlanTwo = await prisma.mealPlan.create({
    data: {
      schoolId: schoolTwo.id,
      name: 'Premium Combo Plan',
      description: 'Breakfast + lunch combo with fruit',
      mealPlanTypeId: mealPlanTypeByCode.COMBO,
      durationDays: 20,
      pricePerDay: rupees(12000),
      totalPrice: rupees(240000),
      currency: 'INR',
      isActive: true,
    },
  });

  // 5) Menu Items
  await prisma.menuItem.createMany({
    data: [
      {
        mealPlanId: mealPlanOne.id,
        name: 'Dal Rice + Salad',
        dayOfWeek: 'MON',
        dayNumber: 1,
        items: 'Dal, rice, cucumber salad',
        calories: 550,
      },
      {
        mealPlanId: mealPlanOne.id,
        name: 'Rajma Rice',
        dayOfWeek: 'TUE',
        dayNumber: 2,
        items: 'Rajma, jeera rice, curd',
        calories: 600,
      },
      {
        mealPlanId: mealPlanOne.id,
        name: 'Veg Pulao',
        dayOfWeek: 'WED',
        dayNumber: 3,
        items: 'Vegetable pulao, raita',
        calories: 570,
      },
      {
        mealPlanId: mealPlanTwo.id,
        name: 'Idli + Sambar + Fruit',
        dayOfWeek: 'MON',
        dayNumber: 1,
        items: '2 idli, sambar, banana',
        calories: 500,
      },
      {
        mealPlanId: mealPlanTwo.id,
        name: 'Poha + Paneer Wrap',
        dayOfWeek: 'TUE',
        dayNumber: 2,
        items: 'Poha, paneer wrap, apple slices',
        calories: 620,
      },
      {
        mealPlanId: mealPlanTwo.id,
        name: 'Upma + Veg Roll',
        dayOfWeek: 'WED',
        dayNumber: 3,
        items: 'Upma, vegetable roll, orange',
        calories: 590,
      },
    ],
  });

  // 6) Subscriptions
  const activeStart = atUtcNoon(new Date('2026-02-10'));
  const pendingStart = atUtcNoon(new Date('2026-03-10'));
  const completedStart = atUtcNoon(new Date('2026-01-10'));

  const activeEnd = atUtcNoon(new Date('2026-03-24'));
  const pendingEnd = atUtcNoon(new Date('2026-04-24'));
  const completedEnd = atUtcNoon(new Date('2026-02-14'));

  const subActive = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-DEMO-0001',
      parentId: parentOne.id,
      studentId: studentOne.id,
      schoolId: schoolOne.id,
      mealPlanId: mealPlanOne.id,
      startDate: activeStart,
      endDate: activeEnd,
      totalDays: 30,
      deliveredDays: 10,
      pausedDays: 0,
      remainingDays: 20,
      totalPrice: rupees(300000),
      paidAmount: rupees(300000),
      currency: 'INR',
      status: SubscriptionStatus.ACTIVE,
      activatedAt: atUtcNoon(new Date('2026-02-10')),
    },
  });

  const subPending = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-DEMO-0002',
      parentId: parentOne.id,
      studentId: studentTwo.id,
      schoolId: schoolOne.id,
      mealPlanId: mealPlanOne.id,
      startDate: pendingStart,
      endDate: pendingEnd,
      totalDays: 30,
      deliveredDays: 0,
      pausedDays: 0,
      remainingDays: 30,
      totalPrice: rupees(300000),
      paidAmount: rupees(0),
      currency: 'INR',
      status: SubscriptionStatus.PENDING_PAYMENT,
    },
  });

  const subCompleted = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-DEMO-0003',
      parentId: parentTwo.id,
      studentId: studentThree.id,
      schoolId: schoolTwo.id,
      mealPlanId: mealPlanTwo.id,
      startDate: completedStart,
      endDate: completedEnd,
      totalDays: 20,
      deliveredDays: 20,
      pausedDays: 0,
      remainingDays: 0,
      totalPrice: rupees(240000),
      paidAmount: rupees(240000),
      currency: 'INR',
      status: SubscriptionStatus.COMPLETED,
      activatedAt: atUtcNoon(new Date('2026-01-10')),
      completedAt: atUtcNoon(new Date('2026-02-14')),
    },
  });

  // 7) Subscription Days
  const activeDays = generateOperationalDates(activeStart, 30, schoolOne.operatingDays);
  const pendingDays = generateOperationalDates(pendingStart, 30, schoolOne.operatingDays);
  const completedDays = generateOperationalDates(completedStart, 20, schoolTwo.operatingDays);

  await prisma.subscriptionDay.createMany({
    data: [
      ...activeDays.map((date, idx) => ({
        subscriptionId: subActive.id,
        scheduledDate: date,
        status: idx < 10 ? DeliveryStatus.DELIVERED : DeliveryStatus.SCHEDULED,
        deliveryConfirmedAt: idx < 10 ? new Date(date.getTime() + 60 * 60 * 1000) : null,
        notes: idx < 10 ? 'Delivered on time' : null,
      })),
      ...pendingDays.map(date => ({
        subscriptionId: subPending.id,
        scheduledDate: date,
        status: DeliveryStatus.SCHEDULED,
        deliveryConfirmedAt: null,
        notes: null,
      })),
      ...completedDays.map(date => ({
        subscriptionId: subCompleted.id,
        scheduledDate: date,
        status: DeliveryStatus.DELIVERED,
        deliveryConfirmedAt: new Date(date.getTime() + 60 * 60 * 1000),
        notes: 'Completed delivery',
      })),
    ],
  });

  // 8) Pause Requests
  await prisma.pauseRequest.createMany({
    data: [
      {
        subscriptionId: subActive.id,
        parentId: parentOne.id,
        startDate: atUtcNoon(new Date('2026-03-18')),
        endDate: atUtcNoon(new Date('2026-03-21')),
        pauseDays: 3,
        affectedDays: 3,
        newEndDate: atUtcNoon(new Date('2026-03-27')),
        reason: 'Family trip',
        status: PauseRequestStatus.PENDING,
      },
      {
        subscriptionId: subActive.id,
        parentId: parentOne.id,
        startDate: atUtcNoon(new Date('2026-02-24')),
        endDate: atUtcNoon(new Date('2026-02-26')),
        pauseDays: 2,
        affectedDays: 2,
        newEndDate: atUtcNoon(new Date('2026-03-26')),
        reason: 'Medical leave',
        status: PauseRequestStatus.APPROVED,
        approvedBy: admin.id,
        approvedAt: atUtcNoon(new Date('2026-02-23')),
      },
    ],
  });

  // 9) Orders
  const orderPaid = await prisma.order.create({
    data: {
      orderNumber: 'ORD-DEMO-0001',
      subscriptionId: subActive.id,
      parentId: parentOne.id,
      amount: rupees(300000),
      taxAmount: rupees(0),
      discountAmount: rupees(0),
      finalAmount: rupees(300000),
      currency: 'INR',
      status: OrderStatus.PAID,
      paymentMethod: 'RAZORPAY',
      paymentGatewayOrderId: 'rzp_order_demo_0001',
      paidAt: atUtcNoon(new Date('2026-02-10')),
    },
  });

  const orderPending = await prisma.order.create({
    data: {
      orderNumber: 'ORD-DEMO-0002',
      subscriptionId: subPending.id,
      parentId: parentOne.id,
      amount: rupees(300000),
      taxAmount: rupees(0),
      discountAmount: rupees(0),
      finalAmount: rupees(300000),
      currency: 'INR',
      status: OrderStatus.PENDING,
      paymentMethod: 'RAZORPAY',
      paymentGatewayOrderId: 'rzp_order_demo_0002',
    },
  });

  const orderCompleted = await prisma.order.create({
    data: {
      orderNumber: 'ORD-DEMO-0003',
      subscriptionId: subCompleted.id,
      parentId: parentTwo.id,
      amount: rupees(240000),
      taxAmount: rupees(0),
      discountAmount: rupees(0),
      finalAmount: rupees(240000),
      currency: 'INR',
      status: OrderStatus.PAID,
      paymentMethod: 'RAZORPAY',
      paymentGatewayOrderId: 'rzp_order_demo_0003',
      paidAt: atUtcNoon(new Date('2026-01-10')),
    },
  });

  // 10) Payment Transactions
  await prisma.paymentTransaction.createMany({
    data: [
      {
        orderId: orderPaid.id,
        transactionId: 'TXN-DEMO-0001',
        paymentGateway: 'RAZORPAY',
        gatewayTransactionId: 'pay_demo_0001',
        amount: rupees(300000),
        currency: 'INR',
        status: TransactionStatus.SUCCESS,
      },
      {
        orderId: orderPending.id,
        transactionId: 'TXN-DEMO-0002',
        paymentGateway: 'RAZORPAY',
        gatewayTransactionId: null,
        amount: rupees(300000),
        currency: 'INR',
        status: TransactionStatus.INITIATED,
      },
      {
        orderId: orderCompleted.id,
        transactionId: 'TXN-DEMO-0003',
        paymentGateway: 'RAZORPAY',
        gatewayTransactionId: 'pay_demo_0003',
        amount: rupees(240000),
        currency: 'INR',
        status: TransactionStatus.SUCCESS,
      },
    ],
  });

  // 11) Tokens / Notifications
  await prisma.refreshToken.createMany({
    data: [
      {
        userId: admin.id,
        token: 'seed-refresh-admin-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: parentOne.id,
        token: 'seed-refresh-parent1-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  await prisma.fCMToken.createMany({
    data: [
      {
        userId: parentOne.id,
        token: 'seed-fcm-parent1-android',
        device: 'Android',
      },
      {
        userId: parentTwo.id,
        token: 'seed-fcm-parent2-ios',
        device: 'iOS',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: parentOne.id,
        title: 'Subscription Activated',
        body: 'Your subscription SUB-DEMO-0001 is active now.',
        notificationType: 'SUBSCRIPTION',
        referenceType: 'SUBSCRIPTION',
        referenceId: subActive.id,
        isSent: true,
        sentAt: new Date(),
      },
      {
        userId: admin.id,
        title: 'New Pause Request',
        body: 'A new pause request is pending approval.',
        notificationType: 'PAUSE_REQUEST',
        referenceType: 'PAUSE_REQUEST',
        isSent: true,
        sentAt: new Date(),
      },
    ],
  });

  // 12) CMS
  await prisma.cmsPage.upsert({
    where: { slug: 'about-us' },
    update: {
      title: 'About School Tiffin',
      content: '<h1>About Us</h1><p>Healthy meals delivered for school children.</p>',
      isPublished: true,
      publishedAt: new Date(),
      createdBy: admin.id,
    },
    create: {
      slug: 'about-us',
      title: 'About School Tiffin',
      content: '<h1>About Us</h1><p>Healthy meals delivered for school children.</p>',
      isPublished: true,
      publishedAt: new Date(),
      createdBy: admin.id,
    },
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'terms-and-conditions' },
    update: {
      title: 'Terms and Conditions',
      content: '<h1>Terms</h1><p>These are sample terms for demo purposes.</p>',
      isPublished: true,
      publishedAt: new Date(),
      createdBy: admin.id,
    },
    create: {
      slug: 'terms-and-conditions',
      title: 'Terms and Conditions',
      content: '<h1>Terms</h1><p>These are sample terms for demo purposes.</p>',
      isPublished: true,
      publishedAt: new Date(),
      createdBy: admin.id,
    },
  });

  // 13) Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SEED_RUN',
        entityType: 'SYSTEM',
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
      },
      {
        userId: schoolAdmin.id,
        action: 'VIEW_DASHBOARD',
        entityType: 'ADMIN',
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
      },
    ],
  });

  console.log('');
  console.log('✅ Seed completed successfully');
  console.log('-----------------------------------');
  console.log('Login credentials:');
  console.log(`Admin       : admin@schooltiffin.com / ${passwords.admin}`);
  console.log(`School Admin: schooladmin@schooltiffin.com / ${passwords.schoolAdmin}`);
  console.log(`Parent #1   : parent1@schooltiffin.com / ${passwords.parentOne}`);
  console.log(`Parent #2   : parent2@schooltiffin.com / ${passwords.parentTwo}`);
  console.log('-----------------------------------');
}

main()
  .catch(error => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
