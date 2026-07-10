import type { GameObj, PosComp, SpriteComp, ColorComp, ScaleComp, ZComp, AreaComp, RotateComp, AnchorComp, OpacityComp } from "kaplay";
import setupOtherBlaze from "./blaze/otherBlaze";
import setupOtherCress from "./cress/otherCress";
import type { Vector } from "./game";
import { ZLevels, type Ship } from "./main";
import { setDataListener } from "./network";
import { drawStunCircle } from "./player";
import { emitParticles } from "./effects";


export const HEALTHBAR_HEIGHT = 10
export type OtherPlayerObject = GameObj<PosComp | SpriteComp | ColorComp | ScaleComp | ZComp | AreaComp | RotateComp | AnchorComp | OpacityComp | {
    targetPos: Vector;
    otherPlayersPos: Vector;
    blinking: boolean;
    blinkingFrequency: number;
    stunFrames: number
}>

export function setupOtherPlayer(ship: Ship, rounds: number): OtherPlayerObject {
    let player: OtherPlayerObject;
    switch (ship) {
        case 'blaze':
            player = setupOtherBlaze(rounds)
            break
        case 'cress':
            player = setupOtherCress(rounds)
            break
        default:
            // unreachable
            player = setupOtherCress(rounds)
    }
    // red bar
    add([
        pos(),
        rect(player.width, HEALTHBAR_HEIGHT, { radius: 3 }),
        color(RED),
        z(ZLevels.indexOf('healthbar')),
        follow(player, vec2(-(player.width / 2), 30))
    ])

    // green bar
    const healthbar = add([
        pos(),
        rect(player.width, HEALTHBAR_HEIGHT, { radius: 3 }),
        color(GREEN),
        z(ZLevels.indexOf('healthbar')),
        follow(player, vec2(-(player.width / 2), 30)),
        timer()
    ])

    setDataListener('healthChange', ({ maxHP, currentValue }) => {
        healthbar.tween(healthbar.width, (currentValue / maxHP) * player.width, .2, (value) => (healthbar.width = value))

        if (currentValue < maxHP * 0.65) {
            player.blinking = true
        }
        if (currentValue < maxHP * 0.25) {
            player.blinkingFrequency = 1
        }

        const redOrange = rgb(rand(180, 255), 0, 0)
        emitParticles(() => add([
            pos(player.pos),
            circle(10),
            color(redOrange),
            timer(),
            opacity(),
            { vel: vec2() }
        ]), 15, 5, .5)
    })

    setDataListener('movement', (data) => {
        player.targetPos.x = data.x
        player.targetPos.y = data.y
    })

    player.onDraw(() => {
        if (player.stunFrames > 0) {
            drawStunCircle(vec2(), player.width, player.stunFrames)
        }
    })

    setDataListener('stunFrames', ({ frames }) => {
        player.stunFrames = frames
    })
    return player
}
