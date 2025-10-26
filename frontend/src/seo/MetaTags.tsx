/**
 * MetaTags Component - SEO & Social Media Meta Tags
 *
 * Comprehensive meta tags for:
 * - Open Graph (Facebook, LinkedIn)
 * - Twitter Cards
 * - SEO fundamentals
 * - Schema.org structured data
 */

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export interface MetaTagsProps {
  // Basic SEO
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;

  // Open Graph
  ogType?: 'website' | 'article' | 'profile' | 'business.business';
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogUrl?: string;
  ogSiteName?: string;
  ogLocale?: string;

  // Twitter Cards
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  twitterImage?: string;
  twitterImageAlt?: string;

  // Article-specific (for blog posts)
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];

  // Business/Profile specific
  profileFirstName?: string;
  profileLastName?: string;
  profileUsername?: string;
  profileGender?: string;

  // Additional
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  jsonLd?: object | object[];
}

export const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  keywords = [],
  canonical,
  noindex = false,
  nofollow = false,

  ogType = 'website',
  ogImage,
  ogImageAlt,
  ogImageWidth = 1200,
  ogImageHeight = 630,
  ogUrl,
  ogSiteName = 'BeautyCita',
  ogLocale = 'en_US',

  twitterCard = 'summary_large_image',
  twitterSite = '@beautycita',
  twitterCreator,
  twitterImage,
  twitterImageAlt,

  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
  articleTags = [],

  profileFirstName,
  profileLastName,
  profileUsername,
  profileGender,

  author,
  publishedDate,
  modifiedDate,
  jsonLd,
}) => {
  const fullTitle = title.includes('BeautyCita') ? title : `${title} | BeautyCita`;
  const robotsContent = `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`;

  // Use provided URLs or construct from current location
  const currentUrl = ogUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const imageUrl = ogImage || twitterImage || 'https://beautycita.com/images/default-og-image.jpg';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      <meta name="robots" content={robotsContent} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      {ogImageWidth && <meta property="og:image:width" content={String(ogImageWidth)} />}
      {ogImageHeight && <meta property="og:image:height" content={String(ogImageHeight)} />}
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      <meta property="og:site_name" content={ogSiteName} />
      <meta property="og:locale" content={ogLocale} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {(twitterImage || imageUrl) && <meta name="twitter:image" content={twitterImage || imageUrl} />}
      {(twitterImageAlt || ogImageAlt) && <meta name="twitter:image:alt" content={twitterImageAlt || ogImageAlt} />}
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}

      {/* Article-specific Meta Tags */}
      {ogType === 'article' && (
        <>
          {articlePublishedTime && <meta property="article:published_time" content={articlePublishedTime} />}
          {articleModifiedTime && <meta property="article:modified_time" content={articleModifiedTime} />}
          {articleAuthor && <meta property="article:author" content={articleAuthor} />}
          {articleSection && <meta property="article:section" content={articleSection} />}
          {articleTags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Profile-specific Meta Tags */}
      {ogType === 'profile' && (
        <>
          {profileFirstName && <meta property="profile:first_name" content={profileFirstName} />}
          {profileLastName && <meta property="profile:last_name" content={profileLastName} />}
          {profileUsername && <meta property="profile:username" content={profileUsername} />}
          {profileGender && <meta property="profile:gender" content={profileGender} />}
        </>
      )}

      {/* Dates */}
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}
        </script>
      )}
    </Helmet>
  );
};

// ==================== PRE-CONFIGURED META TAG TEMPLATES ====================

/**
 * Homepage Meta Tags
 */
export const HomePageMeta: React.FC = () => (
  <MetaTags
    title="BeautyCita - Find & Book Beauty Professionals Near You"
    description="Discover talented beauty professionals, view portfolios, read reviews, and book appointments instantly. Hair stylists, makeup artists, nail technicians, and more."
    keywords={['beauty salon', 'hair stylist', 'makeup artist', 'nail salon', 'book appointment', 'beauty services']}
    canonical="https://beautycita.com/"
    ogType="website"
    ogImage="https://beautycita.com/images/home-og-image.jpg"
    jsonLd={{
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'BeautyCita',
      url: 'https://beautycita.com',
      description: 'Find and book beauty professionals near you',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://beautycita.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    }}
  />
);

/**
 * Stylist Profile Meta Tags
 */
interface StylistProfileMetaProps {
  stylist: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
    profileImage: string;
    rating: number;
    reviewCount: number;
    city: string;
    state: string;
    specialties: string[];
  };
}

export const StylistProfileMeta: React.FC<StylistProfileMetaProps> = ({ stylist }) => {
  const fullName = `${stylist.firstName} ${stylist.lastName}`;
  const title = `${fullName} - Beauty Professional in ${stylist.city}, ${stylist.state}`;
  const description = stylist.bio || `Book an appointment with ${fullName}, a highly-rated beauty professional specializing in ${stylist.specialties.join(', ')}. ${stylist.reviewCount} reviews, ${stylist.rating} stars.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://beautycita.com/stylist/${stylist.username}`,
    name: fullName,
    image: stylist.profileImage,
    description: stylist.bio,
    address: {
      '@type': 'PostalAddress',
      addressLocality: stylist.city,
      addressRegion: stylist.state,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: stylist.rating,
      reviewCount: stylist.reviewCount,
    },
    url: `https://beautycita.com/stylist/${stylist.username}`,
  };

  return (
    <MetaTags
      title={title}
      description={description}
      keywords={[...stylist.specialties, 'beauty professional', stylist.city, stylist.state]}
      canonical={`https://beautycita.com/stylist/${stylist.username}`}
      ogType="profile"
      ogImage={stylist.profileImage}
      ogImageAlt={`${fullName} - Beauty Professional`}
      profileFirstName={stylist.firstName}
      profileLastName={stylist.lastName}
      profileUsername={stylist.username}
      twitterCreator={`@${stylist.username}`}
      jsonLd={jsonLd}
    />
  );
};

/**
 * Blog Post Meta Tags
 */
interface BlogPostMetaProps {
  post: {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    author: {
      name: string;
      twitter?: string;
    };
    publishedAt: string;
    updatedAt: string;
    category: string;
    tags: string[];
    slug: string;
  };
}

export const BlogPostMeta: React.FC<BlogPostMetaProps> = ({ post }) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'BeautyCita',
      logo: {
        '@type': 'ImageObject',
        url: 'https://beautycita.com/images/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://beautycita.com/blog/${post.slug}`,
    },
  };

  return (
    <MetaTags
      title={post.title}
      description={post.excerpt}
      keywords={post.tags}
      canonical={`https://beautycita.com/blog/${post.slug}`}
      ogType="article"
      ogImage={post.featuredImage}
      ogImageAlt={post.title}
      articlePublishedTime={post.publishedAt}
      articleModifiedTime={post.updatedAt}
      articleAuthor={post.author.name}
      articleSection={post.category}
      articleTags={post.tags}
      twitterCreator={post.author.twitter}
      jsonLd={jsonLd}
    />
  );
};

/**
 * Service Page Meta Tags
 */
interface ServicePageMetaProps {
  service: {
    name: string;
    description: string;
    category: string;
    averagePrice: number;
    averageDuration: number;
  };
  city?: string;
}

export const ServicePageMeta: React.FC<ServicePageMetaProps> = ({ service, city }) => {
  const locationSuffix = city ? ` in ${city}` : '';
  const title = `${service.name}${locationSuffix} - Book Beauty Services | BeautyCita`;
  const description = `${service.description} Average price: $${service.averagePrice}. Book online now.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    category: service.category,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: service.averagePrice * 0.7,
      highPrice: service.averagePrice * 1.3,
      offerCount: 100,
    },
  };

  return (
    <MetaTags
      title={title}
      description={description}
      keywords={[service.name, service.category, 'beauty service', 'book online']}
      canonical={`https://beautycita.com/services/${service.name.toLowerCase().replace(/\s+/g, '-')}`}
      ogType="website"
      jsonLd={jsonLd}
    />
  );
};

/**
 * Search Results Meta Tags
 */
interface SearchResultsMetaProps {
  query: string;
  resultCount: number;
  city?: string;
  category?: string;
}

export const SearchResultsMeta: React.FC<SearchResultsMetaProps> = ({
  query,
  resultCount,
  city,
  category,
}) => {
  const locationText = city ? ` in ${city}` : '';
  const categoryText = category ? ` - ${category}` : '';
  const title = `${query}${locationText}${categoryText} - ${resultCount} Results | BeautyCita`;
  const description = `Found ${resultCount} beauty professionals matching "${query}"${locationText}. Browse portfolios, read reviews, and book appointments online.`;

  return (
    <MetaTags
      title={title}
      description={description}
      keywords={[query, 'search', 'beauty professionals', city || '', category || ''].filter(Boolean)}
      noindex={resultCount === 0}
      ogType="website"
    />
  );
};

// ==================== HOOKS ====================

/**
 * Hook to update page meta tags dynamically
 */
export function useMetaTags(metaProps: MetaTagsProps) {
  useEffect(() => {
    // Update meta tags when component mounts or props change
    // This is handled by react-helmet-async
  }, [metaProps]);

  return null;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate Open Graph image URL with dynamic text overlay
 */
export function generateOgImageUrl(params: {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  template?: 'default' | 'profile' | 'blog' | 'service';
}): string {
  const baseUrl = 'https://beautycita.com/api/og-image';
  const searchParams = new URLSearchParams({
    title: params.title,
    ...(params.subtitle && { subtitle: params.subtitle }),
    ...(params.imageUrl && { image: params.imageUrl }),
    template: params.template || 'default',
  });

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Extract meta tags from current page
 */
export function extractMetaTags(): Record<string, string> {
  const metaTags: Record<string, string> = {};

  if (typeof document === 'undefined') return metaTags;

  const metas = document.querySelectorAll('meta');
  metas.forEach((meta) => {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');
    if (name && content) {
      metaTags[name] = content;
    }
  });

  return metaTags;
}

/**
 * Validate meta tag configuration
 */
export function validateMetaTags(props: MetaTagsProps): string[] {
  const errors: string[] = [];

  if (!props.title) errors.push('Title is required');
  if (!props.description) errors.push('Description is required');
  if (props.title && props.title.length > 60) errors.push('Title should be under 60 characters');
  if (props.description && props.description.length > 160) errors.push('Description should be under 160 characters');
  if (props.ogImage && !props.ogImage.startsWith('http')) errors.push('OG image must be an absolute URL');

  return errors;
}

export default MetaTags;
