import type { GameObj, HealthComp, PosComp, SpriteComp, ColorComp, AreaComp, RotateComp, ScaleComp, OffScreenComp, ZComp, AnchorComp, OpacityComp } from "kaplay"
import setupBlaze from "./blaze/blaze"
import setupCress from "./cress/cress"
import { type Vector } from "./game"
import { getSelectedShip } from "./select"
import { emitParticles, type DamageOverTime } from "./effects"

export function movePlayer(player: CurrentPlayerObject, direction: Vector, speed: number) {
    player.vel = player.vel.add(direction.unit().scale(speed))

    // normalize so diagonals arent faster than straight
    player.vel = player.vel.unit().scale(player.vel.len())
}

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

            return dot.ticksLeft > 0
        })
    })

    const MAX_PARTICLE_FORCE = 20
    player.onHurt(damage => {
        // anything above 60 launches particles the farthest
        // 5 is the lowest possible
        const force = 5 + (damage ?? 10) / (60 as number) * MAX_PARTICLE_FORCE
        const red = rgb(rand(180, 255), 0, 0)
        emitParticles(() => add([
            pos(player.pos),
            circle(10),
            color(red),
            timer(),
            opacity(),
            { vel: vec2() }
        ]), 15, force, 360, .5)
    })

    player.onCollide('blaze', (blaze) => {
        if (blaze.dashing) {
            player.hurt(5)
            // send to the left or right of the blaze
            player.knockback(Vec2.fromAngle(blaze.angle + (randi() ? 180 : 0)), 800)
        }
    })

    onSceneLeave(() => {
        player.dots = []
    })

    return player
}
