/**
 * Media Configuration
 * Centralized configuration for media assets served from Cloudflare R2
 */

export const MEDIA_CONFIG = {
  R2_URL: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev',

  /**
   * Get full URL for a media path
   * @param path - Path relative to /media/ (e.g., 'brand/logo.svg' or 'img/avatar/A1.png')
   * @returns Full R2 URL
   */
  getMediaUrl: (path: string): string => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    // Remove 'media/' prefix if present (we'll add it back)
    const withoutMedia = cleanPath.startsWith('media/') ? cleanPath.substring(6) : cleanPath;
    return `${MEDIA_CONFIG.R2_URL}/media/${withoutMedia}`;
  },

  /**
   * Legacy helper for backward compatibility
   * Converts old /media/... paths to R2 URLs
   */
  convertPath: (oldPath: string): string => {
    if (oldPath.startsWith('/media/')) {
      return MEDIA_CONFIG.getMediaUrl(oldPath.substring(7));
    }
    return MEDIA_CONFIG.getMediaUrl(oldPath);
  }
};

// Convenience exports
export const getMediaUrl = MEDIA_CONFIG.getMediaUrl;
export const convertMediaPath = MEDIA_CONFIG.convertPath;
