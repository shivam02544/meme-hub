import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Image as ImageIcon, BarChart3, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard({ user }) {
  const [memes, setMemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', imageUrl: '', description: '', categoryId: '' });

  useEffect(() => {
    fetchData();
  }, []);

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
      await axios.post(`${API_URL}/memes`, uploadData, getHeaders());
      setShowUploadModal(false);
      setUploadData({ title: '', imageUrl: '', description: '', categoryId: categories[0]?.id || '' });
      fetchData();
    } catch (err) {
      setError('Failed to upload meme');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meme?')) return;
    try {
      await axios.delete(`${API_URL}/memes/${id}`, getHeaders());
      fetchData();
    } catch (err) {
      setError('Failed to delete meme');
    }
  };

  if (loading) return <div className="container mt-4"><div style={{textAlign: 'center', padding: '3rem'}}>Loading awesome memes...</div></div>;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="auth-title" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>Meme Feed</h1>
          <p>Discover the latest and greatest memes.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => setShowStatsModal(true)}>
            <BarChart3 size={18} /> Stats
          </button>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Plus size={18} /> Upload Meme
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="meme-grid">
        {memes.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3>No memes found</h3>
            <p>Be the first to upload a meme!</p>
          </div>
        ) : (
          memes.map(meme => (
            <div key={meme.id} className="meme-card">
              <div className="meme-image-wrapper">
                <img src={meme.imageUrl} alt={meme.title} className="meme-image" onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Invalid+Image+URL' }} />
              </div>
              <div className="meme-content">
                <h3 className="meme-title">{meme.title}</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>{meme.description}</p>
                <div className="meme-meta">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge">{meme.category || 'Uncategorized'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>by {meme.author}</span>
                  </div>
                  {user.name === meme.author && (
                    <button 
                      onClick={() => handleDelete(meme.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.25rem' }}
                      title="Delete Meme"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Meme</h2>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={uploadData.title}
                  onChange={e => setUploadData({...uploadData, title: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://example.com/meme.jpg"
                  value={uploadData.imageUrl}
                  onChange={e => setUploadData({...uploadData, imageUrl: e.target.value})}
                  required 
                />
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Provide a direct link to an image.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select"
                  value={uploadData.categoryId}
                  onChange={e => setUploadData({...uploadData, categoryId: e.target.value})}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  rows="3"
                  value={uploadData.description}
                  onChange={e => setUploadData({...uploadData, description: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Meme</button>
            </form>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Category Stats</h2>
              <button className="close-btn" onClick={() => setShowStatsModal(false)}>×</button>
            </div>
            <div style={{ background: 'var(--surface-lighter)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              {stats.length === 0 ? <p>No stats available</p> : (
                stats.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: idx < stats.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <span style={{ fontWeight: 500 }}>{s.category}</span>
                    <span className="badge" style={{ background: 'var(--primary-color)', color: 'white' }}>{s.count} Memes</span>
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
