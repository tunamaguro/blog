// @ts-nocheck allow specific var name
import { colors } from "../..//styles/theme.css";
import { style } from "@vanilla-extract/css";

export const uiOverride = style({
  "--pagefind-ui-scale": "1",
  "--pagefind-ui-primary": colors.color.primary,
  "--pagefind-ui-text": colors.surface.baseContent,
  "--pagefind-ui-background": colors.surface.base300,
  "--pagefind-ui-border": colors.surface.base200,
  "--pagefind-ui-tag": colors.surface.base200,
  "--pagefind-ui-border-width": "2px",
  "--pagefind-ui-border-radius": "8px",
  "--pagefind-ui-image-border-radius": "8px",
  "--pagefind-ui-image-box-ratio": "3 / 2",
  "--pagefind-ui-font":
    "Hiragino Kaku Gothic ProN, Hiragino Sans, Meiryo, Arial, sans-serif",
});
