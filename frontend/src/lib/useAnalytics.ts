/**
 * Beautycita Analytics Hook
 * React hook for event tracking, A/B testing, and feature flags
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface EventProperties {
  [key: string]: any;
}

interface AnalyticsMetadata {
  pageUrl?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

interface Experiment {
  id: number;
  name: string;
  config: any;
  is_control: boolean;
}

interface AnalyticsHook {
  trackEvent: (eventName: string, properties?: EventProperties, category?: string) => Promise<void>;
  trackClick: (element: HTMLElement | null, pageUrl?: string) => void;
  getVariant: (experimentName: string) => Promise<Experiment | null>;
  recordConversion: (experimentName: string, value?: number) => Promise<void>;
  isFeatureEnabled: (featureName: string) => Promise<boolean>;
  sessionId: string;
}

const API_BASE = '/api/analytics';

// Generate session ID
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return timestamp + '-' + random;
}

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Analytics Hook
 */
export function useAnalytics(): AnalyticsHook {
  const [sessionId] = useState<string>(getSessionId());

  /**
   * Track an event
   */
  const trackEvent = useCallback(async (
    eventName: string,
    properties: EventProperties = {},
    category?: string
  ) => {
    try {
      await axios.post(API_BASE + '/events', {
        eventName,
        eventCategory: category,
        properties,
        sessionId,
        pageUrl: window.location.href
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [sessionId]);

  /**
   * Track click for heatmap
   */
  const trackClick = useCallback((element: HTMLElement | null, pageUrl?: string) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const selector = getElementSelector(element);

    try {
      // Send asynchronously, don't wait for response
      axios.post(API_BASE + '/heatmap/click', {
        pageUrl: pageUrl || window.location.pathname,
        elementSelector: selector,
        elementText: element.textContent?.substring(0, 100),
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        sessionId
      });
    } catch (error) {
      // Silently fail for heatmap tracking
      console.debug('Heatmap tracking error:', error);
    }
  }, [sessionId]);

  /**
   * Get user's variant for an experiment
   */
  const getVariant = useCallback(async (experimentName: string): Promise<Experiment | null> => {
    try {
      const response = await axios.get(API_BASE + '/experiments/' + experimentName + '/variant');
      return response.data.variant;
    } catch (error) {
      console.error('Error getting experiment variant:', error);
      return null;
    }
  }, []);

  /**
   * Record a conversion for an experiment
   */
  const recordConversion = useCallback(async (experimentName: string, value?: number) => {
    try {
      await axios.post(API_BASE + '/experiments/' + experimentName + '/conversion', {
        conversionValue: value
      });
    } catch (error) {
      console.error('Error recording conversion:', error);
    }
  }, []);

  /**
   * Check if a feature is enabled
   */
  const isFeatureEnabled = useCallback(async (featureName: string): Promise<boolean> => {
    try {
      const response = await axios.get(API_BASE + '/features/' + featureName);
      return response.data.enabled;
    } catch (error) {
      console.error('Error checking feature flag:', error);
      return false;
    }
  }, []);

  return {
    trackEvent,
    trackClick,
    getVariant,
    recordConversion,
    isFeatureEnabled,
    sessionId
  };
}

/**
 * Get CSS selector for an element
 */
function getElementSelector(element: HTMLElement): string {
  if (element.id) {
    return '#' + element.id;
  }

  if (element.className) {
    const classes = element.className.split(' ').filter(c => c).join('.');
    if (classes) {
      return element.tagName.toLowerCase() + '.' + classes;
    }
  }

  return element.tagName.toLowerCase();
}

/**
 * Higher-order component for A/B testing
 */
export function withExperiment<P extends object>(
  experimentName: string,
  ControlComponent: React.ComponentType<P>,
  VariantComponent: React.ComponentType<P>
) {
  return function ExperimentWrapper(props: P) {
    const { getVariant } = useAnalytics();
    const [variant, setVariant] = useState<Experiment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      getVariant(experimentName).then((v) => {
        setVariant(v);
        setLoading(false);
      });
    }, [experimentName]);

    if (loading) {
      return null;
    }

    if (variant?.is_control) {
      return <ControlComponent {...props} />;
    }

    return <VariantComponent {...props} />;
  };
}

/**
 * Feature flag component
 */
interface FeatureFlagProps {
  featureName: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureFlag({ featureName, fallback = null, children }: FeatureFlagProps) {
  const { isFeatureEnabled } = useAnalytics();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isFeatureEnabled(featureName).then((e) => {
      setEnabled(e);
      setLoading(false);
    });
  }, [featureName]);

  if (loading) {
    return null;
  }

  return <>{enabled ? children : fallback}</>;
}

/**
 * Auto-track page views
 */
export function usePageTracking() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('page_view', {
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer
    }, 'navigation');
  }, [window.location.pathname, trackEvent]);
}

/**
 * Auto-track clicks on all buttons
 */
export function useClickTracking() {
  const { trackClick } = useAnalytics();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        trackClick(target);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [trackClick]);
}

export default useAnalytics;
