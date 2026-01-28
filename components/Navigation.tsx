'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

export function Navigation() {
  const pathname = usePathname();
  const { toggleDayNight, isDarkMode } = useTheme();

  const isActive = (path: string) => pathname === path;

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link
              href="/"
              style={{
                color: 'var(--primary)',
                fontSize: '1.1rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            >
              NRT
            </Link>
            <div className="ml-8 flex space-x-1">
              <Link
                href="/entry"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: isActive('/entry') ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  background: isActive('/entry') ? 'var(--surface-elevated)' : 'transparent',
                }}
              >
                Data Entry
              </Link>
              <Link
                href="/clients"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: isActive('/clients') || pathname.startsWith('/clients/') ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  background: isActive('/clients') || pathname.startsWith('/clients/') ? 'var(--surface-elevated)' : 'transparent',
                }}
              >
                Clients
              </Link>
              <Link
                href="/reports"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: isActive('/reports') ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  background: isActive('/reports') ? 'var(--surface-elevated)' : 'transparent',
                }}
              >
                Reports
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Day/Night Toggle */}
            <button
              onClick={toggleDayNight}
              style={{
                padding: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                background: 'var(--surface-elevated)',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
              }}
              title={isDarkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {isDarkMode ? (
                // Sun icon for switching to day mode
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                // Moon icon for switching to night mode
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              padding: '0.25rem 0.75rem',
              background: 'var(--surface-elevated)',
              borderRadius: '999px',
              border: '1px solid var(--border)',
            }}>
              Dev Mode
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
