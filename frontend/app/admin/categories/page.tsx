'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Category {
  _id: string;
  name: string;
  description: string;
  icon: string;
}

const EMPTY_FORM = { name: '', description: '', icon: '' };
const ICON_SUGGESTIONS = ['🥬', '🍎', '🎂', '🍪', '🛒', '🥦', '🍊', '🥗', '🍞', '🥩'];

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const token = () => localStorage.getItem('authToken');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setCategories(await res.json());
    } catch { setError('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  };

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, description: c.description || '', icon: c.icon || '' }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm({ ...EMPTY_FORM }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const url = editing ? `${API_URL}/admin/categories/${editing._id}` : `${API_URL}/admin/categories`;
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { flash(editing ? 'Category updated!' : 'Category created!', 'success'); closeForm(); fetchCategories(); }
      else flash(data.error || 'Save failed', 'error');
    } catch { flash('Network error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (res.ok) { flash('Category deleted', 'success'); fetchCategories(); }
      else flash(data.error || 'Delete failed', 'error');
    } catch { flash('Network error', 'error'); }
    finally { setDeleteId(null); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .btn { border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 0.875rem; transition: all 0.15s; }
        .btn-primary { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; padding: 0.625rem 1.5rem; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-danger { background: #fee2e2; color: #dc2626; padding: 0.375rem 0.875rem; }
        .btn-danger:hover { background: #dc2626; color: white; }
        .btn-secondary { background: #f1f5f9; color: #475569; padding: 0.375rem 0.875rem; }
        .btn-secondary:hover { background: #e2e8f0; }
        .form-input { width: 100%; padding: 0.625rem 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; color: #1e293b; outline: none; transition: border 0.15s; background: white; }
        .form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .form-label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .cat-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem; transition: box-shadow 0.15s; }
        .cat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .icon-chip { width: 40px; height: 40px; border-radius: 10px; border: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer; transition: all 0.1s; background: #f8fafc; }
        .icon-chip:hover, .icon-chip.selected { border-color: #6366f1; background: #eef2ff; }
        .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 0.75rem 1.25rem; border-radius: 10px; font-size: 0.875rem; font-weight: 500; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .modal-box { background: white; border-radius: 16px; padding: 2rem; max-width: 440px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
      `}</style>

      {success && <div className="toast" style={{ background: '#dcfce7', color: '#16a34a' }}>✓ {success}</div>}
      {error && <div className="toast" style={{ background: '#fee2e2', color: '#dc2626' }}>✕ {error}</div>}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Delete Category?</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Products in this category will need to be reassigned first.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn" style={{ background: '#dc2626', color: 'white', padding: '0.5rem 1rem' }} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' }}>Categories</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>{categories.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={showForm ? closeForm : openAdd}>
          {showForm ? '✕ Cancel' : '+ Add Category'}
        </button>
      </div>

      {/* Form Panel */}
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>
            {editing ? '✏️ Edit Category' : '➕ New Category'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Name *</label>
                <input className="form-input" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Fruits" />
              </div>
              <div>
                <label className="form-label">Icon (type or pick)</label>
                <input className="form-input" type="text" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🍎" maxLength={4} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {ICON_SUGGESTIONS.map(ic => (
                    <div key={ic} className={`icon-chip ${form.icon === ic ? 'selected' : ''}`} onClick={() => setForm({ ...form, icon: ic })}>{ic}</div>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Short description…" style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>Loading…</div>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem', background: 'white', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
          No categories yet. Click "+ Add Category" to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {categories.map(cat => (
            <div key={cat._id} className="cat-card">
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #eef2ff, #f0fdf4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
                {cat.icon || '🏷️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{cat.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{cat.description || 'No description'}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => openEdit(cat)}>Edit</button>
                <button className="btn btn-danger" onClick={() => setDeleteId(cat._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
