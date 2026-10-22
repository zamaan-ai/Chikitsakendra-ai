// lib/storage-util.js
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { BlobServiceClient } = require('@azure/storage-blob');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

let s3Client, gcsClient, azureClient;

if (STORAGE_TYPE === 's3') {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    endpoint: process.env.AWS_ENDPOINT || undefined,
  });
}

if (STORAGE_TYPE === 'gcs') {
  gcsClient = new Storage({
    keyFilename: process.env.GCS_KEY_FILE,
    projectId: process.env.GCS_PROJECT_ID,
  });
}

if (STORAGE_TYPE === 'azure') {
  azureClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
}

async function uploadToStorage(filePath, options = {}) {
  const { bucket, key, contentType } = options;
  
  if (STORAGE_TYPE === 'local') {
    const localPath = path.join(process.env.UPLOAD_DIR || './uploads', key || path.basename(filePath));
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(filePath, localPath);
    return `local://${localPath}`;
  }

  if (STORAGE_TYPE === 's3') {
    const fileContent = fs.readFileSync(filePath);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileContent,
      ContentType: contentType || 'application/octet-stream',
    });
    await s3Client.send(command);
    return `s3://${bucket}/${key}`;
  }

  if (STORAGE_TYPE === 'gcs') {
    const bucketObj = gcsClient.bucket(bucket);
    const file = bucketObj.file(key);
    await file.save(fs.readFileSync(filePath), {
      contentType: contentType || 'application/octet-stream',
    });
    return `gs://${bucket}/${key}`;
  }

  if (STORAGE_TYPE === 'azure') {
    const containerClient = azureClient.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.uploadFile(filePath);
    return `azure://${bucket}/${key}`;
  }

  throw new Error(`Unsupported storage type: ${STORAGE_TYPE}`);
}

async function getFileStream(storageUrl) {
  const parsed = parseStorageUrl(storageUrl);
  
  if (STORAGE_TYPE === 'local' || storageUrl.startsWith('local://')) {
    const localPath = storageUrl.replace('local://', '');
    return fs.createReadStream(localPath);
  }

  if (STORAGE_TYPE === 's3' || storageUrl.startsWith('s3://')) {
    const { bucket, key } = parsed;
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);
    return response.Body;
  }

  if (STORAGE_TYPE === 'gcs' || storageUrl.startsWith('gs://')) {
    const { bucket, key } = parsed;
    const file = gcsClient.bucket(bucket).file(key);
    return file.createReadStream();
  }

  if (STORAGE_TYPE === 'azure' || storageUrl.startsWith('azure://')) {
    const { bucket, key } = parsed;
    const containerClient = azureClient.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    const response = await blockBlobClient.download();
    return response.readableStreamBody;
  }

  throw new Error(`Unsupported storage URL: ${storageUrl}`);
}

async function deleteFromStorage(storageUrl) {
  const parsed = parseStorageUrl(storageUrl);
  
  if (STORAGE_TYPE === 'local' || storageUrl.startsWith('local://')) {
    const localPath = storageUrl.replace('local://', '');
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return;
  }

  if (STORAGE_TYPE === 's3' || storageUrl.startsWith('s3://')) {
    const { bucket, key } = parsed;
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await s3Client.send(command);
    return;
  }

  if (STORAGE_TYPE === 'gcs' || storageUrl.startsWith('gs://')) {
    const { bucket, key } = parsed;
    await gcsClient.bucket(bucket).file(key).delete();
    return;
  }

  if (STORAGE_TYPE === 'azure' || storageUrl.startsWith('azure://')) {
    const { bucket, key } = parsed;
    const containerClient = azureClient.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.delete();
    return;
  }

  throw new Error(`Unsupported storage URL: ${storageUrl}`);
}

async function generateSignedUrl(storageUrl, expiresInSeconds = 3600) {
  const parsed = parseStorageUrl(storageUrl);
  
  if (STORAGE_TYPE === 'local' || storageUrl.startsWith('local://')) {
    return storageUrl.replace('local://', '');
  }

  if (STORAGE_TYPE === 's3' || storageUrl.startsWith('s3://')) {
    const { bucket, key } = parsed;
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  if (STORAGE_TYPE === 'gcs' || storageUrl.startsWith('gs://')) {
    const { bucket, key } = parsed;
    const file = gcsClient.bucket(bucket).file(key);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInSeconds * 1000,
    });
    return signedUrl;
  }

  if (STORAGE_TYPE === 'azure' || storageUrl.startsWith('azure://')) {
    const { bucket, key } = parsed;
    const containerClient = azureClient.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    return await blockBlobClient.generateSasUrl({
      expiresOn: new Date(Date.now() + expiresInSeconds * 1000),
      permissions: 'r',
    });
  }

  throw new Error(`Unsupported storage URL: ${storageUrl}`);
}

function parseStorageUrl(storageUrl) {
  const urlPattern = /^(?:local|s3|gs|azure):\/\/([^\/]+)\/(.+)$/;
  const match = storageUrl.match(urlPattern);
  if (!match) {
    throw new Error(`Invalid storage URL format: ${storageUrl}`);
  }
  return { bucket: match[1], key: match[2] };
}

function getStorageType() {
  return STORAGE_TYPE;
}

module.exports = {
  uploadToStorage,
  getFileStream,
  deleteFromStorage,
  generateSignedUrl,
  getStorageType,
};