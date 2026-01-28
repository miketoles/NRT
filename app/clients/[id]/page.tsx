import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import prisma from '@/lib/prisma';
import { ClientForm } from './ClientForm';
import { BehaviorList } from './BehaviorList';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      behaviors: {
        where: { archivedAt: null },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/clients" className="text-blue-600 hover:text-blue-700 text-sm">
            &larr; Back to Clients
          </Link>
          <div className="flex justify-between items-center mt-2">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <Link
              href={`/entry?clientId=${client.id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Enter Data
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h2>
            <ClientForm client={client} />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Behaviors</h2>
            <BehaviorList clientId={client.id} behaviors={client.behaviors} />
          </div>
        </div>
      </main>
    </div>
  );
}
