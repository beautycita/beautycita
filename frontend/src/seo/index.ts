/**
 * BeautyCita SEO & Content Optimization
 * Export all SEO components and utilities
 */

// Meta Tags
export {
  MetaTags,
  HomePageMeta,
  StylistProfileMeta,
  BlogPostMeta,
  ServicePageMeta,
  SearchResultsMeta,
  useMetaTags,
  generateOgImageUrl,
  extractMetaTags,
  validateMetaTags,
} from './MetaTags';

export type { MetaTagsProps } from './MetaTags';

// Structured Data
export {
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
} from './StructuredData';

// Core Web Vitals
export {
  reportWebVitals,
  sendToAnalytics,
  OptimizedImage,
  WebPImage,
  AspectRatioBox,
  ContentPlaceholder,
  DNSPrefetch,
  Preconnect,
  Prefetch,
  Preload,
  PreloadFont,
  useNetworkStatus,
  useInView,
  LazyRender,
  useDebounce,
  useThrottle,
  DeferScript,
  useIdleScript,
  usePerformanceObserver,
  CriticalCSS,
  FontFaceCSS,
} from './CoreWebVitals';

// Social Sharing
export {
  FacebookShareButton,
  TwitterShareButton,
  LinkedInShareButton,
  PinterestShareButton,
  WhatsAppShareButton,
  EmailShareButton,
  CopyLinkButton,
  NativeShareButton,
  ShareMenu,
  FloatingShareBar,
  socialSharingStyles,
} from './SocialSharing';

export type { ShareData } from './SocialSharing';

// Blog System
export {
  BlogPostCard,
  BlogPostList,
  BlogPostView,
  BlogCategoriesSidebar,
  sampleBlogPosts,
  blogCategories,
} from './BlogSystem';

export type { BlogPost, BlogCategory } from './BlogSystem';

// Local SEO
export {
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
} from './LocalSEO';

export type { BusinessLocation, BusinessHours, LocalReview } from './LocalSEO';
