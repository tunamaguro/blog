import { defineProperties, createSprinkles } from "@vanilla-extract/sprinkles";

import { colors } from "./theme.css";

const colorMap = {
  ...colors.color,
  ...colors.surface,
};

const colorProperties = defineProperties({
  properties: {
    color: colorMap,
    backgroundColor: colorMap,
    borderColor: colorMap,
  },
});

export const sprinkles = createSprinkles(colorProperties);

export type Sprinkles = Parameters<typeof sprinkles>[0];
