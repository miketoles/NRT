'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Behavior {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

interface BehaviorListProps {
  clientId: string;
  behaviors: Behavior[];
}

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

export function BehaviorList({ clientId, behaviors }: BehaviorListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddBehavior = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      clientId,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      color: formData.get('color') as string || undefined,
    };

    try {
      const res = await fetch('/api/behaviors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add behavior');
      }

      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBehavior = async (behaviorId: string) => {
    if (!confirm('Are you sure you want to archive this behavior?')) {
      return;
    }

    try {
      const res = await fetch(`/api/behaviors/${behaviorId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete behavior');
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div>
      {behaviors.length === 0 && !showForm ? (
        <p className="text-gray-500 text-sm mb-4">No behaviors configured yet.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {behaviors.map((behavior) => (
            <li
              key={behavior.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: behavior.color || '#6b7280' }}
                />
                <div>
                  <p className="font-medium text-gray-900">{behavior.name}</p>
                  {behavior.description && (
                    <p className="text-sm text-gray-500">{behavior.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteBehavior(behavior.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Archive
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form onSubmit={handleAddBehavior} className="space-y-4 border-t pt-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="behaviorName" className="block text-sm font-medium text-gray-700 mb-1">
              Behavior Name *
            </label>
            <input
              id="behaviorName"
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Aggression, Elopement"
            />
          </div>

          <div>
            <label htmlFor="behaviorDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              id="behaviorDescription"
              name="description"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <label key={color.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color.value}
                    className="sr-only peer"
                    defaultChecked={color.value === '#3b82f6'}
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-gray-900 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-gray-400"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Behavior'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          + Add Behavior
        </button>
      )}
    </div>
  );
}
