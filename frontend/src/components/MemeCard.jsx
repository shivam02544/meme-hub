import React, { useState } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, FileText, User as UserIcon, Calendar, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

export default function MemeCard({ meme, onLike, onDelete, currentUser }) {
  const [expandedComments, setExpandedComments] = useState(false);
  const [commentsData, setCommentsData] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState('');

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const toggleComments = async () => {
    if (expandedComments) {
      setExpandedComments(false);
      return;
    }
    setExpandedComments(true);
    setLoadingComments(true);
    try {
      const res = await axios.get(`${API_URL}/memes/${meme.id}/comments`);
      setCommentsData(res.data);
    } catch (err) {
      setError('Failed to fetch comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/memes/${meme.id}/comments`, { content: newComment }, getHeaders());
      setCommentsData(prev => [...prev, res.data]);
      setNewComment('');
      // Note: updating commentCount should ideally be handled via a prop callback to the parent list
    } catch (err) {
      setError('Failed to post comment');
    }
  };

  const renderMemeMedia = () => {
    const fullUrl = getFullUrl(meme.imageUrl);
    if (meme.memeType === 'text') {
      return (
        <div className="meme-text-content" style={{ minHeight: '150px', background: 'var(--surface-color)', boxShadow: 'var(--shadow-inset)', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-active)', fontWeight: 500, textAlign: 'center' }}>{meme.description}</p>
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
        <img src={fullUrl} alt={meme.title} className="meme-image" onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Invalid+Image+URL' }} />
      </div>
    );
  };

  return (
    <div className="meme-card">
      {renderMemeMedia()}
      <div className="meme-content" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <Link to={`/user/${meme.userId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.85rem' }}>
            <UserIcon size={14} /> @{meme.author}
          </Link>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(meme.createdAt).toLocaleDateString()}</span>
        </div>
        <h3 className="meme-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{meme.title}</h3>
        {meme.memeType !== 'text' && (
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem', flex: 1, color: 'var(--text-muted)' }}>{meme.description}</p>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
          <button className="btn" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => onLike(meme.id)}>
            <Heart size={14} fill={meme.likeCount > 0 ? 'var(--accent-color)' : 'none'} color="var(--accent-color)" />
            {meme.likeCount}
          </button>
          <button className="btn" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={toggleComments}>
            <MessageCircle size={14} />
            {meme.commentCount}
          </button>
        </div>

        {error && <p style={{ color: 'var(--accent-color)', fontSize: '0.8rem' }}>{error}</p>}

        {expandedComments && (
          <div style={{ boxShadow: 'var(--shadow-inset)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.75rem', marginTop: '1rem' }}>
            {loadingComments ? (
              <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>Loading comments...</p>
            ) : commentsData.length === 0 ? (
              <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>No comments yet</p>
            ) : (
              commentsData.map((c, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: idx < commentsData.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.author}</span>
                  <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0' }}>{c.content}</p>
                </div>
              ))
            )}
            <form onSubmit={submitComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Add a comment..." 
                style={{ height: '2.5rem', fontSize: '0.85rem' }}
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 0.75rem' }}><Send size={14} /></button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
