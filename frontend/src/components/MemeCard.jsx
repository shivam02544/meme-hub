import React, { useState } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Send, User as UserIcon, Pencil, Trash2, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

export default function MemeCard({ meme, onLike, onDelete, onEdit, currentUser, categories = [] }) {
  const [expandedComments, setExpandedComments] = useState(false);
  const [commentsData, setCommentsData] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState('');

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(meme.title);
  const [editDescription, setEditDescription] = useState(meme.description || '');
  const [editCategoryId, setEditCategoryId] = useState(meme.categoryId || '');
  const [editLoading, setEditLoading] = useState(false);

  const isOwner = currentUser && currentUser.userId === meme.userId;

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const toggleComments = async () => {
    if (expandedComments) { setExpandedComments(false); return; }
    setExpandedComments(true);
    setLoadingComments(true);
    try {
      const res = await axios.get(`${API_URL}/memes/${meme.id}/comments`);
      setCommentsData(res.data);
    } catch {
      setError('Failed to fetch comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await axios.post(`${API_URL}/memes/${meme.id}/comments`, { content: newComment }, getHeaders());
      const res = await axios.get(`${API_URL}/memes/${meme.id}/comments`);
      setCommentsData(res.data);
      setNewComment('');
    } catch {
      setError('Failed to post comment');
    }
  };

  const handleEditSave = async () => {
    if (!editTitle.trim()) return;
    setEditLoading(true);
    try {
      await axios.put(`${API_URL}/memes/${meme.id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        categoryId: editCategoryId,
        imageUrl: meme.imageUrl
      }, getHeaders());
      setEditing(false);
      if (onEdit) onEdit(meme.id, { title: editTitle.trim(), description: editDescription.trim(), categoryId: editCategoryId });
    } catch {
      setError('Failed to update meme');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditTitle(meme.title);
    setEditDescription(meme.description || '');
    setEditCategoryId(meme.categoryId || '');
    setEditing(false);
    setError('');
  };

  const renderMedia = () => {
    const fullUrl = getFullUrl(meme.imageUrl);
    if (meme.memeType === 'text') {
      return (
        <div style={{ minHeight: '140px', background: 'var(--surface-color)', boxShadow: 'var(--shadow-inset)', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-active)', fontWeight: 500, textAlign: 'center' }}>{meme.description}</p>
        </div>
      );
    }
    if (meme.memeType === 'video') {
      return (
        <div className="meme-image-wrapper">
          <video controls className="meme-image" style={{ objectFit: 'contain' }}>
            <source src={fullUrl} />
          </video>
        </div>
      );
    }
    return (
      <div className="meme-image-wrapper">
        <img src={fullUrl} alt={meme.title} className="meme-image"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found'; }} />
      </div>
    );
  };

  return (
    <div className="meme-card">
      {renderMedia()}

      <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Author + date row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <Link to={`/user/${meme.userId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.82rem' }}>
            <UserIcon size={13} /> @{meme.author}
          </Link>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {new Date(meme.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Title / Edit mode */}
        {editing ? (
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              className="form-input"
              style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              placeholder="Title"
            />
            {meme.memeType !== 'text' && (
              <textarea
                className="form-input"
                rows={2}
                style={{ fontSize: '0.85rem', marginBottom: '0.5rem', resize: 'none' }}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Description"
              />
            )}
            {categories.length > 0 && (
              <select className="form-select" style={{ fontSize: '0.85rem' }}
                value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.78rem', marginTop: '0.4rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.82rem' }}
                onClick={handleEditSave} disabled={editLoading}>
                <Check size={14} /> {editLoading ? 'Saving...' : 'Save'}
              </button>
              <button className="btn" style={{ flex: 1, padding: '0.4rem', fontSize: '0.82rem' }}
                onClick={handleEditCancel}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-active)' }}>{meme.title}</h3>
            {meme.memeType !== 'text' && meme.description && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{meme.description}</p>
            )}
          </>
        )}

        {/* Action row */}
        {!editing && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button className="btn" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }} onClick={() => onLike(meme.id)}>
              <Heart size={13} color="var(--accent-color)" />
              <span>{meme.likeCount}</span>
            </button>
            <button className="btn" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }} onClick={toggleComments}>
              <MessageCircle size={13} />
              <span>{meme.commentCount}</span>
            </button>

            {isOwner && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                  onClick={() => setEditing(true)} title="Edit">
                  <Pencil size={13} />
                </button>
                <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                  onClick={() => onDelete(meme.id)} title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {error && !editing && <p style={{ color: 'var(--danger-color)', fontSize: '0.78rem', marginTop: '0.4rem' }}>{error}</p>}

        {/* Comments */}
        {expandedComments && (
          <div style={{ boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginTop: '0.75rem' }}>
            {loadingComments ? (
              <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</p>
            ) : commentsData.length === 0 ? (
              <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>No comments yet</p>
            ) : (
              commentsData.map((c, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: idx < commentsData.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-active)' }}>{c.author}</span>
                  <p style={{ fontSize: '0.82rem', margin: '0.15rem 0 0', color: 'var(--text-muted)' }}>{c.content}</p>
                </div>
              ))
            )}
            <form onSubmit={submitComment} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
              <input type="text" className="form-input" placeholder="Add a comment..."
                style={{ height: '2.2rem', fontSize: '0.82rem' }}
                value={newComment} onChange={e => setNewComment(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 0.65rem' }}>
                <Send size={13} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
