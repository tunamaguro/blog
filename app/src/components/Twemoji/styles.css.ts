import { style, keyframes } from "@vanilla-extract/css"

export const rotate = keyframes({
    "0%": { transform: "rotateZ(0deg)" },
    "100%": { transform: "rotateZ(360deg)" }
})

export const container = style({
    animationName: rotate,
    animationDuration: "3s",
    animationTimingFunction:"linear",
    animationIterationCount: "infinite"
})