import { Ogp } from "./Ogp";
import satori from "satori";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function generateOgp(title: string, iconImage: string) {
  const font = await fs.readFile(
    path.resolve(process.cwd(), "src/utils/ogp", "./NotoSansJP-Regular.ttf")
  );
  const svg = await satori(Ogp({ title, iconImage }), {
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
