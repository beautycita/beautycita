import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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
}

interface Service {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  base_price: number;
  category: string;
}

interface Portfolio {
  username: string;
  name: string;
  profile_picture_url: string;
  business_name: string;
  bio: string;
  brand_story: string;
  specialties: string[];
  experience_years: number;
  location_city: string;
  location_state: string;
  pricing_tier: string;
  base_price_range: string;
  portfolio_images: string[];
  social_media_links: Record<string, string>;
  certifications: string[];
  working_hours: Record<string, string>;
  portfolio_theme: string;
  custom_sections: Record<string, any>;
  rating_average: number;
  rating_count: number;
  work_samples: WorkSample[];
  services: Service[];
}

const PublicPortfolio: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      fetchPortfolio(username);
    }
  }, [username]);

  const fetchPortfolio = async (username: string) => {
    try {
      const response = await fetch(`/api/portfolio/${username}`);
      if (response.ok) {
        const data = await response.json();
        setPortfolio(data);
      } else if (response.status === 404) {
        setError('Portfolio not found');
      } else {
        setError('Failed to load portfolio');
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError('Failed to load portfolio');
    }
    setLoading(false);
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
        <div style={{ fontSize: '18px', color: '#666' }}>Loading portfolio...</div>
      </div>
    );
  }

  if (error || !portfolio) {
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
        <h1 style={{ fontSize: '48px', marginBottom: '16px', color: '#666' }}>404</h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
          {error || 'Portfolio not found'}
        </p>
        <a href="/" style={{
          background: 'linear-gradient(135deg, #ec4899, #a855f7)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '16px'
        }}>
          Back to BeautyCita
        </a>
      </div>
    );
  }

  const themeStyles = {
    minimal: {
      background: 'linear-gradient(135deg, #ffeef8, #f3e8ff)',
      primaryColor: '#ec4899',
      secondaryColor: '#a855f7',
      textColor: '#333',
      cardBackground: 'white'
    },
    modern: {
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      primaryColor: '#ec4899',
      secondaryColor: '#a855f7',
      textColor: 'white',
      cardBackground: '#334155'
    },
    artistic: {
      background: 'linear-gradient(135deg, #fef3c7, #fed7d7)',
      primaryColor: '#f59e0b',
      secondaryColor: '#ef4444',
      textColor: '#7c2d12',
      cardBackground: 'white'
    }
  };

  const theme = themeStyles[portfolio.portfolio_theme as keyof typeof themeStyles] || themeStyles.minimal;

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.background,
      color: theme.textColor
    }}>
      {/* Header */}
      <div style={{
        background: theme.cardBackground,
        padding: '40px 20px',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <img
          src={portfolio.profile_picture_url || '/default-avatar.png'}
          alt={portfolio.name}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            marginBottom: '20px',
            border: `4px solid ${theme.primaryColor}`
          }}
        />
        <h1 style={{
          fontSize: '36px',
          marginBottom: '8px',
          background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {portfolio.business_name || portfolio.name}
        </h1>
        <p style={{ fontSize: '18px', color: theme.textColor, opacity: 0.8, marginBottom: '16px' }}>
          {portfolio.specialties.join(' • ')}
        </p>
        <p style={{ fontSize: '16px', color: theme.textColor, opacity: 0.7 }}>
          {portfolio.location_city}, {portfolio.location_state} • {portfolio.experience_years} years experience
        </p>
        {portfolio.rating_count > 0 && (
          <div style={{ marginTop: '16px', fontSize: '16px' }}>
            ⭐ {portfolio.rating_average.toFixed(1)} ({portfolio.rating_count} reviews)
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* About Section */}
        <div style={{
          background: theme.cardBackground,
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            marginBottom: '16px',
            color: theme.primaryColor
          }}>
            About {portfolio.name.split(' ')[0]}
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
            {portfolio.bio}
          </p>
          {portfolio.brand_story && (
            <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
              {portfolio.brand_story}
            </p>
          )}
        </div>

        {/* Work Samples */}
        {portfolio.work_samples.length > 0 && (
          <div style={{
            background: theme.cardBackground,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '24px',
              color: theme.primaryColor
            }}>
              Portfolio
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {portfolio.work_samples.map((sample) => (
                <div key={sample.id} style={{
                  border: `1px solid ${theme.primaryColor}20`,
                  borderRadius: '12px',
                  padding: '20px',
                  background: theme.background,
                  opacity: 0.9
                }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '8px', color: theme.primaryColor }}>
                    {sample.title}
                  </h3>
                  <p style={{ fontSize: '14px', marginBottom: '12px', opacity: 0.8 }}>
                    {sample.description}
                  </p>
                  <div style={{ fontSize: '12px', color: theme.secondaryColor }}>
                    {sample.service_category}
                  </div>
                  {sample.techniques_used.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      <strong>Techniques:</strong> {sample.techniques_used.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {portfolio.services.length > 0 && (
          <div style={{
            background: theme.cardBackground,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '24px',
              marginBottom: '24px',
              color: theme.primaryColor
            }}>
              Services
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {portfolio.services.map((service) => (
                <div key={service.id} style={{
                  border: `1px solid ${theme.primaryColor}20`,
                  borderRadius: '8px',
                  padding: '16px',
                  background: theme.background,
                  opacity: 0.9
                }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px', color: theme.primaryColor }}>
                    {service.name}
                  </h3>
                  <p style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.8 }}>
                    {service.description}
                  </p>
                  <div style={{ fontSize: '12px', color: theme.secondaryColor }}>
                    {service.duration_minutes} min • ${service.base_price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div style={{
          background: theme.cardBackground,
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            marginBottom: '16px',
            color: theme.primaryColor
          }}>
            Book with {portfolio.name.split(' ')[0]}
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '24px', opacity: 0.8 }}>
            Ready to experience amazing beauty services?
          </p>
          <a href="/" style={{
            background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            color: 'white',
            padding: '16px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}>
            Book Now on BeautyCita
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        color: theme.textColor,
        opacity: 0.6,
        fontSize: '14px'
      }}>
        Powered by BeautyCita
      </div>
    </div>
  );
};

export default PublicPortfolio;