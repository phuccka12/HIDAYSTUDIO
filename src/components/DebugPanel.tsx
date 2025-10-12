import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { apiFetch } from '../services/_apiClient';

const DebugPanel: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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