import { getSession } from "@/lib/auth";
import { themeFromPalette } from "@/lib/colors";
import {
  MAX_IMAGE_PIXELS,
  MAX_UPLOAD_BYTES,
  normalizeDimensions,
  normalizePalette,
  sniffImageFormat,
} from "@/lib/image-utils";
import { deleteFromUpyun, uploadToUpyun } from "@/lib/upyun";

type UploadedImage = {
  url: string;
  width: number;
  height: number;
  accent: string;
  palette: string[];
};

type ClientMetadata = {
  width?: unknown;
  height?: unknown;
  palette?: unknown;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "登录后才能上传图片" }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 80 * 1024 * 1024) {
    return Response.json({ error: "这次上传的图片太多了" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "无法读取上传内容" }, { status: 400 });
  }

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return Response.json({ error: "没有选择图片" }, { status: 400 });
  }
  if (files.length > 9) {
    return Response.json({ error: "一篇日记最多放 9 张图片" }, { status: 400 });
  }

  let metadata: ClientMetadata[];
  try {
    const parsed = JSON.parse(String(formData.get("metadata") ?? "null"));
    if (!Array.isArray(parsed) || parsed.length !== files.length) {
      throw new Error("metadata length mismatch");
    }
    metadata = parsed as ClientMetadata[];
  } catch {
    return Response.json({ error: "图片信息不完整，请重新选择" }, { status: 400 });
  }

  const written: string[] = [];
  const images: UploadedImage[] = [];

  try {
    for (const [index, file] of files.entries()) {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new UploadError("单张图片不能超过 15MB", 413);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const format = sniffImageFormat(buffer);
      if (!format) {
        throw new UploadError("支持 JPG、PNG、WebP 和 AVIF 格式", 415);
      }

      const meta = metadata[index] ?? {};
      const dimensions = normalizeDimensions(meta.width, meta.height);
      if (
        !dimensions ||
        dimensions.width * dimensions.height > MAX_IMAGE_PIXELS
      ) {
        throw new UploadError("图片尺寸不合法", 415);
      }
      const palette = normalizePalette(meta.palette);
      if (!palette) {
        throw new UploadError("没能读取图片的颜色，请重新选择", 415);
      }
      const theme = themeFromPalette(palette);

      const url = await uploadToUpyun(buffer, format);
      written.push(url);

      images.push({
        url,
        width: dimensions.width,
        height: dimensions.height,
        accent: theme.accent,
        palette: theme.palette,
      });
    }
  } catch (error) {
    await Promise.all(
      written.map((url) => deleteFromUpyun(url).catch((error) => {
        console.error("Upload rollback failed:", error instanceof Error ? error.message : "Unknown error");
      })),
    );
    if (error instanceof UploadError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("upload failed:", error);
    return Response.json(
      { error: "图片保存失败了，换一张试试" },
      { status: 500 },
    );
  }

  return Response.json({ images });
}

class UploadError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
