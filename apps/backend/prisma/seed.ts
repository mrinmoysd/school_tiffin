import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Admin User
  const adminEmail = 'admin@schooltiffin.com';
  const adminPassword = 'Admin@123'; // Change this in production!

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'System Admin',
        role: UserRole.ADMIN,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    });

    console.log('✅ Admin user created:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${admin.role}`);
  } else {
    console.log('ℹ️  Admin user already exists');

    // Update role to ADMIN if not already
    if (existingAdmin.role !== UserRole.ADMIN) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: UserRole.ADMIN },
      });
      console.log('✅ Updated existing user to ADMIN role');
    }
  }

  // Create a sample school (optional)
  const existingSchool = await prisma.school.findFirst({
    where: { code: 'DEMO-SCHOOL-001' },
  });

  if (!existingSchool) {
    const school = await prisma.school.create({
      data: {
        name: 'Demo Public School',
        code: 'DEMO-SCHOOL-001',
        address: '123 Education Lane, Knowledge City',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        contactEmail: 'contact@demoschool.edu',
        contactPhone: '9876543210',
        operatingDays: 'MON,TUE,WED,THU,FRI',
        isServiceAvailable: true,
      },
    });
    console.log('✅ Demo school created:', school.name);
  } else {
    console.log('ℹ️  Demo school already exists');
  }

  console.log('🌱 Seed completed!');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
