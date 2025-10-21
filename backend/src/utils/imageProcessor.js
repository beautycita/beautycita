const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Image Processing Utility
 * Normalizes uploaded images for consistent vibe/feel across the platform
 */

const IMAGE_SIZES = {
  thumbnail: { width: 200, height: 200 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 }
};

/**
 * Process and normalize an uploaded image
 * @param {string} inputPath - Path to the original uploaded image
 * @param {string} outputDir - Directory to save processed images
 * @param {string} baseFilename - Base filename without extension
 * @returns {Promise<Object>} - Object with paths to processed images
 */
async function processImage(inputPath, outputDir, baseFilename) {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const results = {};

    // Process large size (main image) - WebP
    const largeWebpPath = path.join(outputDir, `${baseFilename}.webp`);
    await sharp(inputPath)
      .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85, effort: 4 })
      .modulate({ brightness: 1.0, saturation: 1.05, hue: 0 })
      .sharpen()
      .toFile(largeWebpPath);
    
    results.main = largeWebpPath;

    // Create JPEG fallback
    const jpegPath = path.join(outputDir, `${baseFilename}.jpg`);
    await sharp(inputPath)
      .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85, progressive: true })
      .modulate({ brightness: 1.0, saturation: 1.05, hue: 0 })
      .sharpen()
      .toFile(jpegPath);

    results.jpeg = jpegPath;

    // Delete original
    await fs.unlink(inputPath);

    return {
      success: true,
      files: results,
      mainImage: jpegPath // Return JPEG path for compatibility
    };

  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image: ' + error.message);
  }
}

module.exports = {
  processImage,
  IMAGE_SIZES
};
