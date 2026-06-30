const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);

export const MAX_STORED_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_ORIGINAL_IMAGE_BYTES = 25 * 1024 * 1024;

export type ImageCompressionResult = {
  file: File;
  compressed: boolean;
  originalSize: number;
};

export type UploadPreparationResult =
  | (ImageCompressionResult & { ok: true })
  | { ok: false; error: string };

type CompressImageOptions = {
  maxDimension?: number;
  initialQuality?: number;
  minQuality?: number;
  targetBytes?: number;
};

const DEFAULT_OPTIONS = {
  maxDimension: 2000,
  initialQuality: 0.82,
  minQuality: 0.72,
  targetBytes: 1.2 * 1024 * 1024,
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function isCompressibleImage(file: File): boolean {
  return IMAGE_TYPES.has(file.type);
}

export async function prepareSupportingDocumentForUpload(
  file: File
): Promise<UploadPreparationResult> {
  if (!DOCUMENT_TYPES.has(file.type)) {
    return { ok: false, error: "Only JPG, PNG, WebP, or PDF files are allowed." };
  }

  if (file.type === "application/pdf") {
    if (file.size > MAX_STORED_UPLOAD_BYTES) {
      return { ok: false, error: "PDF files must be under 10 MB." };
    }
    return { ok: true, file, compressed: false, originalSize: file.size };
  }

  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    return { ok: false, error: "Image files must be under 25 MB before compression." };
  }

  const result = await compressImageForUpload(file);
  if (result.file.size > MAX_STORED_UPLOAD_BYTES) {
    return {
      ok: false,
      error: "Compressed image is still over 10 MB. Please choose a smaller image.",
    };
  }

  return { ok: true, ...result };
}

function getCompressedFileName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "") + ".jpg";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the selected image."));
    };
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not compress the selected image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {}
): Promise<ImageCompressionResult> {
  if (!isCompressibleImage(file)) {
    return { file, compressed: false, originalSize: file.size };
  }

  const settings = { ...DEFAULT_OPTIONS, ...options };
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    settings.maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return { file, compressed: false, originalSize: file.size };
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = settings.initialQuality;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > settings.targetBytes && quality > settings.minQuality) {
    quality = Math.max(settings.minQuality, quality - 0.05);
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size >= file.size * 0.95) {
    return { file, compressed: false, originalSize: file.size };
  }

  const compressedFile = new File([blob], getCompressedFileName(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  return { file: compressedFile, compressed: true, originalSize: file.size };
}
