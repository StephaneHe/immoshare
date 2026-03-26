// Media module errors

export class MediaNotFoundError extends Error {
  readonly code = 'MEDIA_NOT_FOUND';
  readonly statusCode = 404;
  constructor() { super('Media item not found'); }
}

export class MediaNotOwnedError extends Error {
  readonly code = 'MEDIA_NOT_OWNED';
  readonly statusCode = 403;
  constructor() { super('You do not own this media item'); }
}

export class UnsupportedFileTypeError extends Error {
  readonly code = 'UNSUPPORTED_FILE_TYPE';
  readonly statusCode = 400;
  constructor(mimeType: string) {
    super(`File type "${mimeType}" is not supported`);
  }
}

export class FileTooLargeError extends Error {
  readonly code = 'FILE_TOO_LARGE';
  readonly statusCode = 400;
  constructor(maxMb: number) {
    super(`File exceeds the maximum allowed size of ${maxMb}MB`);
  }
}

export class MediaLimitReachedError extends Error {
  readonly code = 'MEDIA_LIMIT_REACHED';
  readonly statusCode = 400;
  constructor(type: string, max: number) {
    super(`Maximum of ${max} ${type} files per property reached`);
  }
}

export class StorageUploadError extends Error {
  readonly code = 'STORAGE_UPLOAD_ERROR';
  readonly statusCode = 502;
  constructor(cause?: string) {
    super(`Failed to upload file to storage${cause ? ': ' + cause : ''}`);
  }
}
