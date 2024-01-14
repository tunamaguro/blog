const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    fontFamily: {
      sans: [
        "Hiragino Kaku Gothic ProN",
        "Hiragino Sans",
        "Meiryo",
        "Arial",
        "sans-serif",
      ],
    },
    extend: {},
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
    // https://zenn.dev/chot/articles/grid-template-auto-fill-with-tailwind
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          "grid-cols-auto-fill": (value) => ({
            gridTemplateColumns: `repeat(auto-fill, minmax(${value}, 1fr))`,
          }),
        },
        { values: theme("spacing") }
      );
    }),
  ],
  daisyui: {
    themes: ["dark"],
  },
};
