import React, { useState, useEffect } from 'react';
import db, { type WikiPage } from '../db';
import ReactMarkdown from 'react-markdown';
import { Edit2, Save, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface EditorProps {
  pageId: string;
  onNavigate?: (pageId: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ pageId, onNavigate }) => {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to process [[Wiki Links]]
  const processWikiLinks = (text: string) => {
    if (!text) return '';
    return text.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      return `[${title}](#/page/${encodeURIComponent(title)})`;
    });
  };

  const handleWikiLinkClick = async (title: string) => {
    try {
      const result = await db.find({
        selector: { type: 'page', title: title },
        limit: 1
      });

      if (result.docs.length > 0) {
        onNavigate?.(result.docs[0]._id);
      } else {
        // Create new page if it doesn't exist
        const id = `page_${Date.now()}`;
        const newPage: WikiPage = {
          _id: id,
          title: title,
          content: `# ${title}\n\nStart writing...`,
          updatedAt: new Date().toISOString(),
          type: 'page'
        };
        await db.put(newPage);
        onNavigate?.(id);
      }
    } catch (err) {
      console.error('Wiki link error:', err);
    }
  };

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const doc = await db.get(pageId);
        setPage(doc);
        setContent(doc.content);
        setTitle(doc.title);
      } catch (err) {
        console.error('Error fetching page:', err);
      }
    };

    fetchPage();
  }, [pageId]);

  const handleSave = async () => {
    if (!page) return;
    setIsSaving(true);
    try {
      const updatedPage = {
        ...page,
        title,
        content,
        updatedAt: new Date().toISOString()
      };
      await db.put(updatedPage);
      const newDoc = await db.get(pageId);
      setPage(newDoc);
      setMode('view');
    } catch (err) {
      console.error('Error saving page:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!page) return <div style={{ padding: '40px' }}>Loading...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      key={pageId}
      style={{
        flex: 1,
        maxWidth: '900px',
        margin: '0 auto',
        padding: '60px 40px',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Clock size={14} />
          Last updated {new Date(page.updatedAt).toLocaleString()}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {mode === 'view' ? (
            <button
              onClick={() => setMode('edit')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Edit2 size={16} /> Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => setMode('view')}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'var(--accent-color)',
                  color: 'white',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {mode === 'edit' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page Title"
            style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700, 
              background: 'transparent', 
              border: 'none', 
              borderBottom: '2px solid var(--border-color)',
              borderRadius: 0,
              padding: '0 0 10px 0',
              width: '100%'
            }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing in markdown..."
            style={{
              minHeight: '60vh',
              background: 'transparent',
              border: 'none',
              fontSize: '1.1rem',
              lineHeight: '1.8',
              resize: 'none',
              fontFamily: 'var(--font-mono)'
            }}
          />
        </div>
      ) : (
        <div className="prose">
          <h1 style={{ marginBottom: '8px' }}>{page.title}</h1>
          <div style={{ width: '60px', height: '4px', background: 'var(--accent-color)', marginBottom: '40px', borderRadius: '2px' }}></div>
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => {
                const href = props.href || '';
                if (href.startsWith('#/page/')) {
                  const title = decodeURIComponent(href.replace('#/page/', ''));
                  return (
                    <a
                      {...props}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleWikiLinkClick(title);
                      }}
                      style={{ color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {props.children}
                    </a>
                  );
                }
                return <a {...props} target="_blank" rel="noopener noreferrer" />;
              }
            }}
          >
            {processWikiLinks(page.content)}
          </ReactMarkdown>
        </div>
      )}
    </motion.div>
  );
};
