const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
require('dotenv').config({ path: '/var/www/beautycita.com/.env' });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadTest() {
  try {
    // Try uploading banner0.mp4 with minimal config
    const fileBuffer = fs.readFileSync('/tmp/banner0.mp4');
    console.log('File size:', (fileBuffer.length / (1024 * 1024)).toFixed(2), 'MB');
    console.log('Bucket:', process.env.R2_BUCKET_NAME);
    console.log('Key: beautycita/videos/press-optimized.mp4');
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: 'beautycita/videos/press-optimized.mp4',
      Body: fileBuffer,
      ContentType: 'video/mp4',
    });

    console.log('Uploading...');
    const result = await r2Client.send(command);
    console.log('✅ Success!', result);
    console.log('URL: https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/videos/press-optimized.mp4');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error name:', error.name);
    console.error('Status code:', error.$metadata?.httpStatusCode);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

uploadTest();
