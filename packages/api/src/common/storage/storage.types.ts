// Storage service types — provider-agnostic interface

export interface UploadParams {
  key: string;           // e.g. "properties/prop-id/photo-uuid.jpg"
  body: Buffer;
  contentType: string;
  contentLength: number;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;           // Public URL
  sizeBytes: number;
}

export interface DeleteParams {
  key: string;
}

export interface IStorageService {
  upload(params: UploadParams): Promise<UploadResult>;
  delete(params: DeleteParams): Promise<void>;
  getPublicUrl(key: string): string;
}
