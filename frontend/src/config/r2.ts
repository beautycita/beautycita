/**
 * Cloudflare R2 Configuration
 * All media assets are served from R2 with automatic optimization
 */

export const R2_PUBLIC_URL = 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev';

/**
 * Get optimized image URL from R2
 * @param path - Image path (e.g., 'media/brand/logo.png')
 * @param options - Image transformation options
 */
export function getOptimizedImageUrl(
  path: string,
  options?: {
    width?: number;
    height?: number;
    format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpeg';
    quality?: number;
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  }
): string {
  const baseUrl = `${R2_PUBLIC_URL}/${path}`;

  if (!options) return baseUrl;

  const params = new URLSearchParams();

  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.format) params.append('format', options.format);
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.fit) params.append('fit', options.fit);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Get media URL from R2
 * @param path - Media path (e.g., 'audio/resplandece.mp3', 'videos/hero0-optimized.mp4')
 */
export function getMediaUrl(path: string): string {
  return `${R2_PUBLIC_URL}/${path}`;
}

// Convenience functions for common media types
export const getBrandImageUrl = (filename: string, options?: Parameters<typeof getOptimizedImageUrl>[1]) =>
  getOptimizedImageUrl(`media/brand/${filename}`, options);

export const getAvatarUrl = (filename: string, options?: Parameters<typeof getOptimizedImageUrl>[1]) =>
  getOptimizedImageUrl(`media/img/avatar/${filename}`, options);

export const getAudioUrl = (filename: string) =>
  getMediaUrl(`audio/${filename}`);

export const getVideoUrl = (filename: string) =>
  getMediaUrl(`beautycita/videos/${filename}`);
