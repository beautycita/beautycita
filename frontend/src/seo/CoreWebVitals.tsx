/**
 * Core Web Vitals Optimization - Google Ranking Factors
 *
 * Optimize for:
 * - Largest Contentful Paint (LCP) - < 2.5s
 * - First Input Delay (FID) - < 100ms
 * - Cumulative Layout Shift (CLS) - < 0.1
 * - First Contentful Paint (FCP) - < 1.8s
 * - Time to Interactive (TTI) - < 3.8s
 */

import { useEffect, useRef, useState } from 'react';

// ==================== WEB VITALS MEASUREMENT ====================

/**
 * Measure and report Core Web Vitals
 */
export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry && typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
}

/**
 * Send vitals to analytics
 */
export function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta,
    rating: metric.rating,
  });

  // Send to your analytics endpoint
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', {
      body,
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ==================== LCP OPTIMIZATION ====================

/**
 * Preload critical images for faster LCP
 */
export const PreloadImage: React.FC<{ src: string; as?: string }> = ({ src, as = 'image' }) => {
  return (
    <link
      rel="preload"
      as={as}
      href={src}
      // @ts-ignore
      fetchpriority="high"
    />
  );
};

/**
 * Lazy load images with native loading attribute
 */
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  width,
  height,
  className,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  return (
    <>
      {priority && <PreloadImage src={src} />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        width={width}
        height={height}
        onLoad={() => setLoaded(true)}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        {...props}
      />
    </>
  );
};

/**
 * WebP image with fallback
 */
export const WebPImage: React.FC<{
  src: string;
  fallback: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}> = ({ src, fallback, alt, className, width, height }) => {
  return (
    <picture>
      <source srcSet={src} type="image/webp" />
      <source srcSet={fallback} type="image/jpeg" />
      <img src={fallback} alt={alt} className={className} width={width} height={height} loading="lazy" />
    </picture>
  );
};

// ==================== CLS OPTIMIZATION ====================

/**
 * Fixed aspect ratio container to prevent layout shift
 */
export const AspectRatioBox: React.FC<{
  ratio?: number; // width / height, e.g., 16/9 = 1.778
  children: React.ReactNode;
  className?: string;
}> = ({ ratio = 16 / 9, children, className = '' }) => {
  return (
    <div className={`relative ${className}`} style={{ paddingBottom: `${(1 / ratio) * 100}%` }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
};

/**
 * Reserve space for dynamic content to prevent CLS
 */
export const ContentPlaceholder: React.FC<{
  minHeight?: number;
  children: React.ReactNode;
  className?: string;
}> = ({ minHeight = 200, children, className = '' }) => {
  return (
    <div className={className} style={{ minHeight: `${minHeight}px` }}>
      {children}
    </div>
  );
};

// ==================== FID OPTIMIZATION ====================

/**
 * Code splitting wrapper with dynamic import
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.LazyExoticComponent<T> {
  const LazyComponent = React.lazy(importFunc);

  return LazyComponent;
}

/**
 * Debounce user input to reduce processing
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle expensive operations
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRan = useRef<number>(Date.now());

  return (...args: Parameters<T>) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => {
          callback(...args);
          lastRan.current = Date.now();
        },
        delay - (Date.now() - lastRan.current)
      );
    }
  };
}

// ==================== RESOURCE HINTS ====================

/**
 * DNS Prefetch for external domains
 */
export const DNSPrefetch: React.FC<{ href: string }> = ({ href }) => {
  return <link rel="dns-prefetch" href={href} />;
};

/**
 * Preconnect to critical domains
 */
export const Preconnect: React.FC<{ href: string; crossOrigin?: boolean }> = ({
  href,
  crossOrigin = false,
}) => {
  return <link rel="preconnect" href={href} {...(crossOrigin && { crossOrigin: 'anonymous' })} />;
};

/**
 * Prefetch next page resources
 */
export const Prefetch: React.FC<{ href: string; as?: string }> = ({ href, as = 'document' }) => {
  return <link rel="prefetch" href={href} as={as} />;
};

/**
 * Preload critical resources
 */
export const Preload: React.FC<{
  href: string;
  as: 'script' | 'style' | 'font' | 'image';
  type?: string;
  crossOrigin?: boolean;
}> = ({ href, as, type, crossOrigin = false }) => {
  return (
    <link
      rel="preload"
      href={href}
      as={as}
      {...(type && { type })}
      {...(crossOrigin && { crossOrigin: 'anonymous' })}
    />
  );
};

// ==================== PERFORMANCE HOOKS ====================

/**
 * Detect slow network and adjust quality
 */
export function useNetworkStatus() {
  const [effectiveType, setEffectiveType] = useState<string>('4g');
  const [downlink, setDownlink] = useState<number>(10);
  const [saveData, setSaveData] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateNetworkInfo = () => {
        setEffectiveType(connection.effectiveType || '4g');
        setDownlink(connection.downlink || 10);
        setSaveData(connection.saveData || false);
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  return {
    effectiveType,
    downlink,
    saveData,
    isSlow: effectiveType === 'slow-2g' || effectiveType === '2g' || saveData,
  };
}

/**
 * Intersection Observer for lazy rendering
 */
export function useInView(options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasBeenInView(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isInView, hasBeenInView };
}

/**
 * Lazy render component when in viewport
 */
export const LazyRender: React.FC<{
  children: React.ReactNode;
  height?: number;
  placeholder?: React.ReactNode;
}> = ({ children, height = 200, placeholder }) => {
  const { ref, hasBeenInView } = useInView();

  return (
    <div ref={ref} style={{ minHeight: hasBeenInView ? 'auto' : `${height}px` }}>
      {hasBeenInView ? children : placeholder || <div style={{ height: `${height}px` }} />}
    </div>
  );
};

// ==================== FONT OPTIMIZATION ====================

/**
 * Preload critical fonts
 */
export const PreloadFont: React.FC<{
  href: string;
  type?: string;
}> = ({ href, type = 'font/woff2' }) => {
  return <link rel="preload" href={href} as="font" type={type} crossOrigin="anonymous" />;
};

/**
 * Font display swap for faster text rendering
 */
export const FontFaceCSS = `
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
  font-style: normal;
}
`;

// ==================== JAVASCRIPT OPTIMIZATION ====================

/**
 * Defer non-critical scripts
 */
export const DeferScript: React.FC<{ src: string; onLoad?: () => void }> = ({ src, onLoad }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    if (onLoad) script.onload = onLoad;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [src, onLoad]);

  return null;
};

/**
 * Load script on interaction (idle loading)
 */
export function useIdleScript(src: string) {
  useEffect(() => {
    const loadScript = () => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadScript);
    } else {
      setTimeout(loadScript, 1);
    }
  }, [src]);
}

// ==================== PERFORMANCE MONITORING ====================

/**
 * Performance observer for monitoring
 */
export function usePerformanceObserver(callback: (entries: PerformanceEntry[]) => void) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });

    observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

    return () => {
      observer.disconnect();
    };
  }, [callback]);
}

// ==================== CRITICAL CSS ====================

/**
 * Inline critical CSS to reduce render-blocking
 */
export const CriticalCSS = `
/* Critical CSS for above-the-fold content */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Skeleton loaders for initial paint */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

// ==================== EXPORT ALL ====================

export default {
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
};
