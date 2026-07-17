/**
 * compressImage.ts
 *
 * Compresses an image File using the Canvas API before upload.
 *
 * Strategy:
 *   1. Skip non-image files (PDFs, docs, etc.) — returned unchanged.
 *   2. Resize so neither dimension exceeds MAX_DIMENSION (1920 px).
 *   3. Encode as JPEG at QUALITY_PASS1 (0.82).
 *   4. If the result still exceeds MAX_SIZE_BYTES (800 KB), re-encode
 *      at QUALITY_PASS2 (0.65) for a harder squeeze.
 *
 * PNG inputs are converted to JPEG unless they have transparency, in which
 * case they stay as PNG (converted via quality=1 to avoid artefacts).
 */

const MAX_DIMENSION = 1920;   // px — FHD ceiling
const QUALITY_PASS1 = 0.82;   // first-pass JPEG quality
const QUALITY_PASS2 = 0.65;   // fallback if still too big
const MAX_SIZE_BYTES = 800 * 1024; // 800 KB

function hasAlpha(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

function drawScaled(
  img: HTMLImageElement,
  maxDim: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  let { naturalWidth: w, naturalHeight: h } = img;

  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx };
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
  fileName: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas.toBlob returned null'));
        resolve(new File([blob], fileName, { type: blob.type }));
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Compresses an image File and returns a new compressed File.
 * Non-image files are returned as-is.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file; // skip non-images

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = async (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = async () => {
        try {
          const { canvas, ctx } = drawScaled(img, MAX_DIMENSION);

          // Decide MIME — keep PNG only when transparency is detected
          const isPng = file.type === 'image/png';
          const keepTransparency = isPng && hasAlpha(ctx, canvas.width, canvas.height);
          const mimeType = keepTransparency ? 'image/png' : 'image/jpeg';

          // Build output filename with correct extension
          const baseName = file.name.replace(/\.[^.]+$/, '');
          const ext = keepTransparency ? 'png' : 'jpg';
          const outName = `${baseName}.${ext}`;

          const quality = keepTransparency ? 1 : QUALITY_PASS1;
          let compressed = await canvasToFile(canvas, mimeType, quality, outName);

          // Second pass: if JPEG and still too big, apply harder compression
          if (!keepTransparency && compressed.size > MAX_SIZE_BYTES) {
            compressed = await canvasToFile(canvas, mimeType, QUALITY_PASS2, outName);
          }

          resolve(compressed);
        } catch (err) {
          reject(err);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an array of files concurrently.
 * Non-image files pass through unchanged.
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
