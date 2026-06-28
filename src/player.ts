import setupCress from "./cress/player"
import { type Vector } from "./game"

export const MAX_STUN = 40

export function drawStunCircle(pos: Vector, width: number, stunFrames: number) {
  drawCircle({
    pos,
    radius: width,
    fill: false,
    outline:{ width: 8, color: WHITE, opacity: (stunFrames / MAX_STUN)},
    anchor: 'center',
  })
}

export function setupPlayer(rounds: number) {
  return setupCress(rounds)
}
