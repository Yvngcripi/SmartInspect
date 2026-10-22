/**
 * Utility to compress and resize images on the client side using HTML5 Canvas.
 * This ensures that local storage does not fill up and generated PDFs remain small.
 */

/**
 * Compresses an image file by resizing it to a maximum dimension and encoding as JPEG.
 * 
 * @param file The original image File object from input.
 * @param maxDimension The maximum width or height in pixels (defaults to 1024px).
 * @param quality The JPEG compression quality from 0.0 to 1.0 (defaults to 0.75).
 * @returns A promise that resolves to a Base64 data URL string.
 */
export function compressImage(
  file: File,
  maxDimension: number = 1024,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if the file is indeed an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions keeping the aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D de Canvas.'));
          return;
        }

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = (err) => {
        reject(err);
      };
    };

    reader.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Helper to calculate estimated size of a Base64 data URL in KB.
 */
export function getBase64SizeKB(base64String: string): number {
  // A Base64 string is about 4/3 larger than the actual binary size.
  const stringLength = base64String.substring(base64String.indexOf(',') + 1).length;
  const sizeInBytes = Math.round(stringLength * 0.75);
  return Number((sizeInBytes / 1024).toFixed(1));
}
export default compressImage;
