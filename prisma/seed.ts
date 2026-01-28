import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create a sample BCBA user
  const bcbaPassword = await bcrypt.hash('bcba123', 10);
  const bcba = await prisma.user.upsert({
    where: { email: 'bcba@example.com' },
    update: {},
    create: {
      email: 'bcba@example.com',
      name: 'Sample BCBA',
      password: bcbaPassword,
      role: 'BCBA',
    },
  });
  console.log('Created BCBA user:', bcba.email);

  // Create a sample client with behaviors
  const client = await prisma.client.upsert({
    where: { id: 'sample-client-1' },
    update: {},
    create: {
      id: 'sample-client-1',
      name: 'Sample Client',
      identifier: 'SC001',
      notes: 'Sample client for demonstration',
    },
  });
  console.log('Created sample client:', client.name);

  // Create sample behaviors for the client
  const behaviors = [
    { name: 'Aggression', description: 'Physical aggression towards others', color: '#ef4444' },
    { name: 'Self-Injury', description: 'Self-injurious behavior', color: '#f97316' },
    { name: 'Elopement', description: 'Attempting to leave designated area', color: '#eab308' },
  ];

  for (const behavior of behaviors) {
    await prisma.behavior.upsert({
      where: { id: `${client.id}-${behavior.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `${client.id}-${behavior.name.toLowerCase().replace(/\s/g, '-')}`,
        clientId: client.id,
        name: behavior.name,
        description: behavior.description,
        color: behavior.color,
      },
    });
    console.log('Created behavior:', behavior.name);
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
