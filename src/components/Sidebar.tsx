import React, { useState, useEffect } from 'react';
import db, { type WikiPage } from '../db';
import { Search, Plus, Book, Settings, ChevronRight, Menu, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  onPageSelect: (pageId: string) => void;
  currentPageId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ onPageSelect, currentPageId }) => {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const result = await db.allDocs({
          include_docs: true,
          attachments: false
        });
        const fetchedPages = result.rows
          .map((row: any) => row.doc)
          .filter((doc: any) => doc && doc.type === 'page') as WikiPage[];
        
        setPages(fetchedPages.sort((a, b) => a.title.localeCompare(b.title)));
      } catch (err) {
        console.error('Error fetching pages:', err);
      }
    };

    fetchPages();

    // Listen for changes
    const changes = db.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).on('change', () => {
      fetchPages();
    });

    return () => changes.cancel();
  }, []);

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNewPage = async () => {
    const id = `page_${Date.now()}`;
    const newPage: WikiPage = {
      _id: id,
      title: 'Untitled Page',
      content: '# New Page\n\nWrite something brilliant...',
      updatedAt: new Date().toISOString(),
      type: 'page'
    };
    try {
      await db.put(newPage);
      onPageSelect(id);
    } catch (err) {
      console.error('Error creating page:', err);
    }
  };

  const deletePage = async (e: React.MouseEvent, page: WikiPage) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${page.title}"?`)) {
      try {
        if (page._rev) {
          await db.remove(page._id, page._rev);
        }
      } catch (err) {
        console.error('Error deleting page:', err);
      }
    }
  };

  return (
    <>
      <button 
        className="mobile-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: isSidebarOpen ? '280px' : '20px',
          zIndex: 100,
          background: 'var(--accent-color)',
          color: 'white',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        style={{
          height: '100vh',
          background: 'var(--sidebar-bg)',
          backdropFilter: 'var(--glass-blur)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex'
            }}>
              <Book size={24} color="white" />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>PouchWiki</h1>
          </div>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px', fontSize: '0.9rem' }}
            />
          </div>

          <button
            onClick={addNewPage}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              background: 'var(--accent-color)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <Plus size={18} /> New Page
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px 12px' }}>
            Documents
          </div>
          {filteredPages.map(page => (
            <div
              key={page._id}
              onClick={() => onPageSelect(page._id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '4px',
                background: currentPageId === page._id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: currentPageId === page._id ? 'var(--accent-color)' : 'var(--text-primary)',
                transition: 'all 0.2s ease'
              }}
              className="sidebar-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <ChevronRight size={14} style={{ opacity: currentPageId === page._id ? 1 : 0.3 }} />
                <span style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontSize: '0.95rem',
                  fontWeight: currentPageId === page._id ? 600 : 400
                }}>
                  {page.title}
                </span>
              </div>
              <button 
                onClick={(e) => deletePage(e, page)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  padding: '4px',
                  display: 'flex',
                  opacity: 0
                }}
                className="delete-btn"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', backdropFilter: 'var(--glass-blur)' }}>
          <button
            onClick={() => onPageSelect('settings')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}
          >
            <Settings size={18} /> Settings
          </button>
        </div>
      </motion.aside>

      <style>{`
        .sidebar-item:hover { background: rgba(255, 255, 255, 0.05) !important; }
        .sidebar-item:hover .delete-btn { opacity: 0.6 !important; }
        .delete-btn:hover { color: #f43f5e !important; opacity: 1 !important; }
        @media (max-width: 768px) {
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </>
  );
};
