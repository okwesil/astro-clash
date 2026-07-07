import type { GameObj, HealthComp, PosComp, SpriteComp, ColorComp, AreaComp, RotateComp, ScaleComp, OffScreenComp, ZComp, AnchorComp, OpacityComp } from "kaplay"
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

// base type could be a CurrentPlayerObject or OtherPlayerObject
export type BasicPlayerObject = GameObj<PosComp | SpriteComp | ColorComp | ScaleComp | ZComp | AreaComp | RotateComp | AnchorComp | OpacityComp | {
    otherPlayersPos: Vector;
}>

export type CurrentPlayerObject = GameObj<HealthComp | PosComp | SpriteComp | ColorComp | AreaComp | RotateComp | ScaleComp | OffScreenComp | ZComp | AnchorComp | OpacityComp | {
    vel: Vector;
    knockbackVel: Vector;
    stun: (duration: number) => void;
    knockback: (direction: Vector, strength: number) => void;
    otherPlayersPos: Vector;
}>

export function setupPlayer(rounds: number): CurrentPlayerObject {
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
