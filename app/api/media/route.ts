import { createB2DownloadUrl, isB2ObjectKey } from "@/lib/b2";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || !isB2ObjectKey(key) || !key.startsWith("diary/")) {
    return Response.json({ error: "图片地址无效" }, { status: 400 });
  }

  try {
    const signedUrl = await createB2DownloadUrl(key);
    return Response.redirect(signedUrl, 302);
  } catch (error) {
    console.error("B2 media redirect failed:", error);
    return Response.json({ error: "图片暂时无法读取" }, { status: 404 });
  }
}
