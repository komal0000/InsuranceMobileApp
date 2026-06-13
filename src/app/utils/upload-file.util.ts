export interface UploadFilenameOptions {
  timestamp?: Date;
  targetGroupType?: string | null;
}

export interface PrepareUploadFileOptions extends UploadFilenameOptions {
  maxDimension?: number;
  quality?: number;
}

const FIELD_PARTS: Record<string, [string, string | null]> = {
  photo: ['photo', null],
  profile_image: ['profile', null],
  citizenship_front_image: ['citizen', 'front'],
  citizenship_back_image: ['citizen', 'back'],
  birth_certificate_front_image: ['birth', 'front'],
  birth_certificate_back_image: ['birth', 'back'],
  basai_sarai_front: ['basaisarai', 'front'],
  basai_sarai_back: ['basaisarai', 'back'],
  target_group_front_image: ['targetgroup', 'front'],
  target_group_back_image: ['targetgroup', 'back'],
  death_document: ['death', 'document'],
};

export function uploadFilenameForField(
  field: string,
  extension: string,
  options: UploadFilenameOptions = {},
): string {
  const [keyword, side] = partsForField(field, options.targetGroupType);
  const timestamp = formatTimestamp(options.timestamp || new Date());
  const cleanExtension = sanitizeExtension(extension);

  return `${side ? `${keyword}_${side}` : keyword}_${timestamp}.${cleanExtension}`;
}

export async function prepareUploadFile(
  file: File | Blob,
  field: string,
  options: PrepareUploadFileOptions = {},
): Promise<File> {
  const sourceType = file.type || '';
  const isImage = sourceType.startsWith('image/');
  const isPdf = sourceType === 'application/pdf' || uploadExtensionForFile(file) === 'pdf';
  let output: Blob = file;
  let extension = uploadExtensionForFile(file);

  if (isImage && !isPdf) {
    try {
      output = await compressImageToWebp(file, options.maxDimension || 1280, options.quality ?? 0.72);
      extension = 'webp';
    } catch {
      output = file;
    }
  }

  const name = uploadFilenameForField(field, extension, options);

  return new File([output], name, {
    type: output.type || sourceType || 'application/octet-stream',
    lastModified: Date.now(),
  });
}

export function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
    reader.readAsDataURL(blob);
  });
}

export function uploadExtensionForFile(file: File | Blob): string {
  const byType = extensionForType(file.type);
  if (byType) {
    return byType;
  }

  if (typeof File !== 'undefined' && file instanceof File && file.name.includes('.')) {
    return sanitizeExtension(file.name.split('.').pop() || '');
  }

  return 'bin';
}

function partsForField(field: string, targetGroupType?: string | null): [string, string | null] {
  const [fallbackKeyword, side] = FIELD_PARTS[field] || [sanitizePart(field), null];
  const keyword = field.startsWith('target_group_') && targetGroupType
    ? sanitizePart(targetGroupType)
    : fallbackKeyword;

  return [keyword, side];
}

function formatTimestamp(value: Date): string {
  const year = value.getFullYear();
  const month = pad(value.getMonth() + 1);
  const day = pad(value.getDate());
  const hour = pad(value.getHours());
  const minute = pad(value.getMinutes());
  const second = pad(value.getSeconds());

  return `${year}${month}${day}_${hour}${minute}${second}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function sanitizePart(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  return sanitized || 'upload';
}

function sanitizeExtension(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'bin';
}

function extensionForType(type: string): string | null {
  switch (type.toLowerCase()) {
    case 'application/pdf':
      return 'pdf';
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/bmp':
    case 'image/x-ms-bmp':
      return 'bmp';
    default:
      return null;
  }
}

async function compressImageToWebp(blob: Blob, maxDimension: number, quality: number): Promise<Blob> {
  const dataUrl = await readBlobAsDataUrl(blob);
  const image = await loadImage(dataUrl);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is unavailable.');
  }

  context.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((output) => {
      if (!output) {
        reject(new Error('WebP encoding failed.'));
        return;
      }

      resolve(output);
    }, 'image/webp', quality);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image.'));
    image.src = src;
  });
}
