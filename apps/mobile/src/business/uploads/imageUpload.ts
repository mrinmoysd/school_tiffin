import * as ImagePicker from 'expo-image-picker';
import { uploadsApi } from '../../api/uploads';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type UploadFolder = 'users' | 'students';
type PickAndUploadOptions = {
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
};

type PickedImage = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

const getFileExtensionFromUri = (uri: string): string | null => {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? null;
};

const mimeTypeFromExtension = (extension: string | null): string | null => {
  if (!extension) {
    return null;
  }

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return null;
  }
};

const buildFileName = (uri: string, fallbackPrefix: string) => {
  const uriSegments = uri.split('/');
  const possibleFileName = uriSegments[uriSegments.length - 1];

  if (possibleFileName && possibleFileName.includes('.')) {
    return possibleFileName;
  }

  const extension = getFileExtensionFromUri(uri) ?? 'jpg';
  return `${fallbackPrefix}-${Date.now()}.${extension}`;
};

const validatePickedImage = (file: PickedImage) => {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, or WEBP images are allowed.');
  }

  if (typeof file.size === 'number' && file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    throw new Error('Image size must be 5MB or less.');
  }
};

const pickImageFromLibrary = async (fallbackPrefix: string): Promise<PickedImage | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission is required to choose a profile photo.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    allowsEditing: true,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const inferredMimeType =
    asset.mimeType || mimeTypeFromExtension(getFileExtensionFromUri(asset.uri)) || 'image/jpeg';

  const file: PickedImage = {
    uri: asset.uri,
    name: asset.fileName || buildFileName(asset.uri, fallbackPrefix),
    type: inferredMimeType,
    size: asset.fileSize,
  };

  validatePickedImage(file);
  return file;
};

export const pickAndUploadImage = async (
  folder: UploadFolder,
  options?: PickAndUploadOptions,
): Promise<string | null> => {
  const selectedImage = await pickImageFromLibrary(folder === 'users' ? 'profile' : 'student');
  if (!selectedImage) {
    return null;
  }

  options?.onUploadStart?.();

  try {
    const upload = await uploadsApi.uploadImage({
      folder,
      file: {
        uri: selectedImage.uri,
        name: selectedImage.name,
        type: selectedImage.type,
      },
    });

    return upload.url || upload.key;
  } finally {
    options?.onUploadEnd?.();
  }
};
