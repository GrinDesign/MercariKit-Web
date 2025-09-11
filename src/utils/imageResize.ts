/**
 * 画像リサイズユーティリティ
 * 12MBの画像を200KB程度にリサイズ
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 - 1.0
  outputFormat?: 'image/jpeg' | 'image/webp';
  targetSizeKB?: number; // 目標サイズ（KB）
}

export const DEFAULT_RESIZE_OPTIONS: ResizeOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  outputFormat: 'image/jpeg',
  targetSizeKB: 200
};

/**
 * 画像ファイルをリサイズ
 */
export async function resizeImage(
  file: File, 
  options: ResizeOptions = DEFAULT_RESIZE_OPTIONS
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not supported'));
      return;
    }

    img.onload = () => {
      // アスペクト比を保持しながらリサイズ
      const { width, height } = calculateDimensions(
        img.width,
        img.height,
        options.maxWidth || DEFAULT_RESIZE_OPTIONS.maxWidth!,
        options.maxHeight || DEFAULT_RESIZE_OPTIONS.maxHeight!
      );

      canvas.width = width;
      canvas.height = height;

      // 高品質な描画設定
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);

      // 目標サイズに合わせて品質を調整
      compressToTargetSize(
        canvas,
        options.outputFormat || DEFAULT_RESIZE_OPTIONS.outputFormat!,
        options.targetSizeKB || DEFAULT_RESIZE_OPTIONS.targetSizeKB!,
        options.quality || DEFAULT_RESIZE_OPTIONS.quality!
      ).then(blob => {
        // 新しいファイルオブジェクトを作成
        const resizedFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, '.jpg'), // 拡張子をjpgに変更
          {
            type: options.outputFormat || DEFAULT_RESIZE_OPTIONS.outputFormat!,
            lastModified: Date.now()
          }
        );

        console.log(`リサイズ完了: ${formatFileSize(file.size)} → ${formatFileSize(resizedFile.size)}`);
        resolve(resizedFile);
      }).catch(reject);
    };

    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };

    // ファイルを画像として読み込み
    img.src = URL.createObjectURL(file);
  });
}

/**
 * アスペクト比を保持しながら新しい寸法を計算
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // 幅が制限を超える場合
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // 高さが制限を超える場合
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * 目標サイズに合わせて品質を調整しながら圧縮
 */
async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  outputFormat: string,
  targetSizeKB: number,
  initialQuality: number
): Promise<Blob> {
  let quality = initialQuality;
  let blob: Blob | null = null;
  const targetSizeBytes = targetSizeKB * 1024;
  const minQuality = 0.1;
  const qualityStep = 0.1;

  // 品質を下げながら目標サイズを目指す
  while (quality >= minQuality) {
    blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, outputFormat, quality);
    });

    if (!blob) {
      throw new Error('画像の変換に失敗しました');
    }

    console.log(`品質: ${quality.toFixed(1)}, サイズ: ${formatFileSize(blob.size)}`);

    // 目標サイズ以下になったら終了
    if (blob.size <= targetSizeBytes) {
      break;
    }

    quality -= qualityStep;
  }

  if (!blob) {
    throw new Error('画像の圧縮に失敗しました');
  }

  return blob;
}

/**
 * ファイルサイズを読みやすい形式でフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * 画像ファイルかどうかを判定
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * サポートされている画像形式かどうかを判定
 */
export function isSupportedImageFormat(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ];
  return supportedTypes.includes(file.type.toLowerCase());
}