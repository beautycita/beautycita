import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: string;
}

interface WorkSample {
  id: number;
  title: string;
  description: string;
  service_category: string;
  before_images: string[];
  after_images: string[];
  techniques_used: string[];
  products_used: string[];
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

const WorkSamplesManager: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [workSamples, setWorkSamples] = useState<WorkSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSample, setEditingSample] = useState<WorkSample | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service_category: '',
    techniques_used: [] as string[],
    products_used: [] as string[],
    is_featured: false,
    display_order: 0
  });

  const [newTechnique, setNewTechnique] = useState('');
  const [newProduct, setNewProduct] = useState('');

  const serviceCategories = [
    'Hair Color',
    'Hair Cut & Style',
    'Makeup',
    'Skincare',
    'Nails',
    'Lashes',
    'Eyebrows',
    'Special Events',
    'Bridal',
    'Other'
  ];

  useEffect(() => {
    fetchUserAndWorkSamples();
  }, []);

  const fetchUserAndWorkSamples = async () => {
    try {
      const authResponse = await fetch('/api/auth/user', {
        credentials: 'include'
      });

      if (!authResponse.ok) {
        setError('Please log in to access work samples management');
        setLoading(false);
        return;
      }

      const userData = await authResponse.json();
      setUser(userData);

      if (userData.role !== 'STYLIST') {
        setError('Only stylists can manage work samples');
        setLoading(false);
        return;
      }

      const samplesResponse = await fetch('/api/portfolio/work-samples', {
        credentials: 'include'
      });

      if (samplesResponse.ok) {
        const samplesData = await samplesResponse.json();
        setWorkSamples(samplesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load work samples');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      service_category: '',
      techniques_used: [],
      products_used: [],
      is_featured: false,
      display_order: 0
    });
    setEditingSample(null);
    setShowForm(false);
  };

  const handleEdit = (sample: WorkSample) => {
    setFormData({
      title: sample.title,
      description: sample.description,
      service_category: sample.service_category,
      techniques_used: sample.techniques_used,
      products_used: sample.products_used,
      is_featured: sample.is_featured,
      display_order: sample.display_order
    });
    setEditingSample(sample);
    setShowForm(true);
  };

  const addTechnique = () => {
    if (newTechnique.trim() && !formData.techniques_used.includes(newTechnique.trim())) {
      setFormData(prev => ({
        ...prev,
        techniques_used: [...prev.techniques_used, newTechnique.trim()]
      }));
      setNewTechnique('');
    }
  };

  const removeTechnique = (technique: string) => {
    setFormData(prev => ({
      ...prev,
      techniques_used: prev.techniques_used.filter(t => t !== technique)
    }));
  };

  const addProduct = () => {
    if (newProduct.trim() && !formData.products_used.includes(newProduct.trim())) {
      setFormData(prev => ({
        ...prev,
        products_used: [...prev.products_used, newProduct.trim()]
      }));
      setNewProduct('');
    }
  };

  const removeProduct = (product: string) => {
    setFormData(prev => ({
      ...prev,
      products_used: prev.products_used.filter(p => p !== product)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || !formData.service_category) {
      setError('Title and service category are required');
      return;
    }

    try {
      const url = editingSample
        ? `/api/portfolio/work-samples/${editingSample.id}`
        : '/api/portfolio/work-samples';

      const method = editingSample ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage(editingSample ? 'Work sample updated successfully!' : 'Work sample created successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        resetForm();
        fetchUserAndWorkSamples();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save work sample');
      }
    } catch (error) {
      console.error('Error saving work sample:', error);
      setError('Failed to save work sample');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work sample?')) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolio/work-samples/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccessMessage('Work sample deleted successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchUserAndWorkSamples();
      } else {
        setError('Failed to delete work sample');
      }
    } catch (error) {
      console.error('Error deleting work sample:', error);
      setError('Failed to delete work sample');
    }
  };

  const toggleFeatured = async (sample: WorkSample) => {
    try {
      const response = await fetch(`/api/portfolio/work-samples/${sample.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...sample,
          is_featured: !sample.is_featured
        }),
      });

      if (response.ok) {
        fetchUserAndWorkSamples();
      } else {
        setError('Failed to update featured status');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      setError('Failed to update featured status');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffeef8, #f3e8ff)'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading work samples...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #ffeef8, #f3e8ff)',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px', color: '#666' }}>Access Denied</h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
          {error}
        </p>
        <Link to="/" style={{
          background: 'linear-gradient(135deg, #ec4899, #a855f7)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '16px'
        }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffeef8, #f3e8ff)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '28px',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #ec4899, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Work Samples Manager
          </h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
            Showcase your best work with before/after photos and detailed descriptions
          </p>

          <button
            onClick={() => setShowForm(true)}
            style={{
              background: 'linear-gradient(135deg, #ec4899, #a855f7)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            + Add New Work Sample
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            background: '#d1fae5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            {successMessage}
          </div>
        )}

        {/* Work Sample Form */}
        {showForm && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '20px',
              marginBottom: '24px',
              color: '#333'
            }}>
              {editingSample ? 'Edit Work Sample' : 'Add New Work Sample'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Title and Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Balayage Hair Color Transformation"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                      Service Category *
                    </label>
                    <select
                      value={formData.service_category}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_category: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Select Category</option>
                      {serviceCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the work performed, client's goals, and results achieved..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Techniques Used */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                    Techniques Used
                  </label>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={newTechnique}
                        onChange={(e) => setNewTechnique(e.target.value)}
                        placeholder="Add a technique (e.g., Balayage, Foiling)"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnique())}
                      />
                      <button
                        type="button"
                        onClick={addTechnique}
                        style={{
                          background: '#a855f7',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {formData.techniques_used.map((technique, index) => (
                        <span
                          key={index}
                          style={{
                            background: '#a855f7',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {technique}
                          <button
                            type="button"
                            onClick={() => removeTechnique(technique)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Products Used */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                    Products Used
                  </label>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={newProduct}
                        onChange={(e) => setNewProduct(e.target.value)}
                        placeholder="Add a product (e.g., Olaplex, Redken)"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
                      />
                      <button
                        type="button"
                        onClick={addProduct}
                        style={{
                          background: '#06b6d4',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {formData.products_used.map((product, index) => (
                        <span
                          key={index}
                          style={{
                            background: '#06b6d4',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {product}
                          <button
                            type="button"
                            onClick={() => removeProduct(product)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Featured and Display Order */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span style={{ fontWeight: 'bold' }}>Featured Work</span>
                    </label>
                    <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                      Featured work appears first in your portfolio
                    </small>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {editingSample ? 'Update Work Sample' : 'Save Work Sample'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Work Samples List */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '24px',
            color: '#333'
          }}>
            Your Work Samples ({workSamples.length})
          </h2>

          {workSamples.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>No work samples yet</p>
              <p style={{ fontSize: '14px' }}>Add your first work sample to showcase your skills</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              {workSamples.map((sample) => (
                <div
                  key={sample.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    background: sample.is_featured ? '#fdf2f8' : 'white',
                    position: 'relative'
                  }}
                >
                  {sample.is_featured && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#ec4899',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      FEATURED
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{
                      fontSize: '18px',
                      marginBottom: '8px',
                      color: '#333',
                      paddingRight: sample.is_featured ? '80px' : '0'
                    }}>
                      {sample.title}
                    </h3>
                    <div style={{
                      background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      display: 'inline-block',
                      marginBottom: '8px'
                    }}>
                      {sample.service_category}
                    </div>
                    {sample.description && (
                      <p style={{
                        fontSize: '14px',
                        color: '#666',
                        lineHeight: '1.5',
                        marginBottom: '12px'
                      }}>
                        {sample.description}
                      </p>
                    )}
                  </div>

                  {sample.techniques_used.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                        Techniques:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {sample.techniques_used.map((technique, index) => (
                          <span
                            key={index}
                            style={{
                              background: '#f3f4f6',
                              color: '#374151',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '11px'
                            }}
                          >
                            {technique}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {sample.products_used.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                        Products:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {sample.products_used.map((product, index) => (
                          <span
                            key={index}
                            style={{
                              background: '#f3f4f6',
                              color: '#374151',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '11px'
                            }}
                          >
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => handleEdit(sample)}
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleFeatured(sample)}
                      style={{
                        background: sample.is_featured ? '#f59e0b' : '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {sample.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => handleDelete(sample.id)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>

                  <div style={{
                    marginTop: '12px',
                    fontSize: '11px',
                    color: '#9ca3af'
                  }}>
                    Created: {new Date(sample.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px'
        }}>
          <Link
            to="/portfolio"
            style={{
              color: '#666',
              textDecoration: 'none',
              fontSize: '16px'
            }}
          >
            ← Back to Portfolio Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WorkSamplesManager;