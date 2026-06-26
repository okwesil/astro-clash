import type { Vec2 } from "kaplay"
import { setupOtherPlayer } from "./otherPlayer"
import { setupPlayer } from "./player"
import { setupBackground } from "./background"
import { createLaserCollisionParticles, projFunctions } from "./projectiles"
import { setDataListener, isHost, send } from "./network"

export let paused = false
export function setupGame() {
    scene('game', game)
}

function angleBetween(vector1: Vec2, vector2: Vec2): number {
    const [ dx, dy ] = [ vector2.x - vector1.x, vector2.y - vector1.y ]
    return Math.atan2(dy, dx) / (2 * Math.PI) * 360 + 90
}

async function game() {
    setupBackground()
    const player = setupPlayer()
    const otherPlayer = setupOtherPlayer()
    console.log(player.hp())

    player.onCollide('enemy projectile', (proj) => {
        // @ts-ignore
        projFunctions[proj.type].onHit(player, proj)
        createLaserCollisionParticles(proj.pos)
        proj.destroy()
    })

    otherPlayer.onCollide('friendly projectile', (proj) => {
        proj.destroy()
        createLaserCollisionParticles(proj.pos)
    })

    onCollide('enemy projectile', 'friendly projectile', (a, b) => {
        createLaserCollisionParticles(a.pos)
        a.destroy()
        b.destroy()
    })

    player.onDeath(() => {
        showWin(!isHost)
        send('death', { hostWon: !isHost })
    })
    setDataListener('death', ({ hostWon }) => {
        if (!paused) {
            showWin(hostWon)
        }
    })

    onUpdate(() => {
        player.angle = angleBetween(player.pos, otherPlayer.pos)
        otherPlayer.angle = angleBetween(otherPlayer.pos, player.pos)

    })
    await showCountdown(3)


    async function showCountdown(start: number) {
        paused = true
        const countdown = add([
            pos(center()),
            anchor('center'),
            text(start.toString(), { size: 100 }),
            opacity(1),
            animate()
        ])
    
        for (let i = start - 1; i >= 0; i--) {
            await wait(0.4)
            countdown.animate('opacity', [0, 1], { duration: 0.4 })            
            countdown.text = i.toString()
        }
        countdown.text = 'GO!'
        wait(0.3, () => {
            countdown.destroy()
        })
        paused = false
    }
    
    async function showWin(hostWon: boolean) {
        paused = true
        const winText = hostWon == isHost ? 'You Won :)' : 'You Lost :('
        const textObject = add([
            text(winText),
            pos(center()),
            anchor('center'),
        ])
        query({include: 'projectile'}).forEach(proj => proj.destroy())
        wait(1, async () => {
            textObject.destroy()
            go('game')
        })
        
    }
}
