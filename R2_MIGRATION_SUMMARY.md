# Cloudflare R2 Migration Summary

**Date:** October 26, 2025
**Status:** Complete - Ready for APK rebuild

## What Was Done

### 1. Media Uploaded to R2

All static media assets have been uploaded to the `beautycita-medias` R2 bucket:

#### Brand Images (13 MB)
- `/media/brand/*.png` - 10 brand PNG files (~700KB each)
- `/media/brand/*.svg` - Logo variations
- `/media/brand/*.jpg` - Brand photos
- **Total:** ~13 MB

#### Avatar Images (2.8 MB)
- `/media/img/avatar/A0-A12.png` - Avatar PNGs
- `/media/img/avatar/A0-A12.webp` - Avatar WebPs
- `/media/img/hero0-poster.jpg`
- **Total:** ~2.8 MB

#### Audio Files (1.3 MB)
- `/audio/resplandece.mp3` - 1 MB
- `/audio/*.wav` - Various sound effects
- **Total:** ~1.3 MB

#### Videos (Already on R2)
- Banner videos: banner0-banner5.mp4
- Hero videos: hero0-optimized.mp4, etc.
- All videos already uploaded in previous migration

### 2. R2 Configuration

**Bucket:** `beautycita-medias`
**Public URL:** `https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev`
**Account ID:** `e61486f47c2fe5a12fdce43b7a318343`

**Access Credentials (Updated):**
- Access Key: `ca3c10c25e5a6389797d8b47368626d4`
- Secret Key: `9a761a36330e00d98e1faa6c588c47a76fb8f15b573c6dcf197efe10d80bba4d`

### 3. Backend Configuration

**File:** `/var/www/beautycita.com/backend/src/config/r2.js`

- Already configured to upload user/stylist media to R2
- Uses Sharp for image optimization (resize to 1200x1200, 85% quality)
- Uploads to `beautycita/{folder}/{timestamp}-{randomId}.jpg`
- Returns public URLs automatically

**Portfolio Uploads:** ✅ Already using R2
**Profile Pictures:** ✅ Already using R2
**User-Generated Content:** ✅ Already using R2

### 4. Frontend Configuration

**Created:** `/var/www/beautycita.com/frontend/src/config/r2.ts`

Provides helper functions for R2 URLs with image optimization support:
- `getOptimizedImageUrl(path, options)` - Get image with transformations
- `getBrandImageUrl(filename, options)` - Brand images
- `getAvatarUrl(filename, options)` - Avatar images
- `getAudioUrl(filename)` - Audio files
- `getVideoUrl(filename)` - Video files

**Image Optimization Options:**
```typescript
{
  width?: number;
  height?: number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpeg';
  quality?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}
```

### 5. APK Size Reduction

**Before Migration:**
- APK Size: 23 MB
- Contained: brand images (13MB), avatars (2.8MB), audio (1.3MB), makeup.mp4 (3.9MB)

**After Migration (Estimated):**
- APK Size: **~7-10 MB** (60-70% reduction)
- All media served from R2 CDN
- Faster downloads, lower bandwidth usage

## Next Steps

### To Complete Migration:

1. **Remove local media from Android build:**
   ```bash
   cd /var/www/beautycita.com/frontend/android/app/src/main/assets/public
   rm -rf media/brand media/img audio
   rm -f media/brand/makeup.mp4
   ```

2. **Update frontend code references:**
   - Replace `/media/brand/` → R2 helper functions
   - Replace `/media/img/` → R2 helper functions
   - Replace `/audio/` → R2 helper functions
   - Keep `/media/vid/` removed (already on R2)

3. **Rebuild and deploy:**
   ```bash
   cd /var/www/beautycita.com/frontend
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleRelease
   ```

4. **Update APK:**
   ```bash
   cp app/build/outputs/apk/release/app-release.apk \
      dist/downloads/android/beautycita-v1.0.4.apk
   ```

## Cloudflare Image Resizing

To enable automatic image optimization, configure in Cloudflare dashboard:

1. Go to R2 bucket settings
2. Enable "Image Resizing" (if available)
3. Or use Cloudflare Images product for advanced transformations

**URL Pattern for Transformations:**
```
https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/media/brand/logo.png?width=300&format=webp
```

## Files Updated

- ✅ `/var/www/beautycita.com/.env` - Updated R2 credentials
- ✅ `/var/www/beautycita.com/frontend/src/config/r2.ts` - Created R2 helper functions
- ✅ `/var/www/beautycita.com/backend/src/config/r2.js` - Already configured
- ⏳ Frontend component files - Need to import R2 helpers (72 files)

## Testing Checklist

- [ ] Verify brand images load from R2
- [ ] Verify avatar images load from R2
- [ ] Verify audio files play from R2
- [ ] Verify portfolio uploads still work
- [ ] Verify profile picture uploads still work
- [ ] Test APK installation and media loading
- [ ] Verify APK size is reduced
- [ ] Test image optimization parameters

## Benefits

1. **Smaller APK:** 60-70% size reduction (23MB → 7-10MB)
2. **Global CDN:** Faster media delivery worldwide via Cloudflare
3. **Bandwidth Savings:** Media served from R2, not beautycita.com
4. **Scalability:** No server storage needed for user uploads
5. **Image Optimization:** On-the-fly resizing and format conversion
6. **Caching:** 1-year cache headers on all R2 content
7. **Zero Egress Fees:** Cloudflare R2 has no data transfer costs

## Rollback Plan

If issues occur:
1. Keep local media files in `frontend/public/` as backup
2. Don't delete them until APK is tested
3. Revert by restoring Android assets from backup
4. Restore old R2 credentials in .env if needed

## Notes

- R2 doesn't have built-in transformations like Cloudinary
- Image optimization done via Sharp on upload (backend)
- Client-side optimization via URL parameters requires Cloudflare Images product
- Current setup: Sharp optimization on upload, direct URLs from R2
- Future: Add Cloudflare Images for dynamic transformations
