import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

/**
 * Custom hook for managing page metadata (title, description, OG tags)
 *
 * @param options - Page metadata options
 * @example
 * usePageMeta({
 *   title: 'Find Stylists - BeautyCita',
 *   description: 'Browse professional beauty stylists in your area',
 *   keywords: 'stylists, beauty, hair, nails, makeup'
 * });
 */
export const usePageMeta = (options: PageMetaOptions) => {
  useEffect(() => {
    // Set page title
    document.title = options.title;

    // Set meta description
    if (options.description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', options.description);
    }

    // Set keywords
    if (options.keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', options.keywords);
    }

    // Set Open Graph title
    if (options.ogTitle || options.title) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', options.ogTitle || options.title);
    }

    // Set Open Graph description
    if (options.ogDescription || options.description) {
      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', options.ogDescription || options.description || '');
    }

    // Set Open Graph image
    if (options.ogImage) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', options.ogImage);
    }

    // Set Twitter Card title
    if (options.ogTitle || options.title) {
      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', options.ogTitle || options.title);
    }

    // Set Twitter Card description
    if (options.ogDescription || options.description) {
      let twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', options.ogDescription || options.description || '');
    }

  }, [options.title, options.description, options.keywords, options.ogTitle, options.ogDescription, options.ogImage]);
};

export default usePageMeta;
