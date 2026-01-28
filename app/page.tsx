import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';
import prisma from '@/lib/prisma';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Get quick stats
  const [clientCount, recentSessions] = await Promise.all([
    prisma.client.count({ where: { archivedAt: null } }),
    prisma.session.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        enteredBy: true,
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {session.user?.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Scatterplot Data Platform - Track and analyze behavior data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/entry"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Quick Entry
            </h2>
            <p className="text-gray-600 text-sm">
              Enter behavior data using the scatterplot grid
            </p>
          </Link>

          <Link
            href="/clients"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Clients
            </h2>
            <p className="text-gray-600 text-sm">
              {clientCount} active client{clientCount !== 1 ? 's' : ''}
            </p>
          </Link>

          <Link
            href="/reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Reports
            </h2>
            <p className="text-gray-600 text-sm">
              Generate trends, heatmaps, and exports
            </p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentSessions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No sessions recorded yet. Start by entering data!
              </div>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.client.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Session date: {new Date(session.sessionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Entered by {session.enteredBy.name}</p>
                      <p>{new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
