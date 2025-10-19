import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: string;
}

interface PortfolioData {
  username?: string;
  business_name?: string;
  bio?: string;
  brand_story?: string;
  specialties: string[];
  location_city?: string;
  location_state?: string;
  experience_years?: number;
  pricing_tier?: string;
  base_price_range?: string;
  portfolio_theme: string;
  portfolio_published: boolean;
  social_media_links: Record<string, string>;
  certifications: string[];
  working_hours: Record<string, string>;
}

const PortfolioBuilder: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    specialties: [],
    portfolio_theme: 'minimal',
    portfolio_published: false,
    social_media_links: {},
    certifications: [],
    working_hours: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    fetchUserAndPortfolio();
  }, []);

  const fetchUserAndPortfolio = async () => {
    try {
      const authResponse = await fetch('/api/auth/user', {
        credentials: 'include'
      });

      if (!authResponse.ok) {
        setError('Please log in to access the portfolio builder');
        setLoading(false);
        return;
      }

      const userData = await authResponse.json();
      setUser(userData);

      if (userData.role !== 'STYLIST') {
        setError('Only stylists can access the portfolio builder');
        setLoading(false);
        return;
      }

      const portfolioResponse = await fetch('/api/portfolio/profile', {
        credentials: 'include'
      });

      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setPortfolio({
          ...portfolio,
          ...portfolioData,
          specialties: portfolioData.specialties || [],
          social_media_links: portfolioData.social_media_links || {},
          certifications: portfolioData.certifications || [],
          working_hours: portfolioData.working_hours || {}
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      setError('Failed to load portfolio builder');
    }
    setLoading(false);
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch(`/api/portfolio/check-username/${username}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsernameAvailable(data.available);
      }
    } catch (error) {
      console.error('Error checking username:', error);
    }
    setCheckingUsername(false);
  };

  const handleInputChange = (field: keyof PortfolioData, value: any) => {
    setPortfolio(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'username') {
      const debounceTimer = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !portfolio.specialties.includes(newSpecialty.trim())) {
      setPortfolio(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setPortfolio(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const addCertification = () => {
    if (newCertification.trim() && !portfolio.certifications.includes(newCertification.trim())) {
      setPortfolio(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (certification: string) => {
    setPortfolio(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }));
  };

  const handleSocialMediaChange = (platform: string, url: string) => {
    setPortfolio(prev => ({
      ...prev,
      social_media_links: {
        ...prev.social_media_links,
        [platform]: url
      }
    }));
  };

  const handleSave = async () => {
    if (portfolio.username && usernameAvailable === false) {
      setError('Please choose an available username');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/portfolio/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(portfolio),
      });

      if (response.ok) {
        setSuccessMessage('Portfolio saved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save portfolio');
      }
    } catch (error) {
      console.error('Error saving portfolio:', error);
      setError('Failed to save portfolio');
    }
    setSaving(false);
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
        <div style={{ fontSize: '18px', color: '#666' }}>Loading portfolio builder...</div>
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
            Portfolio Builder
          </h1>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Create and customize your professional beauty portfolio
          </p>
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

        {/* Basic Information */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '24px',
            color: '#333'
          }}>
            Basic Information
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                Portfolio Username *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={portfolio.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="your-unique-username"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                {checkingUsername && (
                  <div style={{ position: 'absolute', right: '12px', top: '12px', color: '#666' }}>
                    Checking...
                  </div>
                )}
                {usernameAvailable === true && (
                  <div style={{ position: 'absolute', right: '12px', top: '12px', color: '#10b981' }}>
                    ✓ Available
                  </div>
                )}
                {usernameAvailable === false && (
                  <div style={{ position: 'absolute', right: '12px', top: '12px', color: '#ef4444' }}>
                    ✗ Taken
                  </div>
                )}
              </div>
              <small style={{ color: '#666' }}>
                Your portfolio will be available at: beautycita.com/{portfolio.username || 'your-username'}
              </small>
            </div>

            {/* Business Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                Business/Professional Name
              </label>
              <input
                type="text"
                value={portfolio.business_name || ''}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                placeholder="Your Salon Name or Professional Title"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                  City
                </label>
                <input
                  type="text"
                  value={portfolio.location_city || ''}
                  onChange={(e) => handleInputChange('location_city', e.target.value)}
                  placeholder="Your City"
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
                  State
                </label>
                <input
                  type="text"
                  value={portfolio.location_state || ''}
                  onChange={(e) => handleInputChange('location_state', e.target.value)}
                  placeholder="Your State"
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

            {/* Experience and Pricing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={portfolio.experience_years || ''}
                  onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                  placeholder="5"
                  min="0"
                  max="50"
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
                  Price Range
                </label>
                <select
                  value={portfolio.base_price_range || ''}
                  onChange={(e) => handleInputChange('base_price_range', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Select Price Range</option>
                  <option value="$-$$">$ - Budget Friendly ($25-50)</option>
                  <option value="$$-$$$">$$ - Mid Range ($50-100)</option>
                  <option value="$$$-$$$$">$$$ - Premium ($100-200)</option>
                  <option value="$$$$+">$$$$ - Luxury ($200+)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bio and Brand Story */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '24px',
            color: '#333'
          }}>
            About You
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Bio */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                Professional Bio
              </label>
              <textarea
                value={portfolio.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell potential clients about your experience, training, and what makes you unique..."
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

            {/* Brand Story */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
                Brand Story
              </label>
              <textarea
                value={portfolio.brand_story || ''}
                onChange={(e) => handleInputChange('brand_story', e.target.value)}
                placeholder="Share your journey, passion for beauty, and what inspires your work..."
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
          </div>
        </div>

        {/* Specialties */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '24px',
            color: '#333'
          }}>
            Specialties
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Add a specialty (e.g., Hair Color, Makeup, Nails)"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
              />
              <button
                onClick={addSpecialty}
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #a855f7)',
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
              {portfolio.specialties.map((specialty, index) => (
                <span
                  key={index}
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {specialty}
                  <button
                    onClick={() => removeSpecialty(specialty)}
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

        {/* Theme Selection */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '24px',
            color: '#333'
          }}>
            Portfolio Theme
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { id: 'minimal', name: 'Minimal', description: 'Clean and elegant' },
              { id: 'modern', name: 'Modern', description: 'Bold and contemporary' },
              { id: 'artistic', name: 'Artistic', description: 'Creative and vibrant' }
            ].map((theme) => (
              <div
                key={theme.id}
                onClick={() => handleInputChange('portfolio_theme', theme.id)}
                style={{
                  border: portfolio.portfolio_theme === theme.id ? '2px solid #ec4899' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  background: portfolio.portfolio_theme === theme.id ? '#fdf2f8' : 'white'
                }}
              >
                <h3 style={{ fontSize: '16px', marginBottom: '4px', color: '#333' }}>
                  {theme.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  {theme.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Visibility */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            marginBottom: '24px',
            color: '#333'
          }}>
            Portfolio Visibility
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              checked={portfolio.portfolio_published}
              onChange={(e) => handleInputChange('portfolio_published', e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <label style={{ fontSize: '16px', color: '#333' }}>
              Make my portfolio public
            </label>
          </div>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            When enabled, your portfolio will be visible to anyone with the link
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#999' : 'linear-gradient(135deg, #ec4899, #a855f7)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer',
              minWidth: '150px'
            }}
          >
            {saving ? 'Saving...' : 'Save Portfolio'}
          </button>

          {portfolio.username && portfolio.portfolio_published && (
            <a
              href={`/${portfolio.username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                minWidth: '150px',
                textAlign: 'center'
              }}
            >
              Preview Portfolio
            </a>
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

export default PortfolioBuilder;