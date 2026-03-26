import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Image as ImageIcon, BarChart3, Trash2, FileText, Video, Upload, Heart, MessageCircle, Send } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard({ user }) {
  const [memes, setMemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [memeType, setMemeType] = useState('image');
  const [uploadData, setUploadData] = useState({ title: '', description: '', categoryId: '' });
  const [file, setFile] = useState(null);

  // Comments state per meme
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [newComment, setNewComment] = useState({});

  useEffect(() => { fetchData(); }, []);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memesRes, categoriesRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/memes`),
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/stats/categories`)
      ]);
      setMemes(memesRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
      if (categoriesRes.data.length > 0) {
        setUploadData(prev => ({ ...prev, categoryId: categoriesRes.data[0].id }));
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      if (memeType === 'text') {
        await axios.post(`${API_URL}/memes`, {
          title: uploadData.title, description: uploadData.description,
          categoryId: uploadData.categoryId, memeType: 'text'
        }, getHeaders());
      } else {
        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        formData.append('categoryId', uploadData.categoryId);
        formData.append('memeType', memeType);
        if (file) formData.append('file', file);
        await axios.post(`${API_URL}/memes`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowUploadModal(false);
      setUploadData({ title: '', description: '', categoryId: categories[0]?.id || '' });
      setFile(null); setMemeType('image');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload meme');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meme?')) return;
    try {
      await axios.delete(`${API_URL}/memes/${id}`, getHeaders());
      fetchData();
    } catch (err) { setError('Failed to delete meme'); }
  };

  const handleLike = async (memeId) => {
    try {
      const res = await axios.post(`${API_URL}/memes/${memeId}/like`, {}, getHeaders());
      setMemes(prev => prev.map(m => m.id === memeId ? {
        ...m, likeCount: res.data.liked ? m.likeCount + 1 : m.likeCount - 1
      } : m));
    } catch (err) { setError('Failed to like meme'); }
  };

  const toggleComments = async (memeId) => {
    if (expandedComments[memeId]) {
      setExpandedComments(prev => ({ ...prev, [memeId]: false }));
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/memes/${memeId}/comments`);
      setCommentsData(prev => ({ ...prev, [memeId]: res.data }));
      setExpandedComments(prev => ({ ...prev, [memeId]: true }));
    } catch (err) { setError('Failed to load comments'); }
  };

  const handleAddComment = async (memeId) => {
    const content = newComment[memeId];
    if (!content?.trim()) return;
    try {
      await axios.post(`${API_URL}/memes/${memeId}/comments`, { content }, getHeaders());
      setNewComment(prev => ({ ...prev, [memeId]: '' }));
      const res = await axios.get(`${API_URL}/memes/${memeId}/comments`);
      setCommentsData(prev => ({ ...prev, [memeId]: res.data }));
      setMemes(prev => prev.map(m => m.id === memeId ? { ...m, commentCount: m.commentCount + 1 } : m));
    } catch (err) { setError('Failed to add comment'); }
  };

  const filteredMemes = activeFilter === 'All' ? memes : memes.filter(m => m.category === activeFilter);

  const renderMemeMedia = (meme) => {
    if (meme.memeType === 'text') {
      return (
        <div className="meme-text-content">
          <FileText size={28} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-active)', fontWeight: 500, lineHeight: 1.6 }}>{meme.description}</p>
        </div>
      );
    }
    if (meme.memeType === 'video') {
      return (
        <div className="meme-image-wrapper">
          <video controls className="meme-image" style={{ objectFit: 'contain' }}>
            <source src={meme.imageUrl} />
          </video>
        </div>
      );
    }
    return (
      <div className="meme-image-wrapper">
        <img src={meme.imageUrl} alt={meme.title} className="meme-image" onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Invalid+Image+URL' }} />
      </div>
    );
  };

  if (loading) return (
    <div className="container mt-4">
      <div className="page-header">
        <div style={{ height: '3rem', width: '200px', background: 'var(--surface-color)', boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-md)' }}></div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ height: '2.5rem', width: '100px', background: 'var(--surface-color)', boxShadow: 'var(--shadow-outset-sm)', borderRadius: 'var(--radius-md)' }}></div>
          <div style={{ height: '2.5rem', width: '150px', background: 'var(--surface-color)', boxShadow: 'var(--shadow-outset-sm)', borderRadius: 'var(--radius-md)' }}></div>
        </div>
      </div>
      <div className="meme-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="meme-card" style={{ height: '400px', opacity: 0.5 }}>
            <div style={{ margin: '1rem', height: '250px', background: 'var(--surface-color)', boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-md)' }}></div>
            <div style={{ padding: '0 1.5rem', flex: 1 }}>
              <div style={{ height: '1.5rem', width: '60%', background: 'var(--surface-color)', boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}></div>
              <div style={{ height: '1rem', width: '90%', background: 'var(--surface-color)', boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-sm)' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem', color: 'var(--primary-color)', letterSpacing: '-0.02em' }}>Meme Feed</h1>
          <p style={{ fontSize: '1.05rem' }}>Discover the latest and greatest memes.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => setShowStatsModal(true)}><BarChart3 size={18} /> Stats</button>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)} style={{ boxShadow: 'var(--shadow-outset)' }}><Plus size={18} /> Upload Meme</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2.5rem', padding: '0.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-inset)', background: 'var(--surface-color)' }}>
        {['All', ...new Set(categories.map(c => c.name))].map(cat => (
          <button
            key={cat}
            className="btn"
            style={{
              padding: '0.5rem 1.25rem', fontSize: '0.9rem',
              boxShadow: activeFilter === cat ? 'var(--shadow-inset)' : 'none',
              background: activeFilter === cat ? 'transparent' : 'var(--surface-color)',
              color: activeFilter === cat ? 'var(--primary-color)' : 'var(--text-muted)',
              fontWeight: activeFilter === cat ? 600 : 500,
              borderRadius: 'var(--radius-md)',
              border: activeFilter === cat ? 'none' : '1px solid rgba(255,255,255,0.3)'
            }}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="meme-grid">
        {filteredMemes.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 0', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-inset)', margin: '1rem 0' }}>
            <div style={{ display: 'inline-flex', padding: '2rem', borderRadius: '50%', boxShadow: 'var(--shadow-outset)', marginBottom: '2rem', color: 'var(--text-muted)' }}>
              <ImageIcon size={48} style={{ opacity: 0.3 }} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>No memes found in {activeFilter}</h3>
            <p style={{ marginBottom: '2rem' }}>Be the first to upload a meme or try another category!</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" onClick={() => setActiveFilter('All')}>View All Memes</button>
              <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>Upload Now</button>
            </div>
          </div>
        ) : (
          filteredMemes.map(meme => (
            <div key={meme.id} className="meme-card">
              {renderMemeMedia(meme)}
              <div className="meme-content">
                <h3 className="meme-title">{meme.title}</h3>
                {meme.memeType !== 'text' && (
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', flex: 1 }}>{meme.description}</p>
                )}

                {/* Like & Comment Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <button className="btn" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => handleLike(meme.id)}>
                    <Heart size={14} fill={meme.likeCount > 0 ? 'var(--accent-color)' : 'none'} color="var(--accent-color)" />
                    {meme.likeCount}
                  </button>
                  <button className="btn" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => toggleComments(meme.id)}>
                    <MessageCircle size={14} />
                    {meme.commentCount}
                  </button>
                </div>

                {/* Comments Section */}
                {expandedComments[meme.id] && (
                  <div style={{ boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.75rem' }}>
                    {commentsData[meme.id]?.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>No comments yet</p>
                    ) : (
                      commentsData[meme.id]?.map(c => (
                        <div key={c.id} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.author}</span>
                          <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0' }}>{c.content}</p>
                        </div>
                      ))
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        className="form-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', flex: 1 }}
                        placeholder="Add a comment..."
                        value={newComment[meme.id] || ''}
                        onChange={e => setNewComment(prev => ({ ...prev, [meme.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(meme.id)}
                      />
                      <button className="btn" style={{ padding: '0.4rem 0.6rem' }} onClick={() => handleAddComment(meme.id)}>
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="meme-meta">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge">{meme.category || 'Uncategorized'}</span>
                    <span className="badge" style={{ fontSize: '0.65rem' }}>{meme.memeType}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>by {meme.author}</span>
                  </div>
                  {user.name === meme.author && (
                    <button onClick={() => handleDelete(meme.id)} className="btn" style={{ padding: '0.3rem 0.5rem', color: 'var(--danger-color)' }} title="Delete Meme">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Meme</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Meme Type</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {['image', 'video', 'text'].map(type => (
                    <button key={type} type="button" className="btn" style={{
                      flex: 1, boxShadow: memeType === type ? 'var(--shadow-inset)' : 'var(--shadow-outset-sm)',
                      color: memeType === type ? 'var(--primary-color)' : 'var(--text-muted)',
                      fontWeight: memeType === type ? 600 : 400, fontSize: '0.85rem', padding: '0.6rem'
                    }} onClick={() => { setMemeType(type); setFile(null); }}>
                      {type === 'image' && <ImageIcon size={16} />}
                      {type === 'video' && <Video size={16} />}
                      {type === 'text' && <FileText size={16} />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="form-input" value={uploadData.title} onChange={e => setUploadData({ ...uploadData, title: e.target.value })} required />
              </div>
              {memeType !== 'text' && (
                <div className="form-group">
                  <label className="form-label">{memeType === 'image' ? 'Image File' : 'Video File'}</label>
                  <div style={{ boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => document.getElementById('file-upload').click()}>
                    <Upload size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>{file ? file.name : `Click to select a ${memeType} file`}</p>
                    <input id="file-upload" type="file" accept={memeType === 'image' ? 'image/*' : 'video/*'} onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={uploadData.categoryId} onChange={e => setUploadData({ ...uploadData, categoryId: e.target.value })} required>
                  {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{memeType === 'text' ? 'Meme Content' : 'Description (Optional)'}</label>
                <textarea className="form-textarea" rows={memeType === 'text' ? 5 : 3}
                  placeholder={memeType === 'text' ? 'Write your meme text here...' : 'Add a description...'}
                  value={uploadData.description} onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                  required={memeType === 'text'}></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Meme</button>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Category Stats</h2>
              <button className="close-btn" onClick={() => setShowStatsModal(false)}>×</button>
            </div>
            <div style={{ borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              {stats.length === 0 ? <p>No stats available</p> : (
                stats.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: idx < stats.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <span style={{ fontWeight: 500 }}>{s.category}</span>
                    <span className="badge">{s.count} Memes</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
