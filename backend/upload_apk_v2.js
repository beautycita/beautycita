const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
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

async function uploadFile(localPath, remotePath, contentType) {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

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

async function uploadAPK() {
  console.log('🚀 Uploading BeautyCita v2.2.0 optimized APK to Cloudflare R2...');
  console.log(`Bucket: ${BUCKET_NAME}\n`);

  const result = await uploadFile(
    '/var/www/beautycita.com/beautycita-mobile-v2.2.0-optimized.apk',
    'downloads/mobile/BeautyCita-v2.2.0-optimized.apk',
    'application/vnd.android.package-archive'
  );

  console.log('\n✨ Upload complete!');
  console.log(`\n📱 Download URL: ${result.url}`);
  return result;
}

uploadAPK().catch(console.error);
