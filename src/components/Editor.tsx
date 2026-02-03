import React, { useState, useEffect } from 'react';
import db, { type WikiPage } from '../db';
import ReactMarkdown from 'react-markdown';
import { Edit2, Save, Clock, Paperclip, Trash2, Download, FilePlus, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showAttachments, setShowAttachments] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !page) return;

    try {
      await db.putAttachment(page._id, file.name, page._rev!, file, file.type);
      const updatedPage = await db.get(pageId);
      setPage(updatedPage);
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file. Check console for details.');
    }
  };

  const handleDeleteAttachment = async (filename: string) => {
    if (!page || !window.confirm(`Delete ${filename}?`)) return;

    try {
      await db.removeAttachment(page._id, filename, page._rev!);
      const updatedPage = await db.get(pageId);
      setPage(updatedPage);
    } catch (err) {
      console.error('Delete attachment error:', err);
      alert('Failed to delete attachment.');
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const blob = await db.getAttachment(pageId, filename);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file.');
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
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: showAttachments ? 'rgba(99, 102, 241, 0.1)' : 'var(--card-bg)',
              color: showAttachments ? 'var(--accent-color)' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Paperclip size={16} /> Assets ({Object.keys(page._attachments || {}).length})
          </button>

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

      {/* Attachments Panel */}
      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              marginTop: '40px',
              padding: '24px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Paperclip size={18} color="var(--accent-color)" />
                Page Assets
              </div>
              <button onClick={() => setShowAttachments(false)} style={{ padding: '4px', background: 'transparent' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(page._attachments || {}).map(([filename, data]) => (
                <div 
                  key={filename}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '8px 12px', 
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: '0.9rem' }}>{filename}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ({Math.round((data.length || 0) / 1024)} KB)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleDownload(filename)}
                      style={{ padding: '4px', background: 'transparent', color: 'var(--text-secondary)' }}
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteAttachment(filename)}
                      style={{ padding: '4px', background: 'transparent', color: 'var(--text-secondary)' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {Object.keys(page._attachments || {}).length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No assets attached to this page.
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  padding: '12px', 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}>
                  <FilePlus size={18} />
                  <span>Upload Asset</span>
                  <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
