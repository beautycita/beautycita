const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// R2 Configuration
const R2_ACCOUNT_ID = 'e61486f47c2fe5a12fdce43b7a318343';
const R2_ACCESS_KEY_ID = 'ca3c10c25e5a6389797d8b47368626d4';
const R2_SECRET_ACCESS_KEY = '9a761a36330e00d98e1faa6c588c47a76fb8f15b573c6dcf197efe10d80bba4d';
const R2_BUCKET_NAME = 'beautycita-medias';
const R2_PUBLIC_URL = 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev';

// Configure R2 S3 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadAPK(apkPath, version) {
  try {
    console.log('Reading APK file...');
    const fileBuffer = fs.readFileSync(apkPath);
    const fileName = `BeautyCita-v${version}.apk`;
    const key = `beautycita/apps/android/${fileName}`;

    console.log(`Uploading ${fileName} to R2...`);
    console.log(`Size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/vnd.android.package-archive',
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
      ContentDisposition: `attachment; filename="${fileName}"`,
    });

    await r2Client.send(command);

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    console.log('\n✅ Upload successful!');
    console.log(`\nPublic URL: ${publicUrl}`);
    console.log(`\nKey: ${key}`);
    console.log(`\nUpdate backend/src/routes/appDownloads.js with this URL.`);

    return {
      success: true,
      url: publicUrl,
      key: key,
      size: (fileBuffer.length / (1024 * 1024)).toFixed(2) + ' MB'
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get version from command line or use default
const version = process.argv[2] || '2.5.1';

// Try multiple APK locations
const possiblePaths = [
  path.join(__dirname, `BeautyCita-v${version}.apk`),
  path.join(__dirname, 'frontend', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.join(__dirname, 'BeautyCita-release.apk'),
  path.join(__dirname, 'app-release.apk')
];

let apkPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    apkPath = testPath;
    console.log(`Found APK at: ${apkPath}`);
    break;
  }
}

if (!apkPath) {
  console.error(`❌ APK file not found. Tried:`);
  possiblePaths.forEach(p => console.error(`   - ${p}`));
  process.exit(1);
}

uploadAPK(apkPath, version);
