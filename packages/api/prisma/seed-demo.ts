import { PrismaClient, PlanType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DEMO database with comprehensive data...\n');

  // ======================
  // DEMO TENANTS
  // ======================
  console.log('📦 Creating demo tenants...');

  const fitnessTenant = await prisma.tenant.upsert({
    where: { slug: 'fitpro-demo' },
    update: {},
    create: {
      slug: 'fitpro-demo',
      name: 'FitPro Academy',
      status: 'active',
      theme: {
        primaryColor: '#EF4444',
        secondaryColor: '#F97316',
        accentColor: '#FBBF24',
        logoUrl: 'https://via.placeholder.com/200x50?text=FitPro',
      },
      config: {
        allowedNiches: ['fitness'],
        enabledFeatures: {
          oauth: true,
          analytics: true,
          customDomain: true,
          api: true,
          whiteLabel: true,
        },
        emailSettings: {
          fromName: 'FitPro Academy',
          fromEmail: 'noreply@fitpro-demo.com',
        },
        paymentSettings: {
          currency: 'USD',
          allowedPlans: ['free', 'pro', 'enterprise'],
        },
      },
    },
  });

  const musicTenant = await prisma.tenant.upsert({
    where: { slug: 'musicmaster-demo' },
    update: {},
    create: {
      slug: 'musicmaster-demo',
      name: 'MusicMaster School',
      status: 'active',
      theme: {
        primaryColor: '#8B5CF6',
        secondaryColor: '#EC4899',
        accentColor: '#F472B6',
        logoUrl: 'https://via.placeholder.com/200x50?text=MusicMaster',
      },
      config: {
        allowedNiches: ['music'],
        enabledFeatures: {
          oauth: true,
          analytics: true,
          customDomain: false,
          api: true,
          whiteLabel: true,
        },
        emailSettings: {
          fromName: 'MusicMaster School',
          fromEmail: 'noreply@musicmaster-demo.com',
        },
        paymentSettings: {
          currency: 'USD',
          allowedPlans: ['free', 'starter', 'pro'],
        },
      },
    },
  });

  console.log('✅ Created tenants: FitPro Academy, MusicMaster School\n');

  // ======================
  // USERS
  // ======================
  console.log('👥 Creating demo users...');

  // FitPro Users
  const fitAdminPassword = await argon2.hash('Admin123!');
  const fitAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: fitnessTenant.id,
        email: 'admin@fitpro-demo.com',
      },
    },
    update: {},
    create: {
      tenantId: fitnessTenant.id,
      email: 'admin@fitpro-demo.com',
      passwordHash: fitAdminPassword,
      name: 'Sarah Johnson',
      role: 'admin',
      emailVerified: true,
    },
  });

  const fitCoachPassword = await argon2.hash('Coach123!');
  const fitCoach = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: fitnessTenant.id,
        email: 'coach@fitpro-demo.com',
      },
    },
    update: {},
    create: {
      tenantId: fitnessTenant.id,
      email: 'coach@fitpro-demo.com',
      passwordHash: fitCoachPassword,
      name: 'Mike Thompson',
      role: 'coach',
      emailVerified: true,
    },
  });

  const fitUserPassword = await argon2.hash('User123!');
  const fitUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: fitnessTenant.id,
        email: 'user@fitpro-demo.com',
      },
    },
    update: {},
    create: {
      tenantId: fitnessTenant.id,
      email: 'user@fitpro-demo.com',
      passwordHash: fitUserPassword,
      name: 'Emma Davis',
      role: 'user',
      emailVerified: true,
    },
  });

  // MusicMaster Users
  const musicAdminPassword = await argon2.hash('Admin123!');
  const musicAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: musicTenant.id,
        email: 'admin@musicmaster-demo.com',
      },
    },
    update: {},
    create: {
      tenantId: musicTenant.id,
      email: 'admin@musicmaster-demo.com',
      passwordHash: musicAdminPassword,
      name: 'David Martinez',
      role: 'admin',
      emailVerified: true,
    },
  });

  const musicCoachPassword = await argon2.hash('Coach123!');
  const musicCoach = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: musicTenant.id,
        email: 'coach@musicmaster-demo.com',
      },
    },
    update: {},
    create: {
      tenantId: musicTenant.id,
      email: 'coach@musicmaster-demo.com',
      passwordHash: musicCoachPassword,
      name: 'Lisa Anderson',
      role: 'coach',
      emailVerified: true,
    },
  });

  const musicUserPassword = await argon2.hash('User123!');
  const musicUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: musicTenant.id,
        email: 'user@musicmaster-demo.com',
      },
    },
    update: {},
    create: {
      tenantId: musicTenant.id,
      email: 'user@musicmaster-demo.com',
      passwordHash: musicUserPassword,
      name: 'Alex Rodriguez',
      role: 'user',
      emailVerified: true,
    },
  });

  console.log('✅ Created 6 demo users (2 per tenant)\n');

  // ======================
  // FITNESS TEMPLATES
  // ======================
  console.log('📋 Creating fitness templates...');

  const fitnessTemplates = [
    {
      name: 'Weight Loss - 12 Weeks',
      description: 'Comprehensive 12-week program for sustainable weight loss',
      niche: 'fitness',
      level: 'beginner',
      type: '12-week' as PlanType,
      weeks: 12,
      tags: ['weight-loss', 'beginner', 'cardio', 'strength'],
    },
    {
      name: 'Muscle Building - 16 Weeks',
      description: 'Advanced muscle building program with progressive overload',
      niche: 'fitness',
      level: 'intermediate',
      type: '16-week' as PlanType,
      weeks: 16,
      tags: ['muscle-building', 'strength', 'hypertrophy'],
    },
    {
      name: 'Marathon Training - 20 Weeks',
      description: 'Complete marathon preparation program',
      niche: 'fitness',
      level: 'advanced',
      type: '20-week' as PlanType,
      weeks: 20,
      tags: ['running', 'marathon', 'endurance'],
    },
  ];

  for (const template of fitnessTemplates) {
    await prisma.template.create({
      data: {
        ...template,
        tenantId: fitnessTenant.id,
        createdBy: fitCoach.id,
        isPublic: true,
        rules: {
          maxHighIntensityPerWeek: 2,
          minRestDays: 2,
          maxSessionsPerDay: 1,
          requiresProgressiveOverload: true,
          muscleGroupRecoveryHours: 48,
        },
        aiPromptTemplate: `You are an expert fitness trainer. Generate a {plan_length}-week plan.`,
      },
    });
  }

  console.log(`✅ Created ${fitnessTemplates.length} fitness templates\n`);

  // ======================
  // MUSIC TEMPLATES
  // ======================
  console.log('🎵 Creating music templates...');

  const musicTemplates = [
    {
      name: 'Guitar Beginner - 8 Weeks',
      description: 'Learn guitar fundamentals in 8 weeks',
      niche: 'music',
      level: 'beginner',
      type: '8-week' as PlanType,
      weeks: 8,
      tags: ['guitar', 'beginner', 'chords'],
    },
    {
      name: 'Piano Intermediate - 12 Weeks',
      description: 'Advance your piano skills',
      niche: 'music',
      level: 'intermediate',
      type: '12-week' as PlanType,
      weeks: 12,
      tags: ['piano', 'theory', 'technique'],
    },
  ];

  for (const template of musicTemplates) {
    await prisma.template.create({
      data: {
        ...template,
        tenantId: musicTenant.id,
        createdBy: musicCoach.id,
        isPublic: true,
        rules: {
          minPracticeMinutesPerDay: 30,
          maxPracticeHoursPerDay: 3,
          requiresWarmup: true,
        },
        aiPromptTemplate: `You are an expert music instructor. Generate a {plan_length}-week plan.`,
      },
    });
  }

  console.log(`✅ Created ${musicTemplates.length} music templates\n`);

  // ======================
  // EXERCISES
  // ======================
  console.log('💪 Creating sample exercises...');

  const exercises = [
    {
      tenantId: fitnessTenant.id,
      name: 'Brisk Walking',
      description: 'Moderate pace walking',
      niche: 'fitness',
      level: 'beginner',
      intensity: 'low',
      duration: 30,
      equipment: [],
      tags: ['cardio', 'low-impact'],
    },
    {
      tenantId: fitnessTenant.id,
      name: 'Bodyweight Squats',
      description: 'Basic squat movement',
      niche: 'fitness',
      level: 'beginner',
      intensity: 'moderate',
      sets: 3,
      reps: '10-12',
      equipment: [],
      tags: ['strength', 'legs'],
    },
    {
      tenantId: fitnessTenant.id,
      name: 'Bench Press',
      description: 'Compound chest exercise',
      niche: 'fitness',
      level: 'intermediate',
      intensity: 'high',
      sets: 4,
      reps: '8-10',
      equipment: ['barbell', 'bench'],
      tags: ['strength', 'chest', 'compound'],
    },
  ];

  for (const exercise of exercises) {
    await prisma.exercise.create({ data: exercise });
  }

  console.log(`✅ Created ${exercises.length} sample exercises\n`);

  // ======================
  // USER PROFILES
  // ======================
  console.log('📝 Creating user profiles...');

  const fitUserProfile = await prisma.profile.create({
    data: {
      userId: fitUser.id,
      tenantId: fitnessTenant.id,
      firstName: 'Emma',
      lastName: 'Davis',
      dateOfBirth: new Date('1992-05-15'),
      goals: ['Lose 10kg', 'Improve cardiovascular fitness', 'Build strength'],
      availability: {
        daysPerWeek: 4,
        minutesPerSession: 45,
        preferredDays: ['monday', 'wednesday', 'friday', 'saturday'],
        preferredTime: 'morning',
      },
      equipment: ['dumbbells', 'resistance bands', 'yoga mat'],
      constraints: ['knee issues', 'cannot run on hard surfaces'],
      preferences: {
        niche: 'fitness',
        level: 'beginner',
        focusAreas: ['weight-loss', 'toning'],
      },
      onboardingCompleted: true,
    },
  });

  const musicUserProfile = await prisma.profile.create({
    data: {
      userId: musicUser.id,
      tenantId: musicTenant.id,
      firstName: 'Alex',
      lastName: 'Rodriguez',
      dateOfBirth: new Date('1995-08-22'),
      goals: ['Learn to play 10 songs', 'Master chord transitions', 'Improve finger dexterity'],
      availability: {
        daysPerWeek: 5,
        minutesPerSession: 30,
        preferredDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        preferredTime: 'evening',
      },
      equipment: ['acoustic guitar', 'tuner', 'metronome'],
      constraints: [],
      preferences: {
        niche: 'music',
        level: 'beginner',
        focusAreas: ['guitar', 'chords', 'strumming'],
      },
      onboardingCompleted: true,
    },
  });

  console.log('✅ Created 2 user profiles\n');

  // ======================
  // SAMPLE PLANS
  // ======================
  console.log('📅 Creating sample plans...');

  const samplePlan = await prisma.plan.create({
    data: {
      tenantId: fitnessTenant.id,
      userId: fitUser.id,
      profileId: fitUserProfile.id,
      name: 'Emma\'s Weight Loss Journey',
      description: 'Personalized 12-week weight loss plan',
      type: '12-week',
      weeks: 12,
      startDate: new Date(),
      status: 'active',
      schedule: {
        weeks: [
          {
            weekNumber: 1,
            theme: 'Foundation Building',
            sessions: [
              {
                day: 'monday',
                name: 'Full Body Workout',
                exercises: [
                  { name: 'Brisk Walking', duration: 20 },
                  { name: 'Bodyweight Squats', sets: 3, reps: 10 },
                ],
              },
              {
                day: 'wednesday',
                name: 'Cardio Day',
                exercises: [
                  { name: 'Brisk Walking', duration: 30 },
                ],
              },
            ],
          },
        ],
      },
      metrics: {
        totalSessions: 24,
        completedSessions: 5,
        completionRate: 20.8,
      },
    },
  });

  console.log('✅ Created 1 sample plan\n');

  // ======================
  // WEBHOOKS
  // ======================
  console.log('🔗 Creating sample webhooks...');

  await prisma.webhook.create({
    data: {
      tenantId: fitnessTenant.id,
      url: 'https://webhook.site/demo-fitness',
      events: ['PLAN_GENERATED', 'PLAN_COMPLETED'],
      secret: 'demo_webhook_secret_fitness',
      isActive: true,
    },
  });

  await prisma.webhook.create({
    data: {
      tenantId: musicTenant.id,
      url: 'https://webhook.site/demo-music',
      events: ['USER_REGISTERED', 'PLAN_GENERATED'],
      secret: 'demo_webhook_secret_music',
      isActive: true,
    },
  });

  console.log('✅ Created 2 webhook configurations\n');

  // ======================
  // AUDIT LOGS
  // ======================
  console.log('📜 Creating sample audit logs...');

  await prisma.auditLog.create({
    data: {
      tenantId: fitnessTenant.id,
      userId: fitAdmin.id,
      action: 'CREATE_TEMPLATE',
      resourceType: 'Template',
      resourceId: 'template-123',
      metadata: {
        templateName: 'Weight Loss - 12 Weeks',
        niche: 'fitness',
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: fitnessTenant.id,
      userId: fitUser.id,
      action: 'GENERATE_PLAN',
      resourceType: 'Plan',
      resourceId: samplePlan.id,
      metadata: {
        planType: '12-week',
        profileId: fitUserProfile.id,
      },
    },
  });

  console.log('✅ Created sample audit logs\n');

  // ======================
  // SUMMARY
  // ======================
  console.log('🎉 Demo seeding completed successfully!\n');
  console.log('=' .repeat(60));
  console.log('DEMO CREDENTIALS');
  console.log('=' .repeat(60));
  console.log('\n🏋️  FitPro Academy (fitpro-demo):');
  console.log('   Admin:  admin@fitpro-demo.com / Admin123!');
  console.log('   Coach:  coach@fitpro-demo.com / Coach123!');
  console.log('   User:   user@fitpro-demo.com / User123!');
  console.log('\n🎸  MusicMaster School (musicmaster-demo):');
  console.log('   Admin:  admin@musicmaster-demo.com / Admin123!');
  console.log('   Coach:  coach@musicmaster-demo.com / Coach123!');
  console.log('   User:   user@musicmaster-demo.com / User123!');
  console.log('\n' + '=' .repeat(60));
  console.log('API: http://localhost:3000/api/v1');
  console.log('Swagger: http://localhost:3000/api/docs');
  console.log('MinIO Console: http://localhost:9001 (demo / demo123demo)');
  console.log('=' .repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Demo seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
