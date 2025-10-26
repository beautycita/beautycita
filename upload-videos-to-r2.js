const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://e61486f47c2fe5a12fdce43b7a318343.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: 'ca3c10c25e5a6389797d8b47368626d4',
    secretAccessKey: '9a761a36330e00d98e1faa6c588c47a76fb8f15b573c6dcf197efe10d80bba4d',
  },
});

const BUCKET_NAME = 'beautycita-medias';
const PUBLIC_URL = 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev';

async function listR2Files() {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: 'videos/',
  });
  const response = await s3Client.send(command);
  return (response.Contents || []).map(item => item.Key);
}

async function uploadFile(localPath, r2Key) {
  const fileContent = fs.readFileSync(localPath);
  const contentType = localPath.endsWith('.mp4') ? 'video/mp4' :
                      localPath.endsWith('.mp3') ? 'audio/mpeg' :
                      localPath.endsWith('.jpeg') || localPath.endsWith('.jpg') ? 'image/jpeg' :
                      'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: r2Key,
    Body: fileContent,
    ContentType: contentType,
  });

  await s3Client.send(command);
  console.log(`✅ Uploaded: ${r2Key} (${(fileContent.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  console.log('Checking existing videos in R2...');
  const existingFiles = await listR2Files();
  console.log(`Found ${existingFiles.length} existing files in R2`);

  // Get all local video files
  const videoDir = '/var/www/beautycita.com/frontend/dist/media/vid';
  const audioDir = '/var/www/beautycita.com/frontend/dist/media/audio';

  const videoFiles = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
  const audioFiles = fs.existsSync(audioDir) ? fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3')) : [];

  console.log(`\nLocal files found:`);
  console.log(`- Videos: ${videoFiles.length}`);
  console.log(`- Audio: ${audioFiles.length}`);

  let uploaded = 0;
  let skipped = 0;

  // Upload videos
  for (const file of videoFiles) {
    const r2Key = `videos/${file}`;
    if (existingFiles.includes(r2Key)) {
      console.log(`⏭️  Skipped: ${r2Key} (already exists)`);
      skipped++;
    } else {
      await uploadFile(path.join(videoDir, file), r2Key);
      uploaded++;
    }
  }

  // Upload audio
  for (const file of audioFiles) {
    const r2Key = `audio/${file}`;
    if (existingFiles.includes(r2Key)) {
      console.log(`⏭️  Skipped: ${r2Key} (already exists)`);
      skipped++;
    } else {
      await uploadFile(path.join(audioDir, file), r2Key);
      uploaded++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Uploaded: ${uploaded}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`\n🌐 Files accessible at: ${PUBLIC_URL}/videos/[filename]`);
}

main().catch(console.error);
