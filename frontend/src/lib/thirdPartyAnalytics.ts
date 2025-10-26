/**
 * Third-Party Analytics Integrations
 * Mixpanel, Amplitude, LogRocket, FullStory
 */

// Mixpanel Integration
export class MixpanelIntegration {
  private initialized = false;

  async init(token: string) {
    if (this.initialized) return;

    // Load Mixpanel SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
    script.async = true;
    
    await new Promise((resolve) => {
      script.onload = resolve;
      document.head.appendChild(script);
    });

    // Initialize Mixpanel
    if (window.mixpanel) {
      window.mixpanel.init(token, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: 'localStorage'
      });
      this.initialized = true;
    }
  }

  identify(userId: string, properties?: object) {
    if (window.mixpanel) {
      window.mixpanel.identify(userId);
      if (properties) {
        window.mixpanel.people.set(properties);
      }
    }
  }

  track(eventName: string, properties?: object) {
    if (window.mixpanel) {
      window.mixpanel.track(eventName, properties);
    }
  }

  setUserProperties(properties: object) {
    if (window.mixpanel) {
      window.mixpanel.people.set(properties);
    }
  }

  trackRevenue(amount: number, properties?: object) {
    if (window.mixpanel) {
      window.mixpanel.people.track_charge(amount, properties);
    }
  }
}

// Amplitude Integration
export class AmplitudeIntegration {
  private initialized = false;

  async init(apiKey: string) {
    if (this.initialized) return;

    // Load Amplitude SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.amplitude.com/libs/analytics-browser-2.0.0-min.js.gz';
    script.async = true;
    
    await new Promise((resolve) => {
      script.onload = resolve;
      document.head.appendChild(script);
    });

    // Initialize Amplitude
    if (window.amplitude) {
      window.amplitude.init(apiKey, {
        defaultTracking: {
          pageViews: true,
          sessions: true,
          formInteractions: true,
          fileDownloads: true
        }
      });
      this.initialized = true;
    }
  }

  identify(userId: string) {
    if (window.amplitude) {
      window.amplitude.setUserId(userId);
    }
  }

  track(eventName: string, properties?: object) {
    if (window.amplitude) {
      window.amplitude.track(eventName, properties);
    }
  }

  setUserProperties(properties: object) {
    if (window.amplitude) {
      const identify = new window.amplitude.Identify();
      Object.entries(properties).forEach(([key, value]) => {
        identify.set(key, value);
      });
      window.amplitude.identify(identify);
    }
  }

  trackRevenue(amount: number, productId?: string, quantity = 1) {
    if (window.amplitude) {
      const revenue = new window.amplitude.Revenue()
        .setPrice(amount)
        .setQuantity(quantity);
      
      if (productId) {
        revenue.setProductId(productId);
      }
      
      window.amplitude.revenue(revenue);
    }
  }
}

// LogRocket Integration (Session Replay)
export class LogRocketIntegration {
  private initialized = false;

  async init(appId: string) {
    if (this.initialized) return;

    // Load LogRocket SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.lr-ingest.io/LogRocket.min.js';
    script.async = true;
    
    await new Promise((resolve) => {
      script.onload = resolve;
      document.head.appendChild(script);
    });

    // Initialize LogRocket
    if (window.LogRocket) {
      window.LogRocket.init(appId, {
        console: {
          shouldAggregateConsoleErrors: true
        },
        network: {
          requestSanitizer: (request: any) => {
            // Sanitize sensitive data
            if (request.headers.Authorization) {
              request.headers.Authorization = '[REDACTED]';
            }
            return request;
          }
        }
      });
      this.initialized = true;
    }
  }

  identify(userId: string, properties?: object) {
    if (window.LogRocket) {
      window.LogRocket.identify(userId, properties);
    }
  }

  track(eventName: string, properties?: object) {
    if (window.LogRocket) {
      window.LogRocket.track(eventName, properties);
    }
  }

  getSessionURL(): string | null {
    if (window.LogRocket) {
      return window.LogRocket.sessionURL;
    }
    return null;
  }

  captureException(error: Error) {
    if (window.LogRocket) {
      window.LogRocket.captureException(error);
    }
  }
}

// FullStory Integration (Session Replay)
export class FullStoryIntegration {
  private initialized = false;

  async init(orgId: string) {
    if (this.initialized) return;

    // Load FullStory SDK
    window._fs_debug = process.env.NODE_ENV === 'development';
    window._fs_host = 'fullstory.com';
    window._fs_script = 'edge.fullstory.com/s/fs.js';
    window._fs_org = orgId;
    window._fs_namespace = 'FS';

    const script = document.createElement('script');
    script.src = 'https://' + window._fs_script;
    script.async = true;
    
    await new Promise((resolve) => {
      script.onload = resolve;
      document.head.appendChild(script);
    });

    this.initialized = true;
  }

  identify(userId: string, properties?: object) {
    if (window.FS) {
      window.FS.identify(userId, properties);
    }
  }

  setUserProperties(properties: object) {
    if (window.FS) {
      window.FS.setUserVars(properties);
    }
  }

  event(eventName: string, properties?: object) {
    if (window.FS) {
      window.FS.event(eventName, properties);
    }
  }

  getSessionURL(): string | null {
    if (window.FS) {
      return window.FS.getCurrentSessionURL();
    }
    return null;
  }
}

// Unified Analytics Manager
export class AnalyticsManager {
  private mixpanel: MixpanelIntegration | null = null;
  private amplitude: AmplitudeIntegration | null = null;
  private logrocket: LogRocketIntegration | null = null;
  private fullstory: FullStoryIntegration | null = null;

  async initialize(config: {
    mixpanelToken?: string;
    amplitudeKey?: string;
    logrocketAppId?: string;
    fullstoryOrgId?: string;
  }) {
    const promises = [];

    if (config.mixpanelToken) {
      this.mixpanel = new MixpanelIntegration();
      promises.push(this.mixpanel.init(config.mixpanelToken));
    }

    if (config.amplitudeKey) {
      this.amplitude = new AmplitudeIntegration();
      promises.push(this.amplitude.init(config.amplitudeKey));
    }

    if (config.logrocketAppId) {
      this.logrocket = new LogRocketIntegration();
      promises.push(this.logrocket.init(config.logrocketAppId));
    }

    if (config.fullstoryOrgId) {
      this.fullstory = new FullStoryIntegration();
      promises.push(this.fullstory.init(config.fullstoryOrgId));
    }

    await Promise.all(promises);
  }

  identify(userId: string, properties?: object) {
    this.mixpanel?.identify(userId, properties);
    this.amplitude?.identify(userId);
    this.logrocket?.identify(userId, properties);
    this.fullstory?.identify(userId, properties);
  }

  track(eventName: string, properties?: object) {
    this.mixpanel?.track(eventName, properties);
    this.amplitude?.track(eventName, properties);
    this.logrocket?.track(eventName, properties);
    this.fullstory?.event(eventName, properties);
  }

  setUserProperties(properties: object) {
    this.mixpanel?.setUserProperties(properties);
    this.amplitude?.setUserProperties(properties);
    this.fullstory?.setUserProperties(properties);
  }

  trackRevenue(amount: number, properties?: object) {
    this.mixpanel?.trackRevenue(amount, properties);
    this.amplitude?.trackRevenue(amount);
  }

  getSessionURL(): string | null {
    return this.logrocket?.getSessionURL() || this.fullstory?.getSessionURL() || null;
  }
}

// Global analytics instance
export const analytics = new AnalyticsManager();

// Type declarations for window
declare global {
  interface Window {
    mixpanel: any;
    amplitude: any;
    LogRocket: any;
    FS: any;
    _fs_debug: boolean;
    _fs_host: string;
    _fs_script: string;
    _fs_org: string;
    _fs_namespace: string;
  }
}
