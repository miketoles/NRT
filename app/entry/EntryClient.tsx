'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ScatterplotGrid } from '@/components/ScatterplotGrid';
import { IntervalValue } from '@/lib/types';

interface Behavior {
  id: string;
  name: string;
  color: string | null;
}

interface Client {
  id: string;
  name: string;
  behaviors: Behavior[];
}

interface ExistingSession {
  id: string;
  intervals: {
    behaviorId: string;
    intervalIndex: number;
    value: string;
  }[];
}

interface EntryClientProps {
  clients: Client[];
  initialClientId?: string;
  initialDate?: string;
  existingSession: ExistingSession | null;
  userId: string;
}

export function EntryClient({
  clients,
  initialClientId,
  initialDate,
  existingSession
}: EntryClientProps) {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  const [selectedClientId, setSelectedClientId] = useState(initialClientId || clients[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(initialDate || today);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Handle client/date change - navigate to new URL
  const handleClientChange = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    router.push(`/entry?clientId=${clientId}&date=${selectedDate}`);
  }, [router, selectedDate]);

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    if (selectedClientId) {
      router.push(`/entry?clientId=${selectedClientId}&date=${date}`);
    }
  }, [router, selectedClientId]);

  // Save handler
  const handleSave = useCallback(async (intervals: { behaviorId: string; intervalIndex: number; value: IntervalValue }[]) => {
    if (!selectedClientId || !selectedDate) {
      setMessage({ type: 'error', text: 'Please select a client and date' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          sessionDate: selectedDate,
          intervals: intervals.filter(i => i.value), // Only send non-empty values
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save session');
      }

      setMessage({ type: 'success', text: 'Session saved successfully!' });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save session'
      });
    } finally {
      setSaving(false);
    }
  }, [selectedClientId, selectedDate]);

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 mb-4">No clients found. Add a client first.</p>
        <a href="/clients/new" className="text-blue-600 hover:text-blue-700">
          Add Client
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client/Date Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              id="client"
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.behaviors.length} behaviors)
                </option>
              ))}
            </select>
          </div>

          <div className="w-[200px]">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Grid */}
      {selectedClient ? (
        selectedClient.behaviors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">
              No behaviors configured for {selectedClient.name}.
            </p>
            <a
              href={`/clients/${selectedClient.id}`}
              className="text-blue-600 hover:text-blue-700"
            >
              Add Behaviors
            </a>
          </div>
        ) : (
          <ScatterplotGrid
            key={`${selectedClientId}-${selectedDate}`}
            behaviors={selectedClient.behaviors}
            initialIntervals={existingSession?.intervals.map(i => ({
              behaviorId: i.behaviorId,
              intervalIndex: i.intervalIndex,
              value: i.value as IntervalValue,
            })) || []}
            onSave={handleSave}
            saving={saving}
          />
        )
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Select a client to begin.</p>
        </div>
      )}
    </div>
  );
}
