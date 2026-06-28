// 画像をアップロード前にブラウザ側で圧縮・リサイズするユーティリティ
// 長辺1200px・JPEG品質80%に変換して容量を削減する

const MAX_LONG_SIDE = 1200;
const JPEG_QUALITY = 0.8;

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      const longSide = Math.max(width, height);

      let targetWidth = width;
      let targetHeight = height;

      if (longSide > MAX_LONG_SIDE) {
        const ratio = MAX_LONG_SIDE / longSide;
        targetWidth = Math.round(width * ratio);
        targetHeight = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("compression failed"));
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };

    img.src = url;
  });
}

// Supabase Storage の署名付きURLを取得する（サーバーサイド用）
// クライアントからは /api/liff/images/url?path=... 経由で取得すること
export function getStoragePath(contractorId: string, jobId: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const ext = filename.includes(".") ? ".jpg" : ".jpg";
  return `${contractorId}/${jobId}/${timestamp}_${random}${ext}`;
}
