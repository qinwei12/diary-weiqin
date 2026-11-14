"use client";

import { paletteFromPixels, themeFromPalette } from "./colors";
import type { PostImage } from "./types";

export type UploadedImage = {
  url: string;
  width: number;
  height: number;
  accent: string;
  palette: string[];
};

export type ComposerImage = PostImage & { localId: string };

const MAX_EDGE = 2200;
const SAMPLE_EDGE = 120;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type Decoded = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

type Prepared = {
  file: File;
  width: number;
  height: number;
  palette: string[];
  accent: string;
};

async function decodeImage(file: File): Promise<Decoded> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  } catch {
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      };
    } catch {
      URL.revokeObjectURL(objectUrl);
      throw new Error("浏览器没能打开这张图片，换一张试试");
    }
  }
}

function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxEdge: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("浏览器暂时不能处理图片");
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function prepareImage(file: File): Promise<Prepared> {
  if (!ACCEPTED.has(file.type)) {
    throw new Error("支持 JPG、PNG、WebP 和 AVIF 格式");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("单张图片不能超过 15MB");
  }

  const decoded = await decodeImage(file);
  try {
    if (decoded.width * decoded.height > 50_000_000) {
      throw new Error("图片像素太大了，换一张小一点的吧");
    }

    const output = drawToCanvas(
      decoded.source,
      decoded.width,
      decoded.height,
      MAX_EDGE,
    );
    const sample = drawToCanvas(
      decoded.source,
      decoded.width,
      decoded.height,
      SAMPLE_EDGE,
    );
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("浏览器暂时不能读取图片颜色");
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    const theme = themeFromPalette(
      paletteFromPixels(pixels, { channels: 4, step: 1, count: 7 }),
    );

    const blob = await canvasToBlob(output, "image/webp", 0.86);
    const baseName = file.name.replace(/\.[^.]+$/, "").trim() || "diary-photo";
    const outputFile = blob
      ? new File([blob], `${baseName}.webp`, { type: "image/webp" })
      : file;

    if (outputFile.size > MAX_FILE_BYTES) {
      throw new Error("图片压缩后还是太大了，换一张小一点的吧");
    }

    return {
      file: outputFile,
      width: blob ? output.width : decoded.width,
      height: blob ? output.height : decoded.height,
      palette: theme.palette,
      accent: theme.accent,
    };
  } finally {
    decoded.cleanup();
  }
}

export async function uploadImages(
  files: File[],
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<UploadedImage[]> {
  if (signal?.aborted) {
    throw new DOMException("Upload aborted", "AbortError");
  }

  const prepared: Prepared[] = [];
  for (const [index, file] of files.entries()) {
    prepared.push(await prepareImage(file));
    onProgress?.(Math.round(((index + 1) / files.length) * 8));
  }

  const form = new FormData();
  prepared.forEach((item) => form.append("files", item.file, item.file.name));
  form.append(
    "metadata",
    JSON.stringify(
      prepared.map((item) => ({
        width: item.width,
        height: item.height,
        palette: item.palette,
      })),
    ),
  );

  return new Promise<UploadedImage[]>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/upload");
    request.timeout = 120_000;

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(8 + Math.round((event.loaded / event.total) * 84));
      }
    });

    request.addEventListener("load", () => {
      try {
        const payload = JSON.parse(request.responseText) as {
          images?: UploadedImage[];
          error?: string;
        };
        if (request.status >= 200 && request.status < 300 && payload.images) {
          onProgress?.(100);
          resolve(payload.images);
          return;
        }
        reject(new Error(payload.error ?? "图片上传失败了"));
      } catch {
        reject(new Error("服务器返回了无法识别的内容"));
      }
    });

    request.addEventListener("error", () =>
      reject(new Error("网络连接中断了，再试一次吧")),
    );
    request.addEventListener("timeout", () =>
      reject(new Error("图片上传超时了，换一张小一点的试试")),
    );
    request.addEventListener("abort", () =>
      reject(new DOMException("Upload aborted", "AbortError")),
    );
    signal?.addEventListener("abort", () => request.abort());
    request.send(form);
  });
}

export function toComposerImage(image: UploadedImage): ComposerImage {
  return {
    ...image,
    alt: "",
    localId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}
