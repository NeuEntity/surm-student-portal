const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('🔍 Checking database connection and column...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check the actual table structure
    console.log('\n📋 Checking learning_materials table structure...');
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'learning_materials'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nColumns in learning_materials table:');
    console.table(columns);
    
    // Check specifically for attachments
    const attachmentsCheck = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'learning_materials' 
      AND column_name = 'attachments';
    `);
    
    if (attachmentsCheck && attachmentsCheck.length > 0) {
      console.log('\n✅ attachments column EXISTS:', attachmentsCheck[0]);
    } else {
      console.log('\n❌ attachments column DOES NOT EXIST');
      console.log('Adding it now...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "learning_materials" ADD COLUMN IF NOT EXISTS "attachments" JSONB;
      `);
      console.log('✅ Column added');
    }
    
    // Try a test query
    console.log('\n🧪 Testing Prisma query...');
    try {
      const test = await prisma.learning_materials.findFirst({
        select: {
          id: true,
          title: true,
          attachments: true,
        },
      });
      console.log('✅ Prisma query successful!');
      console.log('Sample result:', test);
    } catch (error) {
      console.log('❌ Prisma query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

