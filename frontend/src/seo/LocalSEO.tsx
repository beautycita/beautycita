/**
 * Local SEO - Google My Business Integration
 *
 * Features:
 * - Google My Business API integration
 * - Location-based structured data
 * - Local business schema
 * - NAP (Name, Address, Phone) consistency
 * - Local citations
 * - Review management
 */

import React from 'react';
import { JSONLDScript } from './StructuredData';

// ==================== TYPES ====================

export interface BusinessLocation {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone: string;
  email?: string;
  website?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hours: BusinessHours[];
  services: string[];
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  photos?: string[];
  attributes?: string[];
}

export interface BusinessHours {
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

export interface LocalReview {
  author: string;
  rating: number;
  text: string;
  date: string;
  response?: {
    text: string;
    date: string;
  };
}

// ==================== LOCAL BUSINESS STRUCTURED DATA ====================

/**
 * Generate complete local business schema
 */
export function generateLocalBusinessSchema(location: BusinessLocation) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': `https://beautycita.com/locations/${location.address.city.toLowerCase()}-${location.address.state.toLowerCase()}`,
    name: location.name,
    image: location.photos || [],
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.address.street,
      addressLocality: location.address.city,
      addressRegion: location.address.state,
      postalCode: location.address.zip,
      addressCountry: location.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.coordinates.lat,
      longitude: location.coordinates.lng,
    },
    url: location.website || 'https://beautycita.com',
    telephone: location.phone,
    ...(location.email && { email: location.email }),
    openingHoursSpecification: location.hours.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.dayOfWeek,
      opens: hours.opens,
      closes: hours.closes,
    })),
    ...(location.priceRange && { priceRange: location.priceRange }),
    ...(location.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: location.rating,
        reviewCount: location.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card'],
    currenciesAccepted: 'USD',
    ...(location.services && {
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Beauty Services',
        itemListElement: location.services.map((service, index) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service,
          },
        })),
      },
    }),
  };
}

/**
 * Local Business Structured Data Component
 */
export const LocalBusinessStructuredData: React.FC<{ location: BusinessLocation }> = ({
  location,
}) => {
  const schema = generateLocalBusinessSchema(location);
  return <JSONLDScript data={schema} />;
};

// ==================== NAP (NAME, ADDRESS, PHONE) COMPONENT ====================

/**
 * Consistent NAP display for local SEO
 */
export const NAPInfo: React.FC<{
  location: BusinessLocation;
  variant?: 'full' | 'compact' | 'footer';
  className?: string;
}> = ({ location, variant = 'full', className = '' }) => {
  if (variant === 'compact') {
    return (
      <div className={`nap-info compact ${className}`}>
        <p className="font-medium">{location.name}</p>
        <p className="text-sm text-gray-600">
          {location.address.city}, {location.address.state} {location.address.zip}
        </p>
        <a href={`tel:${location.phone}`} className="text-sm text-blue-600 hover:underline">
          {location.phone}
        </a>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <address className={`nap-info footer not-italic ${className}`}>
        <p className="font-semibold mb-2">{location.name}</p>
        <p className="text-sm">
          {location.address.street}
          <br />
          {location.address.city}, {location.address.state} {location.address.zip}
        </p>
        <p className="text-sm mt-2">
          <a href={`tel:${location.phone}`} className="hover:underline">
            {location.phone}
          </a>
        </p>
        {location.email && (
          <p className="text-sm">
            <a href={`mailto:${location.email}`} className="hover:underline">
              {location.email}
            </a>
          </p>
        )}
      </address>
    );
  }

  return (
    <address className={`nap-info full not-italic ${className}`}>
      <h3 className="font-bold text-lg mb-4">{location.name}</h3>
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p>{location.address.street}</p>
            <p>
              {location.address.city}, {location.address.state} {location.address.zip}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <a href={`tel:${location.phone}`} className="text-blue-600 hover:underline">
            {location.phone}
          </a>
        </div>

        {location.email && (
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href={`mailto:${location.email}`} className="text-blue-600 hover:underline">
              {location.email}
            </a>
          </div>
        )}
      </div>
    </address>
  );
};

// ==================== BUSINESS HOURS COMPONENT ====================

export const BusinessHoursDisplay: React.FC<{
  hours: BusinessHours[];
  className?: string;
}> = ({ hours, className = '' }) => {
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Group hours by time slot
  const groupedHours = hours.reduce((acc, slot) => {
    const key = `${slot.opens}-${slot.closes}`;
    if (!acc[key]) {
      acc[key] = {
        days: [],
        opens: slot.opens,
        closes: slot.closes,
      };
    }
    acc[key].days.push(...slot.dayOfWeek);
    return acc;
  }, {} as Record<string, { days: string[]; opens: string; closes: string }>);

  return (
    <div className={`business-hours ${className}`}>
      <h3 className="font-bold text-lg mb-3">Business Hours</h3>
      <div className="space-y-2">
        {Object.values(groupedHours).map((slot, index) => {
          const sortedDays = slot.days.sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
          const dayRange =
            sortedDays.length > 2 && sortedDays.every((day, i) => i === 0 || daysOrder.indexOf(day) === daysOrder.indexOf(sortedDays[i - 1]) + 1)
              ? `${sortedDays[0]} - ${sortedDays[sortedDays.length - 1]}`
              : sortedDays.join(', ');

          return (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-700">{dayRange}</span>
              <span className="font-medium">
                {slot.opens} - {slot.closes}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== GOOGLE MAPS EMBED ====================

export const GoogleMapEmbed: React.FC<{
  location: BusinessLocation;
  width?: string;
  height?: string;
  zoom?: number;
  className?: string;
}> = ({ location, width = '100%', height = '400px', zoom = 15, className = '' }) => {
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${location.coordinates.lat},${location.coordinates.lng}&zoom=${zoom}`;

  return (
    <div className={`google-map-embed ${className}`}>
      <iframe
        width={width}
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={mapUrl}
        title={`Map of ${location.name}`}
      />
    </div>
  );
};

// ==================== REVIEW SCHEMA ====================

export function generateReviewSchema(review: LocalReview, businessName: string) {
  return {
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.date,
    reviewBody: review.text,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    itemReviewed: {
      '@type': 'LocalBusiness',
      name: businessName,
    },
  };
}

// ==================== GOOGLE MY BUSINESS API INTEGRATION ====================

/**
 * Fetch Google My Business data
 */
export async function fetchGoogleMyBusinessData(locationId: string): Promise<any> {
  try {
    const response = await fetch(`/api/google-my-business/${locationId}`);
    if (!response.ok) throw new Error('Failed to fetch GMB data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Google My Business data:', error);
    return null;
  }
}

/**
 * Update Google My Business listing
 */
export async function updateGoogleMyBusinessListing(
  locationId: string,
  updates: Partial<BusinessLocation>
): Promise<boolean> {
  try {
    const response = await fetch(`/api/google-my-business/${locationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.ok;
  } catch (error) {
    console.error('Error updating Google My Business listing:', error);
    return false;
  }
}

/**
 * Respond to Google My Business review
 */
export async function respondToGMBReview(
  locationId: string,
  reviewId: string,
  response: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/google-my-business/${locationId}/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response }),
    });
    return res.ok;
  } catch (error) {
    console.error('Error responding to GMB review:', error);
    return false;
  }
}

// ==================== LOCAL CITATIONS COMPONENT ====================

/**
 * Display consistent citations across directories
 */
export const LocalCitations: React.FC<{ location: BusinessLocation }> = ({ location }) => {
  const citations = [
    { name: 'Yelp', url: `https://www.yelp.com/biz/${location.name.toLowerCase().replace(/\s+/g, '-')}` },
    { name: 'Yellow Pages', url: `https://www.yellowpages.com` },
    { name: 'Better Business Bureau', url: `https://www.bbb.org` },
    { name: 'Foursquare', url: `https://foursquare.com` },
  ];

  return (
    <div className="local-citations">
      <h3 className="font-bold text-lg mb-3">Find Us On</h3>
      <div className="flex flex-wrap gap-3">
        {citations.map((citation) => (
          <a
            key={citation.name}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
          >
            {citation.name}
          </a>
        ))}
      </div>
    </div>
  );
};

// ==================== LOCATION-SPECIFIC LANDING PAGE ====================

export const LocationLandingPage: React.FC<{
  location: BusinessLocation;
  reviews?: LocalReview[];
}> = ({ location, reviews = [] }) => {
  return (
    <>
      {/* SEO */}
      <LocalBusinessStructuredData location={location} />

      <div className="location-landing-page max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {location.name} in {location.address.city}, {location.address.state}
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Professional beauty services in {location.address.city}
          </p>
          <div className="flex items-center gap-4">
            {location.rating && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{location.rating}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < location.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600">({location.reviewCount} reviews)</span>
              </div>
            )}
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Services */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Our Services</h2>
              <div className="grid grid-cols-2 gap-4">
                {location.services.map((service, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">{service}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            {reviews.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Recent Reviews</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{review.author}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.text}</p>
                      <p className="text-sm text-gray-500 mt-2">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <NAPInfo location={location} variant="full" />
            </div>

            {/* Hours */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <BusinessHoursDisplay hours={location.hours} />
            </div>

            {/* Map */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <GoogleMapEmbed location={location} height="300px" />
            </div>

            {/* Citations */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <LocalCitations location={location} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default {
  LocalBusinessStructuredData,
  NAPInfo,
  BusinessHoursDisplay,
  GoogleMapEmbed,
  LocalCitations,
  LocationLandingPage,
  generateLocalBusinessSchema,
  generateReviewSchema,
  fetchGoogleMyBusinessData,
  updateGoogleMyBusinessListing,
  respondToGMBReview,
};
