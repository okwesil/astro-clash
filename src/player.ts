import type { GameObj, HealthComp, PosComp, SpriteComp, ColorComp, AreaComp, RotateComp, ScaleComp, OffScreenComp, ZComp, AnchorComp, OpacityComp } from "kaplay"
import setupBlaze from "./blaze/blaze"
import setupCress from "./cress/cress"
import { type Vector } from "./game"
import { getSelectedShip } from "./menu"
import { Trail, type DamageOverTime } from "./effects"

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
    dots: DamageOverTime[]
}>

export function setupPlayer(rounds: number): CurrentPlayerObject {
    let player: CurrentPlayerObject
    switch (getSelectedShip()) {
        case 'cress':
            player = setupCress(rounds)
            break
        case 'blaze':
            player = setupBlaze(rounds)
            break
        default:
            // unreachable
            player = setupCress(rounds)
    }

    player.onUpdate(() => {
        player.dots = player.dots.filter(dot => {
            if (Date.now() - dot.lastTickTime > dot.interval) {
                player.hurt(dot.damage)
                dot.lastTickTime = Date.now()
                dot.ticksLeft--
            }

            new Trail(player, 50, 500, 0.5)
            return dot.ticksLeft > 0
        })
    })

    return player
}
