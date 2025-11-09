
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { apiFetch } from '../services/_apiClient';

const DebugPanel: React.FC = () => {
  // Enable debug panel when VITE_DEBUG_PANEL=true or in dev mode
  // For a silent background mode, set VITE_DEBUG_PANEL_HIDDEN=true and toggle visibility with Ctrl+Shift+D
  const DEBUG_ENABLED = (import.meta.env.VITE_DEBUG_PANEL === 'true') || (import.meta.env.DEV === true);
  const DEFAULT_HIDDEN = import.meta.env.VITE_DEBUG_PANEL_HIDDEN === 'true';

  // If debug panel is not enabled, render nothing (safe for production)
  if (!DEBUG_ENABLED) return null;

  const { user, refreshUser } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState<boolean>(() => !DEFAULT_HIDDEN);

  // Keyboard shortcut to toggle panel visibility: Ctrl+Shift+D
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const checkDatabaseDirectly = async () => {
    setIsLoading(true);
    try {
      // Check current session via backend
      const { data: sessionData } = await authService.getSession();
      console.log('Current session:', sessionData);

      if (sessionData?.session?.user) {
        const userId = sessionData.session.user.id;

        const { data: profile, error } = await apiFetch(`/profiles/${userId}`) as any;
        const { data: allProfiles, error: allError } = await apiFetch('/profiles') as any;

        console.log('Direct profile query result:', { profile, error });
        console.log('All profiles:', { allProfiles, allError });

        setDebugInfo({
          sessionUser: sessionData.session.user,
          profileQuery: { profile, error },
          allProfiles: { allProfiles, allError },
          currentUser: user
        });
      }
    } catch (error) {
      console.error('Debug check failed:', error);
      setDebugInfo({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const forceCreateAdminProfile = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await authService.getSession();
      if (sessionData?.session?.user) {
        const userId = sessionData.session.user.id;
        const { data, error } = await apiFetch(`/profiles/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({ id: userId, full_name: sessionData.session.user.email, role: 'admin', updated_at: new Date().toISOString() })
        }) as any;

        console.log('Force create admin result:', { data, error });
        await refreshUser();
      }
    } catch (error) {
      console.error('Force create admin failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If running hidden, perform a silent background check once and expose
  // a tiny debug API on window so developers can trigger actions from the console.
  useEffect(() => {
    if (!DEFAULT_HIDDEN) return;

    // Run a silent check on mount to validate backend connectivity in background
    (async () => {
      try {
        await checkDatabaseDirectly();
      } catch (e) {
        // swallow - debug info already set in checkDatabaseDirectly
      }
    })();

    // Expose small API for manual triggers from browser console
    try {
      (window as any).__debugPanel = {
        checkDatabaseDirectly,
        forceCreateAdminProfile,
        refreshUser,
        getDebugInfo: () => debugInfo,
      };
    } catch (e) {
      // ignore
    }

    return () => {
      try { delete (window as any).__debugPanel; } catch (e) { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
      <h3 className="font-bold text-lg mb-4">🔧 Debug Panel</h3>
      
      <div className="mb-4 text-sm">
        <strong>Current User:</strong><br />
        Email: {user?.email || 'Not logged in'}<br />
        Role: {user?.role || 'undefined'}<br />
        ID: {user?.id || 'undefined'}
      </div>

      <div className="space-y-2">
        <button
          onClick={checkDatabaseDirectly}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : '🔍 Check Database'}
        </button>

        <button
          onClick={forceCreateAdminProfile}
          disabled={isLoading}
          className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : '👨‍💼 Force Create Admin'}
        </button>

        <button
          onClick={refreshUser}
          disabled={isLoading}
          className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 disabled:opacity-50"
        >
          🔄 Refresh User
        </button>
      </div>

      {debugInfo && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;