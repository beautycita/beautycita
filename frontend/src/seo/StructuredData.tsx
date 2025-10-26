/**
 * Structured Data (JSON-LD) - Rich Snippets for Search Engines
 *
 * Implement Schema.org markup for:
 * - LocalBusiness
 * - Person (Stylists)
 * - Service
 * - Review/Rating
 * - Article (Blog posts)
 * - BreadcrumbList
 * - FAQPage
 * - Organization
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';

// ==================== SCHEMA.ORG TYPES ====================

interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description?: string;
  address?: PostalAddress;
  contactPoint?: ContactPoint[];
  sameAs?: string[];
}

interface LocalBusinessSchema {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness';
  '@id'?: string;
  name: string;
  image: string | string[];
  description?: string;
  address: PostalAddress;
  geo?: GeoCoordinates;
  url?: string;
  telephone?: string;
  priceRange?: string;
  openingHoursSpecification?: OpeningHoursSpecification[];
  aggregateRating?: AggregateRating;
  review?: Review[];
}

interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry?: string;
}

interface GeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

interface ContactPoint {
  '@type': 'ContactPoint';
  telephone: string;
  contactType: string;
  availableLanguage?: string[];
}

interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

interface Review {
  '@type': 'Review';
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished: string;
  reviewBody: string;
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating?: number;
  };
}

interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  givenName?: string;
  familyName?: string;
  image?: string;
  jobTitle?: string;
  description?: string;
  url?: string;
  sameAs?: string[];
}

interface ServiceSchema {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'LocalBusiness' | 'Person';
    name: string;
  };
  areaServed?: string;
  offers?: Offer;
}

interface Offer {
  '@type': 'Offer';
  price?: string;
  priceCurrency?: string;
  priceRange?: string;
  availability?: string;
  url?: string;
}

interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article' | 'BlogPosting';
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified?: string;
  author: {
    '@type': 'Person';
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage?: string;
}

interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

interface FAQPageSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: FAQQuestion[];
}

interface FAQQuestion {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

// ==================== REACT COMPONENTS ====================

/**
 * Generic JSON-LD component
 */
export const JSONLDScript: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
};

/**
 * Organization Schema
 */
export const OrganizationStructuredData: React.FC = () => {
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BeautyCita',
    url: 'https://beautycita.com',
    logo: 'https://beautycita.com/images/logo.png',
    description: 'Find and book beauty professionals near you. Connect with talented stylists, makeup artists, and beauty experts.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New York',
      addressRegion: 'NY',
      addressCountry: 'US',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+1-555-123-4567',
        contactType: 'Customer Service',
        availableLanguage: ['English', 'Spanish'],
      },
    ],
    sameAs: [
      'https://facebook.com/beautycita',
      'https://instagram.com/beautycita',
      'https://twitter.com/beautycita',
      'https://linkedin.com/company/beautycita',
    ],
  };

  return <JSONLDScript data={schema} />;
};

/**
 * Stylist Local Business Schema
 */
interface StylistBusinessSchemaProps {
  stylist: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
    profileImage: string;
    phone?: string;
    address: {
      street?: string;
      city: string;
      state: string;
      zip?: string;
    };
    coordinates?: {
      lat: number;
      lng: number;
    };
    hours?: Array<{
      days: string[];
      open: string;
      close: string;
    }>;
    rating: number;
    reviewCount: number;
    reviews: Array<{
      authorName: string;
      date: string;
      text: string;
      rating: number;
    }>;
  };
}

export const StylistBusinessStructuredData: React.FC<StylistBusinessSchemaProps> = ({ stylist }) => {
  const fullName = `${stylist.firstName} ${stylist.lastName}`;

  const schema: LocalBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://beautycita.com/stylist/${stylist.username}`,
    name: fullName,
    image: [stylist.profileImage],
    description: stylist.bio,
    address: {
      '@type': 'PostalAddress',
      ...(stylist.address.street && { streetAddress: stylist.address.street }),
      addressLocality: stylist.address.city,
      addressRegion: stylist.address.state,
      ...(stylist.address.zip && { postalCode: stylist.address.zip }),
      addressCountry: 'US',
    },
    ...(stylist.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: stylist.coordinates.lat,
        longitude: stylist.coordinates.lng,
      },
    }),
    url: `https://beautycita.com/stylist/${stylist.username}`,
    ...(stylist.phone && { telephone: stylist.phone }),
    priceRange: '$$',
    ...(stylist.hours && {
      openingHoursSpecification: stylist.hours.map((hour) => ({
        '@type': 'OpeningHoursSpecification' as const,
        dayOfWeek: hour.days,
        opens: hour.open,
        closes: hour.close,
      })),
    }),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: stylist.rating,
      reviewCount: stylist.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: stylist.reviews.slice(0, 5).map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.authorName,
      },
      datePublished: review.date,
      reviewBody: review.text,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
      },
    })),
  };

  return <JSONLDScript data={schema} />;
};

/**
 * Service Schema
 */
interface ServiceSchemaProps {
  service: {
    name: string;
    description: string;
    provider: string;
    priceRange: string;
    city?: string;
  };
}

export const ServiceStructuredData: React.FC<ServiceSchemaProps> = ({ service }) => {
  const schema: ServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      name: service.provider,
    },
    ...(service.city && { areaServed: service.city }),
    offers: {
      '@type': 'Offer',
      priceRange: service.priceRange,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  return <JSONLDScript data={schema} />;
};

/**
 * Blog Post Schema
 */
interface BlogPostSchemaProps {
  post: {
    title: string;
    excerpt: string;
    featuredImage: string;
    publishedAt: string;
    updatedAt?: string;
    author: {
      name: string;
      url?: string;
    };
    slug: string;
  };
}

export const BlogPostStructuredData: React.FC<BlogPostSchemaProps> = ({ post }) => {
  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [post.featuredImage],
    datePublished: post.publishedAt,
    ...(post.updatedAt && { dateModified: post.updatedAt }),
    author: {
      '@type': 'Person',
      name: post.author.name,
      ...(post.author.url && { url: post.author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'BeautyCita',
      logo: {
        '@type': 'ImageObject',
        url: 'https://beautycita.com/images/logo.png',
      },
    },
    mainEntityOfPage: `https://beautycita.com/blog/${post.slug}`,
  };

  return <JSONLDScript data={schema} />;
};

/**
 * Breadcrumb Schema
 */
interface BreadcrumbProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export const BreadcrumbStructuredData: React.FC<BreadcrumbProps> = ({ items }) => {
  const schema: BreadcrumbListSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JSONLDScript data={schema} />;
};

/**
 * FAQ Schema
 */
interface FAQProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const FAQStructuredData: React.FC<FAQProps> = ({ faqs }) => {
  const schema: FAQPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <JSONLDScript data={schema} />;
};

/**
 * Search Action Schema (for homepage)
 */
export const SearchActionStructuredData: React.FC = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BeautyCita',
    url: 'https://beautycita.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://beautycita.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return <JSONLDScript data={schema} />;
};

/**
 * Video Schema (for tutorial content)
 */
interface VideoSchemaProps {
  video: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration: string; // ISO 8601 duration format (e.g., "PT1M33S")
    contentUrl: string;
    embedUrl?: string;
  };
}

export const VideoStructuredData: React.FC<VideoSchemaProps> = ({ video }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: video.contentUrl,
    ...(video.embedUrl && { embedUrl: video.embedUrl }),
  };

  return <JSONLDScript data={schema} />;
};

/**
 * Product Schema (for beauty products if sold)
 */
interface ProductSchemaProps {
  product: {
    name: string;
    description: string;
    image: string;
    brand: string;
    price: number;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    rating?: {
      value: number;
      count: number;
    };
  };
}

export const ProductStructuredData: React.FC<ProductSchemaProps> = ({ product }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: `https://schema.org/${product.availability}`,
    },
    ...(product.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.value,
        reviewCount: product.rating.count,
      },
    }),
  };

  return <JSONLDScript data={schema} />;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Combine multiple schemas into one JSON-LD script
 */
export const MultipleStructuredData: React.FC<{ schemas: any[] }> = ({ schemas }) => {
  return <JSONLDScript data={schemas} />;
};

/**
 * Generate schema for entire page
 */
export function generatePageSchema(type: 'home' | 'stylist' | 'blog' | 'service', data?: any) {
  const schemas: any[] = [];

  // Always include organization
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BeautyCita',
    url: 'https://beautycita.com',
    logo: 'https://beautycita.com/images/logo.png',
  });

  // Add page-specific schemas
  switch (type) {
    case 'home':
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'BeautyCita',
        url: 'https://beautycita.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://beautycita.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      });
      break;

    case 'stylist':
      if (data) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: data.name,
          image: data.image,
          // ... other stylist data
        });
      }
      break;

    case 'blog':
      if (data) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: data.title,
          // ... other blog data
        });
      }
      break;
  }

  return schemas;
}

export default {
  JSONLDScript,
  OrganizationStructuredData,
  StylistBusinessStructuredData,
  ServiceStructuredData,
  BlogPostStructuredData,
  BreadcrumbStructuredData,
  FAQStructuredData,
  SearchActionStructuredData,
  VideoStructuredData,
  ProductStructuredData,
  MultipleStructuredData,
  generatePageSchema,
};
