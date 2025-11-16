import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Demo Company',
      status: 'active',
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        logoUrl: 'https://via.placeholder.com/200x50?text=Demo+Logo',
      },
      config: {
        allowedNiches: ['fitness', 'music', 'study', 'skills'],
        enabledFeatures: {
          oauth: true,
          analytics: true,
          customDomain: false,
          api: true,
          whiteLabel: true,
        },
        emailSettings: {
          fromName: 'Demo PlanMaker',
          fromEmail: 'noreply@demo.planmaker.io',
        },
        paymentSettings: {
          currency: 'BRL',
          allowedPlans: ['free', 'starter', 'pro'],
        },
      },
    },
  });

  console.log('✅ Created tenant:', demoTenant.slug);

  // Create admin user
  const adminPassword = await argon2.hash('admin123');
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'admin@demo.com',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'admin@demo.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'admin',
      emailVerified: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create test user
  const testPassword = await argon2.hash('test123');
  const testUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'test@demo.com',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'test@demo.com',
      passwordHash: testPassword,
      name: 'Test User',
      role: 'user',
      emailVerified: true,
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create fitness template
  const fitnessTemplate = await prisma.template.create({
    data: {
      tenantId: demoTenant.id,
      createdBy: adminUser.id,
      name: 'Beginner Weight Loss - 12 Weeks',
      description: 'A comprehensive 12-week program for beginners focused on sustainable weight loss',
      niche: 'fitness',
      level: 'beginner',
      type: '12-week',
      weeks: 12,
      isPublic: true,
      tags: ['weight-loss', 'beginner', 'cardio', 'strength'],
      rules: {
        maxHighIntensityPerWeek: 2,
        minRestDays: 2,
        maxSessionsPerDay: 1,
        requiresProgressiveOverload: true,
        muscleGroupRecoveryHours: 48,
      },
      aiPromptTemplate: `You are an expert fitness trainer specialized in {niche} for {level} users.
Generate a {plan_length}-week plan for the following user profile:
- Goals: {goals}
- Time availability: {availability}
- Equipment: {equipment}
- Constraints: {constraints}

Rules:
1) No more than {max_high_intensity_per_week} high intensity sessions per week
2) Minimum {min_rest_days} rest days per week
3) Progressive overload principle for strength training
4) 48h recovery for same muscle groups

Output ONLY valid JSON following this schema: {schema}`,
    },
  });

  console.log('✅ Created template:', fitnessTemplate.name);

  // Create sample exercises
  const exercises = [
    {
      name: 'Brisk Walking',
      description: 'Moderate pace walking to improve cardiovascular fitness',
      niche: 'fitness',
      level: 'beginner',
      intensity: 'low',
      duration: 30,
      equipment: [],
      tags: ['cardio', 'low-impact', 'outdoor'],
    },
    {
      name: 'Bodyweight Squats',
      description: 'Basic squat movement for lower body strength',
      niche: 'fitness',
      level: 'beginner',
      intensity: 'moderate',
      sets: 3,
      reps: '10-12',
      equipment: [],
      tags: ['strength', 'legs', 'bodyweight'],
    },
    {
      name: 'Push-ups (Modified)',
      description: 'Modified push-ups on knees for upper body strength',
      niche: 'fitness',
      level: 'beginner',
      intensity: 'moderate',
      sets: 3,
      reps: '8-10',
      equipment: [],
      tags: ['strength', 'chest', 'arms', 'bodyweight'],
    },
    {
      name: 'Plank Hold',
      description: 'Core stability exercise',
      niche: 'fitness',
      level: 'beginner',
      intensity: 'moderate',
      sets: 3,
      reps: '20-30 seconds',
      equipment: ['yoga mat'],
      tags: ['core', 'stability', 'bodyweight'],
    },
  ];

  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: {
        ...exercise,
        tenantId: demoTenant.id,
      },
    });
  }

  console.log(`✅ Created ${exercises.length} sample exercises`);

  console.log('🎉 Seeding completed successfully!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@demo.com / admin123');
  console.log('User: test@demo.com / test123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
