import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, BarChart3, Search, TrendingUp, Clock, Image as ImageIcon, Video, FileText, Upload } from 'lucide-react';
import MemeCard from '../components/MemeCard';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard({ user }) {
  const [memes, setMemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' or 'trending'

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [memeType, setMemeType] = useState('image');
  const [uploadData, setUploadData] = useState({ title: '', description: '', categoryId: '' });
  const [file, setFile] = useState(null);

  // Note: uploadData, categories, stats are still needed here

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeFilter, sortOrder]);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const catObj = categories.find(c => c.name === activeFilter);
      const params = {
        q: searchTerm,
        sort: sortOrder,
        categoryId: catObj ? catObj.id : undefined
      };

      const [memesRes, categoriesRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/memes`, { params }),
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/stats/categories`)
      ]);
      setMemes(memesRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
      if (categoriesRes.data.length > 0 && !uploadData.categoryId) {
        setUploadData(prev => ({ ...prev, categoryId: categoriesRes.data[0].id }));
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
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
    } catch (err) { 
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      setError('Failed to like meme'); 
    }
  };

  const displayedMemes = memes;

  // renderMemeMedia moved to MemeCard

  if (loading && memes.length === 0) return (
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
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.25rem', color: 'var(--primary-color)', letterSpacing: '-0.02em' }}>Meme Feed</h1>
          <p style={{ fontSize: '1.05rem' }}>Discover the latest and greatest memes.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn" onClick={() => setShowStatsModal(true)}><BarChart3 size={18} /> Stats</button>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)} style={{ boxShadow: 'var(--shadow-outset)' }}><Plus size={18} /> Upload Meme</button>
        </div>
      </div>

      {/* Search & Sort Bar */}
      <div className="control-bar">
        <div className="search-wrapper">
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search memes by title or description..."
            style={{ paddingLeft: '3rem', fontSize: '1.05rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sort-tabs">
          <button
            className="btn"
            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', boxShadow: sortOrder === 'latest' ? 'var(--shadow-outset-sm)' : 'none', background: sortOrder === 'latest' ? 'var(--surface-color)' : 'transparent', color: sortOrder === 'latest' ? 'var(--primary-color)' : 'var(--text-muted)' }}
            onClick={() => setSortOrder('latest')}
          >
            <Clock size={16} /> Latest
          </button>
          <button
            className="btn"
            style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', boxShadow: sortOrder === 'trending' ? 'var(--shadow-outset-sm)' : 'none', background: sortOrder === 'trending' ? 'var(--surface-color)' : 'transparent', color: sortOrder === 'trending' ? 'var(--primary-color)' : 'var(--text-muted)' }}
            onClick={() => setSortOrder('trending')}
          >
            <TrendingUp size={16} /> Trending
          </button>
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
        {displayedMemes.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '6rem 0', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-inset)', margin: '1rem 0' }}>
            <div style={{ display: 'inline-flex', padding: '2rem', borderRadius: '50%', boxShadow: 'var(--shadow-outset)', marginBottom: '2rem', color: 'var(--text-muted)' }}>
              <Search size={48} style={{ opacity: 0.3 }} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>No memes found</h3>
            <p style={{ marginBottom: '2rem' }}>Be the first to upload a meme or try another filter!</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" onClick={() => { setActiveFilter('All'); setSearchTerm(''); }}>Clear Filters</button>
              <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>Upload Now</button>
            </div>
          </div>
        ) : (
          displayedMemes.map(meme => (
            <MemeCard 
              key={meme.id} 
              meme={meme} 
              onLike={handleLike} 
              onDelete={handleDelete}
              currentUser={user}
            />
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
