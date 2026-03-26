import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { IStorageService, UploadParams, UploadResult, DeleteParams } from './storage.types';

/**
 * MinIO storage service — S3-compatible.
 * Falls back gracefully when STORAGE_ENDPOINT is not set (dev mode).
 */
export class MinioStorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicEndpoint: string;

  constructor() {
    const endpoint = process.env.STORAGE_ENDPOINT || 'http://localhost:9000';
    const region = process.env.STORAGE_REGION || 'us-east-1';
    this.bucket = process.env.STORAGE_BUCKET || 'immoshare-media';
    // Public URL base — in dev = same as endpoint, in prod could be a CDN
    this.publicEndpoint = process.env.STORAGE_PUBLIC_URL || endpoint;

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY || 'immoshare',
        secretAccessKey: process.env.STORAGE_SECRET_KEY || 'immoshare123',
      },
      forcePathStyle: true, // Required for MinIO (non-AWS S3)
    });
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ContentLength: params.contentLength,
      Metadata: params.metadata,
    });

    await this.client.send(command);

    return {
      key: params.key,
      url: this.getPublicUrl(params.key),
      sizeBytes: params.contentLength,
    };
  }

  async delete(params: DeleteParams): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
    });
    await this.client.send(command);
  }

  getPublicUrl(key: string): string {
    return `${this.publicEndpoint}/${this.bucket}/${key}`;
  }
}
