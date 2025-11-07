'use client';
import { useState } from 'react';
import { syncMesariEmployees, getMesariTrainingModules } from '../lib/api';

export default function MesariSync() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await syncMesariEmployees();
      setMessage(`✅ ${result.message} (${result.count} employees)`);
    } catch (error) {
      setMessage('❌ Sync failed: ' + error.message);
    }
    setLoading(false);
  };

  const handleGetModules = async () => {
    setLoading(true);
    try {
      const modules = await getMesariTrainingModules();
      setMessage(`✅ Found ${modules.length} training modules`);
    } catch (error) {
      setMessage('❌ Failed to fetch modules: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Mesari Integration</h3>
      
      <div className="space-y-4">
        <button
          onClick={handleSync}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Sync Employees'}
        </button>
        
        <button
          onClick={handleGetModules}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? 'Loading...' : 'Get Training Modules'}
        </button>
      </div>
      
      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          {message}
        </div>
      )}
    </div>
  );
}