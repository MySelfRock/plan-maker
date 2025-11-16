import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: AWS.S3;
  private readonly bucketAssets: string;
  private readonly bucketExports: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const useMinio = this.configService.get<string>('USE_MINIO') === 'true';

    this.bucketAssets = this.configService.get<string>('S3_BUCKET_ASSETS') || 'planmaker-assets';
    this.bucketExports = this.configService.get<string>('S3_BUCKET_EXPORTS') || 'planmaker-exports';

    this.s3 = new AWS.S3({
      endpoint: useMinio ? endpoint : undefined,
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      region,
      s3ForcePathStyle: useMinio, // needed for MinIO
      signatureVersion: 'v4',
    });

    this.logger.log(`Storage service initialized (MinIO: ${useMinio})`);
  }

  /**
   * Upload file to S3/MinIO
   */
  async uploadFile(
    file: Buffer | string,
    key: string,
    bucket: 'assets' | 'exports' = 'assets',
    contentType?: string,
  ): Promise<string> {
    const bucketName = bucket === 'assets' ? this.bucketAssets : this.bucketExports;

    try {
      await this.s3
        .putObject({
          Bucket: bucketName,
          Key: key,
          Body: file,
          ContentType: contentType,
          ACL: 'public-read',
        })
        .promise();

      const url = this.getFileUrl(key, bucket);
      this.logger.log(`File uploaded: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${key}`, error);
      throw new InternalServerErrorException(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(key: string, bucket: 'assets' | 'exports' = 'assets'): string {
    const bucketName = bucket === 'assets' ? this.bucketAssets : this.bucketExports;
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const useMinio = this.configService.get<string>('USE_MINIO') === 'true';

    if (useMinio) {
      return `${endpoint}/${bucketName}/${key}`;
    }

    return this.s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: key,
      Expires: 3600, // 1 hour
    });
  }

  /**
   * Delete file from S3/MinIO
   */
  async deleteFile(key: string, bucket: 'assets' | 'exports' = 'assets'): Promise<void> {
    const bucketName = bucket === 'assets' ? this.bucketAssets : this.bucketExports;

    try {
      await this.s3
        .deleteObject({
          Bucket: bucketName,
          Key: key,
        })
        .promise();

      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw new InternalServerErrorException(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate pre-signed upload URL
   */
  async getUploadUrl(key: string, contentType: string, bucket: 'assets' | 'exports' = 'assets'): Promise<string> {
    const bucketName = bucket === 'assets' ? this.bucketAssets : this.bucketExports;

    return this.s3.getSignedUrlPromise('putObject', {
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      Expires: 300, // 5 minutes
    });
  }
}
