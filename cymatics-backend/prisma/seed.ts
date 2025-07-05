import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'admin@cymatics.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@cymatics.com',
      isActive: true,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'John Doe',
      company: 'Tech Solutions Inc',
      number: '+1234567890',
      email: 'john@techsolutions.com',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Jane Smith',
      company: 'Creative Agency',
      number: '+1987654321',
      email: 'jane@creativeagency.com',
    },
  });

  console.log('✅ Created clients:', client1.name, client2.name);

  // Create sample outclients
  const outclient1 = await prisma.outclient.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Mike Johnson',
      company: 'Freelance Photography',
      number: '+1122334455',
      email: 'mike@freelance.com',
    },
  });

  console.log('✅ Created outclient:', outclient1.name);

  // Create sample projects
  const project1 = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      code: 'CYM-1',
      name: 'Corporate Event Photography',
      company: 'Tech Solutions Inc',
      type: 'Photography',
      status: 'COMPLETED',
      shootStartDate: new Date('2024-01-15T09:00:00Z'),
      shootEndDate: new Date('2024-01-15T17:00:00Z'),
      amount: 50000,
      location: 'Mumbai, India',
      latitude: 19.0760,
      longitude: 72.8777,
      outsourcing: false,
      reference: 'Annual company event photography',
      clientId: client1.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      code: 'CYM-2',
      name: 'Wedding Videography',
      company: 'Creative Agency',
      type: 'Videography',
      status: 'IN_PROGRESS',
      shootStartDate: new Date('2024-02-20T10:00:00Z'),
      shootEndDate: new Date('2024-02-22T18:00:00Z'),
      amount: 75000,
      location: 'Goa, India',
      latitude: 15.2993,
      longitude: 74.1240,
      outsourcing: true,
      outsourcingAmt: 25000,
      outFor: 'Drone footage',
      outClient: 'Mike Johnson',
      outsourcingPaid: false,
      reference: 'Destination wedding coverage',
      clientId: client2.id,
    },
  });

  console.log('✅ Created projects:', project1.name, project2.name);

  // Create sample income
  const income1 = await prisma.income.create({
    data: {
      date: new Date('2024-01-20'),
      description: 'Payment for corporate event photography',
      amount: 50000,
      note: 'Full payment received',
      projectIncome: true,
      projectId: project1.id,
    },
  });

  const income2 = await prisma.income.create({
    data: {
      date: new Date('2024-02-15'),
      description: 'Advance payment for wedding',
      amount: 37500,
      note: '50% advance payment',
      projectIncome: true,
      projectId: project2.id,
    },
  });

  console.log('✅ Created income entries:', income1.amount, income2.amount);

  // Create sample expenses
  const expense1 = await prisma.expense.create({
    data: {
      date: new Date('2024-01-14'),
      category: 'Equipment',
      description: 'Camera lens rental',
      amount: 5000,
      notes: 'Rented for corporate event',
      projectExpense: true,
      projectId: project1.id,
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      date: new Date('2024-02-18'),
      category: 'Travel',
      description: 'Flight tickets to Goa',
      amount: 12000,
      notes: 'Round trip for wedding shoot',
      projectExpense: true,
      projectId: project2.id,
    },
  });

  console.log('✅ Created expense entries:', expense1.amount, expense2.amount);

  // Create sample assets
  const asset1 = await prisma.asset.create({
    data: {
      date: new Date('2023-06-01'),
      type: 'Camera',
      name: 'Canon EOS R5',
      quantity: 1,
      buyPrice: 350000,
      value: 320000,
      note: 'Primary camera for photography',
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      date: new Date('2023-08-15'),
      type: 'Lens',
      name: 'Canon RF 24-70mm f/2.8L',
      quantity: 1,
      buyPrice: 180000,
      value: 165000,
      note: 'Versatile zoom lens',
    },
  });

  console.log('✅ Created assets:', asset1.name, asset2.name);

  // Create sample entertainment
  const entertainment1 = await prisma.entertainment.create({
    data: {
      date: new Date('2024-01-10T20:00:00Z'),
      type: 'Movie',
      language: 'English',
      rating: 8,
      name: 'The Creator',
      source: 'Netflix',
    },
  });

  console.log('✅ Created entertainment entry:', entertainment1.name);

  // Create sample calendar event
  const calendarEvent1 = await prisma.calendarEvent.create({
    data: {
      title: 'Client Meeting - Tech Solutions',
      startTime: new Date('2024-03-01T14:00:00Z'),
      endTime: new Date('2024-03-01T15:00:00Z'),
    },
  });

  console.log('✅ Created calendar event:', calendarEvent1.title);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
