import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Image as ImageIcon, BarChart3, Trash2, FileText, Video, Upload } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard({ user }) {
  const [memes, setMemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [memeType, setMemeType] = useState('image');
  const [uploadData, setUploadData] = useState({ title: '', description: '', categoryId: '' });
  const [file, setFile] = useState(null);

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
      if (memeType === 'text') {
        // Text memes — JSON request
        await axios.post(`${API_URL}/memes`, {
          title: uploadData.title,
          description: uploadData.description,
          categoryId: uploadData.categoryId,
          memeType: 'text'
        }, getHeaders());
      } else {
        // Image/Video — FormData request
        const formData = new FormData();
        formData.append('title', uploadData.title);
        formData.append('description', uploadData.description);
        formData.append('categoryId', uploadData.categoryId);
        formData.append('memeType', memeType);
        if (file) {
          formData.append('file', file);
        }
        await axios.post(`${API_URL}/memes`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      setShowUploadModal(false);
      setUploadData({ title: '', description: '', categoryId: categories[0]?.id || '' });
      setFile(null);
      setMemeType('image');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload meme');
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

  const renderMemeMedia = (meme) => {
    if (meme.memeType === 'text') {
      return (
        <div className="meme-text-content">
          <FileText size={28} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-active)', fontWeight: 500, lineHeight: 1.6 }}>
            {meme.description}
          </p>
        </div>
      );
    }
    if (meme.memeType === 'video') {
      return (
        <div className="meme-image-wrapper">
          <video controls className="meme-image" style={{ objectFit: 'contain' }}>
            <source src={meme.imageUrl} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    // Default: image
    return (
      <div className="meme-image-wrapper">
        <img src={meme.imageUrl} alt={meme.title} className="meme-image" onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Invalid+Image+URL' }} />
      </div>
    );
  };

  if (loading) return <div className="container mt-4"><div style={{textAlign: 'center', padding: '3rem'}}>Loading awesome memes...</div></div>;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem', color: 'var(--primary-color)' }}>Meme Feed</h1>
          <p>Discover the latest and greatest memes.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => setShowStatsModal(true)}>
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
              {renderMemeMedia(meme)}
              <div className="meme-content">
                <h3 className="meme-title">{meme.title}</h3>
                {meme.memeType !== 'text' && (
                  <p style={{ fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>{meme.description}</p>
                )}
                <div className="meme-meta">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge">{meme.category || 'Uncategorized'}</span>
                    <span className="badge" style={{ fontSize: '0.65rem' }}>{meme.memeType}</span>
                    <span style={{ color: 'var(--text-muted)' }}>by {meme.author}</span>
                  </div>
                  {user.name === meme.author && (
                    <button 
                      onClick={() => handleDelete(meme.id)}
                      className="btn"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)' }}
                      title="Delete Meme"
                    >
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
              {/* Meme Type Selector */}
              <div className="form-group">
                <label className="form-label">Meme Type</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {['image', 'video', 'text'].map(type => (
                    <button
                      key={type}
                      type="button"
                      className="btn"
                      style={{
                        flex: 1,
                        boxShadow: memeType === type ? 'var(--shadow-inset)' : 'var(--shadow-outset-sm)',
                        color: memeType === type ? 'var(--primary-color)' : 'var(--text-muted)',
                        fontWeight: memeType === type ? 600 : 400,
                        fontSize: '0.85rem',
                        padding: '0.6rem'
                      }}
                      onClick={() => { setMemeType(type); setFile(null); }}
                    >
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
                <input 
                  type="text" 
                  className="form-input" 
                  value={uploadData.title}
                  onChange={e => setUploadData({...uploadData, title: e.target.value})}
                  required 
                />
              </div>

              {/* File input for image/video */}
              {memeType !== 'text' && (
                <div className="form-group">
                  <label className="form-label">{memeType === 'image' ? 'Image File' : 'Video File'}</label>
                  <div style={{ 
                    boxShadow: 'var(--shadow-inset)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '1.5rem', 
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    <Upload size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>
                      {file ? file.name : `Click to select a ${memeType} file`}
                    </p>
                    <input 
                      id="file-upload"
                      type="file" 
                      accept={memeType === 'image' ? 'image/*' : 'video/*'}
                      onChange={e => setFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              )}

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
                <label className="form-label">
                  {memeType === 'text' ? 'Meme Content' : 'Description (Optional)'}
                </label>
                <textarea 
                  className="form-textarea" 
                  rows={memeType === 'text' ? 5 : 3}
                  placeholder={memeType === 'text' ? 'Write your meme text here...' : 'Add a description...'}
                  value={uploadData.description}
                  onChange={e => setUploadData({...uploadData, description: e.target.value})}
                  required={memeType === 'text'}
                ></textarea>
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
