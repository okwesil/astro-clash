import type { Vec2 } from "kaplay"
import { setupOtherPlayer } from "./otherPlayer"
import { setupPlayer } from "./player"
import { setupBackground } from "./background"
import { createLaserCollisionParticles, projFunctions } from "./projectiles"

export function setupGame() {
    scene('game', game)
}

function angleBetween(vector1: Vec2, vector2: Vec2): number {
    const [ dx, dy ] = [ vector2.x - vector1.x, vector2.y - vector1.y ]
    return Math.atan2(dy, dx) / (2 * Math.PI) * 360 + 90
}

function game() {
    setBackground(BLACK)
    setupBackground()

    const player = setupPlayer()
    const otherPlayer = setupOtherPlayer()

    player.onCollide('enemy projectile', (proj) => {
        proj.destroy()
        player.hurt(proj.damage)
        // @ts-ignore
        projFunctions[proj.type].onHit(player, proj)
    })

    otherPlayer.onCollide('friendly projectile', (proj) => {
        proj.destroy()
    })

    onCollide('enemy projectile', 'friendly projectile', (a, b) => {
        createLaserCollisionParticles(a.pos)
        a.destroy()
        b.destroy()
    })


    onUpdate(() => {
        player.angle = angleBetween(player.pos, otherPlayer.pos)
        otherPlayer.angle = angleBetween(otherPlayer.pos, player.pos)

    })
}