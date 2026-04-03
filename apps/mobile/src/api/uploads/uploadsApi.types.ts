export interface UploadImagePayload {
  file: {
    uri: string;
    name: string;
    type: string;
  };
  folder: 'users' | 'students';
}

export interface UploadImageResponse {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}
