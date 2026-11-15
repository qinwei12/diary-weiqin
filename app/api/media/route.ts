import { createStorageDownloadUrl, isStorageObjectKey } from "@/lib/object-storage";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !isStorageObjectKey(key) || !key.startsWith("diary/")) {
    return Response.json({ error: "图片地址无效" }, { status: 400 });
  }

  try {
    const signedUrl = await createStorageDownloadUrl(key);
    return Response.redirect(signedUrl, 302);
  } catch (error) {
    console.error("Object storage media redirect failed:", error);
    return Response.json({ error: "图片暂时无法读取" }, { status: 404 });
  }
}
