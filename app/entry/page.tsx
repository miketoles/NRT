import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import prisma from '@/lib/prisma';
import { EntryClient } from './EntryClient';

interface PageProps {
  searchParams: Promise<{ clientId?: string; date?: string }>;
}

export default async function EntryPage({ searchParams }: PageProps) {
  const { clientId, date } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Get all clients with their behaviors
  const clients = await prisma.client.findMany({
    where: { archivedAt: null },
    include: {
      behaviors: {
        where: { archivedAt: null },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Get existing session data if client and date provided
  let existingSession = null;
  if (clientId && date) {
    existingSession = await prisma.session.findUnique({
      where: {
        clientId_sessionDate: {
          clientId,
          sessionDate: new Date(date),
        },
      },
      include: {
        intervals: true,
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Data Entry</h1>
          <p className="text-gray-600 mt-1">Enter scatterplot data for a client session</p>
        </div>

        <EntryClient
          clients={clients}
          initialClientId={clientId}
          initialDate={date}
          existingSession={existingSession}
          userId={(session.user as { id: string }).id}
        />
      </main>
    </div>
  );
}
