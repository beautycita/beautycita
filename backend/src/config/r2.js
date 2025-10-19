const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

// Configure R2 S3 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'beautycita-media';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;

/**
 * Upload image to Cloudflare R2
 * @param {string} fileBuffer - Base64 encoded image or buffer
 * @param {string} folder - Folder path in bucket
 * @param {string} publicId - Optional public ID for the image
 * @returns {Promise} Upload result
 */
const uploadImage = async (fileBuffer, folder = 'portfolio', publicId = null) => {
  try {
    // Convert base64 to buffer if needed
    let buffer;
    if (typeof fileBuffer === 'string') {
      // Remove data:image/xxx;base64, prefix if present
      const base64Data = fileBuffer.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = fileBuffer;
    }

    // Optimize image with sharp (resize + compress)
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    // Generate key (S3 path)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const key = publicId
      ? `beautycita/${folder}/${publicId}.jpg`
      : `beautycita/${folder}/${timestamp}-${randomId}.jpg`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    await r2Client.send(command);

    // Generate public URL
    const url = `${PUBLIC_URL}/${key}`;

    // Get image metadata
    const metadata = await sharp(optimizedBuffer).metadata();

    return {
      success: true,
      url: url,
      publicId: key,
      width: metadata.width,
      height: metadata.height,
      format: 'jpeg',
      bytes: optimizedBuffer.length
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete image from R2
 * @param {string} publicId - Key (path) of the image to delete
 * @returns {Promise} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: publicId,
    });

    await r2Client.send(command);

    return {
      success: true,
      result: 'ok'
    };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get optimized image URL
 * @param {string} publicId - Key (path) of the image
 * @param {object} options - Transformation options (ignored for now, R2 doesn't have built-in transforms)
 * @returns {string} Image URL
 */
const getOptimizedUrl = (publicId, options = {}) => {
  // R2 doesn't have built-in image transformations like Cloudinary
  // Return the direct public URL
  return `${PUBLIC_URL}/${publicId}`;
};

module.exports = {
  r2Client,
  uploadImage,
  deleteImage,
  getOptimizedUrl
};
