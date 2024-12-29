// app/api/assets/[image]/route.ts
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(
  request: Request,
  { params }: { params: { image: string } }
) {
  const imagePath = join(process.cwd(), "assets", params.image);
  const imageBuffer = readFileSync(imagePath);

  return new Response(imageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
