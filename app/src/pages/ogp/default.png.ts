import type { APIContext, APIRoute } from "astro";
import { generateOgp } from "@/server/ogp/generateOgp";

export const GET: APIRoute = async ({ }: APIContext) => {
  const png = await generateOgp("tunamaguroのブログ");
  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
};
