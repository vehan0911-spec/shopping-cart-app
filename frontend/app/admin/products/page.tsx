'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  rating: number;
}

const CATEGORIES = ['Vegetables', 'Fruits', 'Cakes', 'Biscuits', 'Other'];
const EMPTY_FORM = { name: '', description: '', price: '', category: '', imageUrl: '', stock: '10', rating: '0' };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const token = () => localStorage.getItem('authToken');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setProducts(await res.json());
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  };

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: String(p.price), category: p.category, imageUrl: p.imageUrl, stock: String(p.stock), rating: String(p.rating) });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm({ ...EMPTY_FORM }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const url = editing ? `${API_URL}/admin/products/${editing._id}` : `${API_URL}/admin/products`;
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock), rating: parseFloat(form.rating) }),
      });
      const data = await res.json();
      if (res.ok) { flash(editing ? 'Product updated!' : 'Product created!', 'success'); closeForm(); fetchProducts(); }
      else flash(data.error || 'Save failed', 'error');
    } catch { flash('Network error', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) { flash('Product deleted', 'success'); fetchProducts(); }
      else flash('Delete failed', 'error');
    } catch { flash('Network error', 'error'); }
    finally { setDeleteId(null); }
  };

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || p.category === filterCat)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .btn { border: none; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 0.875rem; transition: all 0.15s; }
        .btn-primary { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; padding: 0.5rem 1.25rem; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-danger { background: #fee2e2; color: #dc2626; padding: 0.375rem 0.875rem; }
        .btn-danger:hover { background: #dc2626; color: white; }
        .btn-secondary { background: #f1f5f9; color: #475569; padding: 0.375rem 0.875rem; }
        .btn-secondary:hover { background: #e2e8f0; }
        .form-input { width: 100%; padding: 0.625rem 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; color: #1e293b; outline: none; transition: border 0.15s; background: white; }
        .form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .form-label { display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .table-row:hover { background: #fafafe; }
        .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 0.75rem 1.25rem; border-radius: 10px; font-size: 0.875rem; font-weight: 500; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .modal-box { background: white; border-radius: 16px; padding: 2rem; max-width: 440px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.7rem; font-weight: 600; }
      `}</style>

      {success && <div className="toast" style={{ background: '#dcfce7', color: '#16a34a' }}>✓ {success}</div>}
      {error && <div className="toast" style={{ background: '#fee2e2', color: '#dc2626' }}>✕ {error}</div>}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>Delete Product?</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>This action cannot be undone. The product will be permanently removed.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ background: '#dc2626', color: 'white' }} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' }}>Products</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>{products.length} products total</p>
        </div>
        <button className="btn btn-primary" onClick={showForm ? closeForm : openAdd} style={{ padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {showForm ? '✕ Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Product Form Panel */}
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem' }}>
            {editing ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Product Name *</label>
                <input className="form-input" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Organic Apples" />
              </div>
              <div>
                <label className="form-label">Category *</label>
                <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Price ($) *</label>
                <input className="form-input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="0.00" />
              </div>
              <div>
                <label className="form-label">Stock</label>
                <input className="form-input" type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description *</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required rows={3} placeholder="Describe the product…" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Image URL *</label>
                <input className="form-input" type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} required placeholder="https://…" />
              </div>
              <div>
                <label className="form-label">Rating (0–5)</label>
                <input className="form-input" type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} />
              </div>
              {form.imageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img src={form.imageUrl} alt="preview" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px' }} onError={e => (e.currentTarget.style.display = 'none')} />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Image preview</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.625rem 1.5rem' }}>
                {saving ? 'Saving…' : editing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input className="form-input" type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '260px' }} />
        <select className="form-input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: '180px' }}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            {search || filterCat ? 'No products match your search.' : 'No products yet. Click "+ Add Product" to get started.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                {['Image', 'Name', 'Category', 'Price', 'Stock', 'Rating', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} className="table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <img src={p.imageUrl} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', background: '#f1f5f9' }} onError={e => { e.currentTarget.src = `https://picsum.photos/seed/${p._id}/48/48`; }} />
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: '500', color: '#0f172a', fontSize: '0.875rem', maxWidth: '200px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className="badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: '600', color: '#0f172a', fontSize: '0.875rem' }}>${p.price.toFixed(2)}</td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>
                    <span style={{ color: p.stock < 5 ? '#dc2626' : '#16a34a', fontWeight: '500' }}>{p.stock}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#f59e0b', fontWeight: '500' }}>★ {p.rating.toFixed(1)}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => setDeleteId(p._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
