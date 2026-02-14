const { execSync } = require('child_process');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

async function safeMigrate() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  WARNING: Running migration in PRODUCTION');
    console.log('📋 Pre-migration checklist:');
    console.log('  1. Database backup completed? ');
    console.log('  2. Migration tested in staging?');
    console.log('  3. Team notified?');
    console.log('  4. Rollback plan ready?');
    
    return new Promise((resolve) => {
      readline.question('\n✅ Proceed with migration? (yes/no): ', (answer) => {
        readline.close();
        if (answer.toLowerCase() === 'yes') {
          console.log('🚀 Running migration...');
          try {
            execSync('cd apps/backend && npx prisma migrate deploy', { stdio: 'inherit' });
            console.log('✅ Migration completed!');
          } catch (error) {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
          }
        } else {
          console.log('❌ Migration cancelled');
          process.exit(0);
        }
        resolve();
      });
    });
  } else {
    console.log('🚀 Running development migration...');
    try {
      execSync('cd apps/backend && npx prisma migrate dev', { stdio: 'inherit' });
      console.log('✅ Migration completed!');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }
}

safeMigrate().catch(console.error);
