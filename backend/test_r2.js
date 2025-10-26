const { S3Client, ListBucketsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '/var/www/beautycita.com/.env' });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function testConnection() {
  console.log('Testing R2 connection...');
  console.log('Account ID:', process.env.R2_ACCOUNT_ID);
  console.log('Access Key:', process.env.R2_ACCESS_KEY_ID);
  console.log('Bucket Name:', process.env.R2_BUCKET_NAME);
  console.log('Endpoint:', `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
  
  try {
    console.log('\n1. Listing buckets...');
    const listBucketsCommand = new ListBucketsCommand({});
    const buckets = await r2Client.send(listBucketsCommand);
    console.log('Available buckets:', buckets.Buckets.map(b => b.Name));
    
    console.log('\n2. Listing objects in bucket...');
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: 10
    });
    const objects = await r2Client.send(listObjectsCommand);
    console.log('Sample objects:', objects.Contents?.slice(0, 5).map(o => o.Key) || 'No objects found');
    
    console.log('\n✅ Connection successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.Code);
  }
}

testConnection();
