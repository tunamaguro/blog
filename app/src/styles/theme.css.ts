import { createThemeContract, createTheme } from "@vanilla-extract/css"

export const colors = createThemeContract({
    color: {
        primary: null,
        primaryContent: null
    },
    surface: {
        // 中立色。明るいテーマの際は更に明るく、暗いテーマの際は更に暗い色
        neutral: null,
        neutralContent: null,

        // 背景色
        base100: null,
        // `base100`より少し暗い
        base200: null,
        // `base200`より少し暗い
        base300: null,
        baseContent: null
    }
})

export const darkTheme = createTheme(colors, {
    color: {
        primary: "oklch(76.29% 0.0477 194.49)",
        primaryContent: "oklch(97.807% .029 256.847)"
    },
    surface: {
        neutral: "oklch(28.04% 0.0198 264.18)",
        neutralContent: "oklch(97.807% .029 256.847)",
        base100: "oklch(41.57% 0.0324 264.13)",
        base200: "oklch(37.92% 0.029 266.47)",
        base300: "oklch(32.44% 0.0229 264.18)",
        baseContent: "oklch(95.13% 0.0074 260.73)"
    }
})
