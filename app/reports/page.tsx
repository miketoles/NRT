import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navigation } from '@/components/Navigation';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate trends, heatmaps, and export data</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">Reports Coming Soon</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reports Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            The reports feature will include:
          </p>
          <ul className="text-left max-w-md mx-auto text-gray-600 space-y-2">
            <li>Trend charts showing behavior patterns over time</li>
            <li>Heat maps showing when behaviors occur by time of day</li>
            <li>Behavior comparison charts</li>
            <li>Excel export with embedded charts</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
