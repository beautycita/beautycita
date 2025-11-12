const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '/var/www/beautycita.com/.env' });

// Configure R2 S3 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Content type mappings
const contentTypes = {
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.apk': 'application/vnd.android.package-archive',
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return contentTypes[ext] || 'application/octet-stream';
}

async function uploadFile(localPath, remotePath) {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    const contentType = getContentType(localPath);

    console.log(`📤 Uploading ${path.basename(localPath)} → ${remotePath} (${fileSizeMB} MB)...`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: remotePath,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    });

    await r2Client.send(command);

    const publicUrl = `${PUBLIC_URL}/${remotePath}`;
    console.log(`✅ Success! URL: ${publicUrl}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

async function uploadMediaFiles() {
  console.log('🚀 Uploading media files to Cloudflare R2...');
  console.log(`Bucket: ${BUCKET_NAME}\n`);

  const mediaDir = '/var/www/beautycita.com/frontend/dist/media';
  const mediaKitDir = '/var/www/beautycita.com/frontend/dist/media-kit';

  const results = {
    success: 0,
    failed: 0,
    total: 0,
  };

  // Upload media folder
  if (fs.existsSync(mediaDir)) {
    console.log('\n📁 Uploading /media folder...');
    const mediaFiles = getAllFiles(mediaDir);

    for (const file of mediaFiles) {
      results.total++;
      const relativePath = path.relative('/var/www/beautycita.com/frontend/dist', file);
      const result = await uploadFile(file, relativePath);

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
    }
  }

  // Upload media-kit folder
  if (fs.existsSync(mediaKitDir)) {
    console.log('\n📁 Uploading /media-kit folder...');
    const mediaKitFiles = getAllFiles(mediaKitDir);

    for (const file of mediaKitFiles) {
      results.total++;
      const relativePath = path.relative('/var/www/beautycita.com/frontend/dist', file);
      const result = await uploadFile(file, relativePath);

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
    }
  }

  // Upload aphrodite.png
  const aphroditeFile = '/var/www/beautycita.com/frontend/dist/aphrodite.png';
  if (fs.existsSync(aphroditeFile)) {
    console.log('\n📁 Uploading aphrodite.png...');
    results.total++;
    const result = await uploadFile(aphroditeFile, 'aphrodite.png');
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
  }

  console.log('\n✨ Upload complete!');
  console.log(`📊 Results: ${results.success} success, ${results.failed} failed, ${results.total} total`);

  return results;
}

uploadMediaFiles().catch(console.error);
