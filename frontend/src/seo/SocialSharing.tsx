/**
 * Social Sharing Buttons - Easy sharing for portfolios and content
 *
 * Support for:
 * - Facebook
 * - Twitter/X
 * - LinkedIn
 * - Pinterest
 * - WhatsApp
 * - Email
 * - Copy Link
 * - Native Share API
 */

import React, { useState } from 'react';

export interface ShareData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  hashtags?: string[];
}

interface SocialShareButtonProps {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'pinterest' | 'whatsapp' | 'email' | 'copy';
  shareData: ShareData;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'floating';
  className?: string;
  onShare?: (platform: string) => void;
}

// ==================== SHARE URL GENERATORS ====================

function generateFacebookShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    u: data.url,
    quote: data.description || data.title,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

function generateTwitterShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    url: data.url,
    text: data.title,
    ...(data.hashtags && { hashtags: data.hashtags.join(',') }),
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function generateLinkedInShareUrl(data: ShareData): string {
  const params = new URLSearchParams({
    url: data.url,
  });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

function generatePinterestShareUrl(data: ShareData): string {
  if (!data.image) {
    console.warn('Pinterest sharing requires an image URL');
  }
  const params = new URLSearchParams({
    url: data.url,
    media: data.image || '',
    description: data.description || data.title,
  });
  return `https://pinterest.com/pin/create/button/?${params.toString()}`;
}

function generateWhatsAppShareUrl(data: ShareData): string {
  const text = `${data.title}\n${data.url}`;
  const params = new URLSearchParams({ text });
  return `https://wa.me/?${params.toString()}`;
}

function generateEmailShareUrl(data: ShareData): string {
  const subject = data.title;
  const body = `${data.description || ''}\n\n${data.url}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ==================== INDIVIDUAL SHARE BUTTONS ====================

export const FacebookShareButton: React.FC<Omit<SocialShareButtonProps, 'platform'>> = ({
  shareData,
  size = 'md',
  variant = 'icon',
  className = '',
  onShare,
}) => {
  const handleShare = () => {
    const url = generateFacebookShareUrl(shareData);
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.('facebook');
  };

  return (
    <button
      onClick={handleShare}
      className={`social-share-btn facebook ${size} ${variant} ${className}`}
      aria-label="Share on Facebook"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      {variant === 'button' && <span className="ml-2">Share on Facebook</span>}
    </button>
  );
};

export const TwitterShareButton: React.FC<Omit<SocialShareButtonProps, 'platform'>> = ({
  shareData,
  size = 'md',
  variant = 'icon',
  className = '',
  onShare,
}) => {
  const handleShare = () => {
    const url = generateTwitterShareUrl(shareData);
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.('twitter');
  };

  return (
    <button
      onClick={handleShare}
      className={`social-share-btn twitter ${size} ${variant} ${className}`}
      aria-label="Share on Twitter"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
      {variant === 'button' && <span className="ml-2">Share on Twitter</span>}
    </button>
  );
};

export const LinkedInShareButton: React.FC<Omit<SocialShareButtonProps, 'platform'>> = ({
  shareData,
  size = 'md',
  variant = 'icon',
  className = '',
  onShare,
}) => {
  const handleShare = () => {
    const url = generateLinkedInShareUrl(shareData);
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.('linkedin');
  };

  return (
    <button
      onClick={handleShare}
      className={`social-share-btn linkedin ${size} ${variant} ${className}`}
      aria-label="Share on LinkedIn"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      {variant === 'button' && <span className="ml-2">Share on LinkedIn</span>}
    </button>
  );
};

export const PinterestShareButton: React.FC<Omit<SocialShareButtonProps, 'platform'>> = ({
  shareData,
  size = 'md',
  variant = 'icon',
  className = '',
  onShare,
}) => {
  const handleShare = () => {
    const url = generatePinterestShareUrl(shareData);
    window.open(url, '_blank', 'width=600,height=400');
    onShare?.('pinterest');
  };

  return (
    <button
      onClick={handleShare}
      className={`social-share-btn pinterest ${size} ${variant} ${className}`}
      aria-label="Share on Pinterest"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
      </svg>
      {variant === 'button' && <span className="ml-2">Pin it</span>}
    </button>
  );
};

export const WhatsAppShareButton: React.FC<Omit<SocialShareButtonProps, 'platform'>> = ({
  shareData,
  size = 'md',
  variant = 'icon',
  className = '',
  onShare,
}) => {
  const handleShare = () => {
    const url = generateWhatsAppShareUrl(shareData);
    window.open(url, '_blank');
    onShare?.('whatsapp');
  };

  return (
    <button
      onClick={handleShare}
      className={`social-share-btn whatsapp ${size} ${variant} ${className}`}
      aria-label="Share on WhatsApp"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
      {variant === 'button' && <span className="ml-2">WhatsApp</span>}
    </button>
  );
};

export const EmailShareButton: React.FC<Omit<SocialShareButtonProps, 'platform'>> = ({
  shareData,
  size = 'md',
  variant = 'icon',
  className = '',
  onShare,
}) => {
  const handleShare = () => {
    const url = generateEmailShareUrl(shareData);
    window.location.href = url;
    onShare?.('email');
  };

  return (
    <button
      onClick={handleShare}
      className={`social-share-btn email ${size} ${variant} ${className}`}
      aria-label="Share via Email"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {variant === 'button' && <span className="ml-2">Email</span>}
    </button>
  );
};

export const CopyLinkButton: React.FC<Omit<SocialShareButtonProps, 'platform'>> = ({
  shareData,
  size = 'md',
  variant = 'icon',
  className = '',
  onShare,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShare?.('copy');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`social-share-btn copy-link ${size} ${variant} ${className}`}
      aria-label="Copy link"
    >
      {copied ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {variant === 'button' && <span className="ml-2">{copied ? 'Copied!' : 'Copy Link'}</span>}
    </button>
  );
};

// ==================== NATIVE SHARE API ====================

export const NativeShareButton: React.FC<{
  shareData: ShareData;
  children?: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
}> = ({ shareData, children, className = '', fallback }) => {
  const [canShare, setCanShare] = useState(false);

  React.useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.description,
        url: shareData.url,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!canShare && fallback) {
    return <>{fallback}</>;
  }

  if (!canShare) {
    return null;
  }

  return (
    <button onClick={handleShare} className={`native-share-btn ${className}`} aria-label="Share">
      {children || (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  );
};

// ==================== SHARE MENU COMPONENT ====================

export const ShareMenu: React.FC<{
  shareData: ShareData;
  platforms?: Array<'facebook' | 'twitter' | 'linkedin' | 'pinterest' | 'whatsapp' | 'email' | 'copy'>;
  variant?: 'horizontal' | 'vertical' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  onShare?: (platform: string) => void;
}> = ({
  shareData,
  platforms = ['facebook', 'twitter', 'linkedin', 'pinterest', 'whatsapp', 'email', 'copy'],
  variant = 'horizontal',
  size = 'md',
  showLabels = false,
  onShare,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const buttons = {
    facebook: <FacebookShareButton shareData={shareData} size={size} variant={showLabels ? 'button' : 'icon'} onShare={onShare} />,
    twitter: <TwitterShareButton shareData={shareData} size={size} variant={showLabels ? 'button' : 'icon'} onShare={onShare} />,
    linkedin: <LinkedInShareButton shareData={shareData} size={size} variant={showLabels ? 'button' : 'icon'} onShare={onShare} />,
    pinterest: <PinterestShareButton shareData={shareData} size={size} variant={showLabels ? 'button' : 'icon'} onShare={onShare} />,
    whatsapp: <WhatsAppShareButton shareData={shareData} size={size} variant={showLabels ? 'button' : 'icon'} onShare={onShare} />,
    email: <EmailShareButton shareData={shareData} size={size} variant={showLabels ? 'button' : 'icon'} onShare={onShare} />,
    copy: <CopyLinkButton shareData={shareData} size={size} variant={showLabels ? 'button' : 'icon'} onShare={onShare} />,
  };

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20 min-w-[200px]">
              <div className="flex flex-col gap-2">
                {platforms.map((platform) => (
                  <div key={platform} onClick={() => setIsOpen(false)}>
                    {buttons[platform]}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex ${variant === 'vertical' ? 'flex-col' : 'flex-row'} gap-2 items-center`}>
      {platforms.map((platform) => (
        <div key={platform}>{buttons[platform]}</div>
      ))}
    </div>
  );
};

// ==================== FLOATING SHARE BAR ====================

export const FloatingShareBar: React.FC<{
  shareData: ShareData;
  platforms?: Array<'facebook' | 'twitter' | 'linkedin' | 'pinterest' | 'whatsapp' | 'email' | 'copy'>;
  position?: 'left' | 'right';
  offset?: number;
}> = ({
  shareData,
  platforms = ['facebook', 'twitter', 'linkedin', 'pinterest'],
  position = 'left',
  offset = 100,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > offset);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 ${position === 'left' ? 'left-4' : 'right-4'} z-50`}
      style={{ transition: 'opacity 0.3s' }}
    >
      <div className="bg-white rounded-lg shadow-xl p-3 flex flex-col gap-3">
        <ShareMenu
          shareData={shareData}
          platforms={platforms}
          variant="vertical"
          size="sm"
        />
      </div>
    </div>
  );
};

// ==================== STYLED CSS (Tailwind) ====================

export const socialSharingStyles = `
.social-share-btn {
  @apply inline-flex items-center justify-center rounded-lg transition-colors;
}

.social-share-btn.sm {
  @apply w-8 h-8 text-sm;
}

.social-share-btn.md {
  @apply w-10 h-10;
}

.social-share-btn.lg {
  @apply w-12 h-12 text-lg;
}

.social-share-btn.button {
  @apply px-4 py-2 w-auto h-auto;
}

.social-share-btn.facebook {
  @apply bg-[#1877F2] text-white hover:bg-[#166FE5];
}

.social-share-btn.twitter {
  @apply bg-[#1DA1F2] text-white hover:bg-[#1A8CD8];
}

.social-share-btn.linkedin {
  @apply bg-[#0A66C2] text-white hover:bg-[#004182];
}

.social-share-btn.pinterest {
  @apply bg-[#E60023] text-white hover:bg-[#BD081C];
}

.social-share-btn.whatsapp {
  @apply bg-[#25D366] text-white hover:bg-[#1EBE57];
}

.social-share-btn.email {
  @apply bg-gray-600 text-white hover:bg-gray-700;
}

.social-share-btn.copy-link {
  @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
}
`;

export default ShareMenu;
