export interface FileDataUrl {
  dataUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export function readFileAsDataUrl(file: File): Promise<FileDataUrl> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        dataUrl: String(reader.result),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  mime = 'image/webp',
): Promise<File> {
  return fetch(dataUrl)
    .then((response) => response.blob())
    .then((blob) => new File([blob], fileName, { type: mime }));
}

export function formatBytes(size: number | undefined): string {
  if (!size) {
    return '';
  }
  if (size >= 1048576) {
    return `${(size / 1048576).toFixed(1)} Mo`;
  }
  return `${Math.max(1, Math.round(size / 1024))} Ko`;
}

const PREVIEW_MAX_WIDTH = 1600;
const PREVIEW_MAX_HEIGHT = 900;

export interface WebpResult {
  dataUrl: string;
  fileName: string;
}

export function fileToWebp(file: File, maxWidth = 800, maxHeight = 800): Promise<WebpResult> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      const scale = Math.min(1, maxWidth / width, maxHeight / height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas non supporté.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/webp', 0.82);
      const fileName = file.name.replace(/\.[^.]+$/, '') + '.webp';
      resolve({ dataUrl, fileName });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de lire l’image.'));
    };
    img.src = url;
  });
}

export const bannerWebp = {
  fileToWebp,
  preview: (file: File): Promise<WebpResult> =>
    fileToWebp(file, PREVIEW_MAX_WIDTH, PREVIEW_MAX_HEIGHT),
};