import { Ogp } from "./Ogp";
import satori from "satori";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export async function generateOgp(title: string) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const font = await fs.readFile(
    path.resolve(__dirname, "./NotoSansJP-Regular.ttf")
  );
  const svg = await satori(Ogp({ title }), {
    // Ogpの推奨サイズが1200x630らしい。要調査
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "NotoSansJP",
        data: font,
        style: "normal",
      },
    ],
  });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return png;
}
