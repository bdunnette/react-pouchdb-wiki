import React, { useState } from 'react';
import { syncWithRemote } from '../db';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon, Sun, Moon, Monitor } from 'lucide-react';

export const Settings: React.FC = () => {
  const [remoteUrl, setRemoteUrl] = useState(localStorage.getItem('couchdb_url') || '');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'connected'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('last_sync'));

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>((localStorage.getItem('theme') as any) || 'auto');

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const handleSync = () => {
    if (!remoteUrl) return;
    
    setSyncStatus('syncing');
    localStorage.setItem('couchdb_url', remoteUrl);
    
    try {
      const sync = syncWithRemote(remoteUrl);
      
      sync.on('paused', () => {
        setSyncStatus('connected');
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('last_sync', now);
      });

      sync.on('error', (err: any) => {
        console.error('Sync error:', err);
        setSyncStatus('error');
      });

      sync.on('active', () => setSyncStatus('syncing'));
      
    } catch (err) {
      setSyncStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 40px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Settings</h1>
      
      {/* Appearance Section */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Sun size={24} color="var(--accent-color)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Appearance</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Choose how PouchWiki looks on your device.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { id: 'light', label: 'Light', icon: <Sun size={18} /> },
            { id: 'dark', label: 'Dark', icon: <Moon size={18} /> },
            { id: 'auto', label: 'Auto', icon: <Monitor size={18} /> }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => handleThemeChange(option.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                background: theme === option.id ? 'var(--accent-color)' : 'transparent',
                color: theme === option.id ? 'white' : 'var(--text-primary)',
                border: '1px solid ' + (theme === option.id ? 'var(--accent-color)' : 'var(--border-color)'),
                fontWeight: 500,
              }}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Database size={24} color="var(--accent-color)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>CouchDB Sync</h2>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Sync your wiki across multiple devices by connecting to a CouchDB instance.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Server URL</label>
          <div style={{ position: 'relative' }}>
            <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="https://user:pass@your-couchdb-host/wiki"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncStatus === 'syncing' || !remoteUrl}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px',
            background: syncStatus === 'error' ? '#ef4444' : 'var(--accent-color)',
            color: 'white',
            fontWeight: 600
          }}
        >
          {syncStatus === 'syncing' ? <RefreshCw className="spin" size={18} /> : <RefreshCw size={18} />}
          {syncStatus === 'syncing' ? 'Syncing...' : 'Connect & Sync'}
        </button>

        {syncStatus !== 'idle' && (
          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: syncStatus === 'error' ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}>
            {syncStatus === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>
              {syncStatus === 'error' ? 'Failed to connect. Check URL/CORS.' : 
               syncStatus === 'connected' ? `Connected. Last sync: ${lastSync}` : 'Synchronizing...'}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
