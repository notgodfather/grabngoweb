import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../types';

// --- Main Component for Managing Food Items ---
export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for the form/modal
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // null for new, item object for editing

  // Fetch both items and categories
  const fetchData = async () => {
    setLoading(true);
    const [itemRes, catRes] = await Promise.all([
      supabase.from('food_items').select('*, categories(name)').order('name'),
      supabase.from('categories').select('*').order('name')
    ]);

    if (itemRes.error) setError(itemRes.error.message);
    else setItems(itemRes.data || []);

    if (catRes.error) setError(prev => prev || catRes.error.message);
    else setCategories(catRes.data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    setCurrentItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCurrentItem(null);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const { error } = await supabase.from('food_items').delete().eq('id', itemId);
      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Item deleted successfully.');
        fetchData(); // Refresh the list
      }
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading items...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Manage Menu Items</h1>
        <button onClick={() => handleOpenModal()} style={primaryButtonStyle}>+ Add New Item</button>
      </div>

      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Available</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.categories?.name || 'N/A'}</td>
                <td style={tdStyle}>{formatPrice(item.price)}</td>
                <td style={tdStyle}>{item.is_available ? 'Yes' : 'No'}</td>
                <td style={tdStyle}>
                  <button onClick={() => handleOpenModal(item)} style={editButtonStyle}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={deleteButtonStyle}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ItemFormModal
          item={currentItem}
          categories={categories}
          onClose={handleCloseModal}
          onSave={() => {
            fetchData();
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
}

// --- Form Modal Component ---
function ItemFormModal({ item, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    image_url: item?.image_url || '',
    category_id: item?.category_id || '',
    is_available: item?.is_available ?? true,
  });
  const [isSaving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    if (!formData.name || !formData.price || !formData.category_id) {
        alert("Please fill in Name, Price, and Category.");
        setSaving(false);
        return;
    }

    let error;
    if (item) {
      ({ error } = await supabase.from('food_items').update(formData).eq('id', item.id));
    } else {
      ({ error } = await supabase.from('food_items').insert([formData]));
    }

    setSaving(false);
    if (error) {
      alert(`Error saving item: ${error.message}`);
    } else {
      alert(`Item ${item ? 'updated' : 'created'} successfully!`);
      onSave();
    }
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <h2>{item ? 'Edit Item' : 'Add New Item'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Item Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange} style={inputStyle} required>
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Price (INR)</label>
            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} style={inputStyle} required />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} style={inputStyle} rows="3"></textarea>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Image URL</label>
            <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={{...formGroupStyle, display: 'flex', alignItems: 'center'}}>
            <input type="checkbox" name="is_available" id="is_available" checked={formData.is_available} onChange={handleChange} style={{ marginRight: 8 }} />
            <label htmlFor="is_available">Is Available?</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
            <button type="submit" disabled={isSaving} style={primaryButtonStyle}>
              {isSaving ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- Styles ---
const primaryButtonStyle = { background: '#f97316', color: '#fff', border: 0, padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' };
const secondaryButtonStyle = { background: '#e2e8f0', color: '#1e293b', border: 0, padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' };
const editButtonStyle = { background: '#dbeafe', color: '#1e40af', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', marginRight: 8 };
const deleteButtonStyle = { background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' };
const tableContainerStyle = { border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { background: '#f8fafc', padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600 };
const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f1f5f9' };

const modalBackdropStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' };
const formGroupStyle = { marginBottom: 16 };
const labelStyle = { display: 'block', fontWeight: 600, marginBottom: 6 };
const inputStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' };
