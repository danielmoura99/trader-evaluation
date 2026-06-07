// app/api/assets/[image]/route.ts
import { readFileSync } from "fs";
import { join } from "path";
import { isSafeAssetFileName } from "@/lib/security";

export async function GET(
  request: Request,
  { params }: { params: { image: string } }
) {
  if (!isSafeAssetFileName(params.image)) {
    return new Response("Invalid asset path", { status: 400 });
  }

  const imagePath = join(process.cwd(), "assets", params.image);

  try {
    const imageBuffer = readFileSync(imagePath);

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
