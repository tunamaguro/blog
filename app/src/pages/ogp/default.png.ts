import type { APIContext, APIRoute } from "astro";
import { generateOgp } from "@/server/ogp/generateOgp";

export const get: APIRoute = async ({}: APIContext) => {
  const png = await generateOgp("tunamaguroのブログ");
  return new Response(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
};
