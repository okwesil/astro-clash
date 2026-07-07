import setupBlaze from "./blaze/blaze"
import setupCress from "./cress/cress"
import { type Vector } from "./game"
import { getSelectedShip } from "./menu"

export const MAX_STUN = 40

export function drawStunCircle(pos: Vector, width: number, stunFrames: number) {
    drawCircle({
        pos,
        radius: width,
        fill: false,
        outline: { width: 8, color: WHITE, opacity: (stunFrames / MAX_STUN) },
        anchor: 'center',
    })
}

export function setupPlayer(rounds: number) {
    switch (getSelectedShip()) {
        case 'cress':
            return setupCress(rounds)
        case 'blaze':
            return setupBlaze(rounds)
        default:
            // unreachable
            return setupCress(rounds)
    }
}
