import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { Settings } from './components/Settings'
import db from './db'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen } from 'lucide-react'

function App() {
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Apply saved theme on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme !== 'auto') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const result = await db.allDocs({ include_docs: true });
        const firstPage = result.rows.find((row: any) => !row.id.startsWith('_'));
        
        if (!firstPage) {
          // Create initial welcome page
          const welcomePage = {
            _id: 'page_welcome',
            title: 'Welcome to PouchWiki',
            content: '# Welcome to your new Wiki!\n\nThis is a local-first wiki powered by **PouchDB**.\n\n### Key Features:\n- **Local-first**: Works offline, stores data in your browser.\n- **Sync**: Connect to a CouchDB instance in Settings to sync across devices.\n- **Markdown**: Use full markdown syntax for your notes.\n\nEnjoy writing!',
            updatedAt: new Date().toISOString(),
            type: 'page' as const
          };
          await db.put(welcomePage);
          setCurrentPageId('page_welcome');
        } else {
          setCurrentPageId(firstPage.id);
        }

        // Auto-start sync if URL is available
        const remoteUrl = localStorage.getItem('couchdb_url');
        if (remoteUrl) {
          import('./db').then(({ syncWithRemote }) => {
            syncWithRemote(remoteUrl);
          });
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  if (isInitializing) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ color: 'var(--accent-color)' }}
        >
          <BookOpen size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Sidebar onPageSelect={setCurrentPageId} currentPageId={currentPageId} />
      
      <main style={{ flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {currentPageId === 'settings' ? (
            <Settings key="settings" />
          ) : currentPageId ? (
            <Editor key={currentPageId} pageId={currentPageId} onNavigate={setCurrentPageId} />
          ) : (
            <div key="empty" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Select a page or create a new one to get started.
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
