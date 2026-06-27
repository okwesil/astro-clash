import { setupOtherPlayer } from "./otherPlayer"
import { setupPlayer } from "./player"
import { setupBackground } from "./background"
import { createLaserCollisionParticles, projFunctions } from "./projectiles"
import { setDataListener, isHost, send } from "./network"

export let paused = false
export function setupGame() {
    scene('game', game)
}

export type Vector = ReturnType<typeof vec2>
export function angleBetween(p1: Vector, p2: Vector): number {
    const [ dx, dy ] = [ p2.x - p1.x, p2.y - p1.y ]
    return Math.atan2(dy, dx) / (2 * Math.PI) * 360 + 90
}

function boom(position: Vector) {
    add([
        sprite('boom', {
            anim: 'expand'
        }),
        scale(3),
        pos(position),
        anchor('center'),
    ])
}

async function game() {
    setupBackground()
    const player = setupPlayer()
    const otherPlayer = setupOtherPlayer()

    player.onCollide('enemy projectile', (proj) => {
        // @ts-ignore
        projFunctions[proj.type].onHit(player, proj)
        createLaserCollisionParticles(proj.pos)
        proj.destroy()
    })

    player.onCollide('enemy railgun', () => {
        wait(0.1, () =>  player.hurt(100))
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
        boom(player.pos)
        player.destroy()
        send('death', { hostWon: !isHost })
    })
    setDataListener('death', ({ hostWon }) => {
        if (!paused) {
            boom(otherPlayer.pos)
            otherPlayer.destroy()
            showWin(hostWon)
        }
    })

    onUpdate(() => {
        player.otherPlayersPos = otherPlayer.pos
        otherPlayer.otherPlayersPos = player.pos
    })

    let sentPing = false
    let timePingWasSent = 0
    onKeyPress('2', () => {
        send('ping', null)
        sentPing = true
        timePingWasSent = performance.now()
    })
    setDataListener('ping', () => {
        if (!sentPing) { 
            send('ping', null) 
        } else {
            debug.log(`${performance.now() - timePingWasSent}ms`)
            sentPing = false
        }
    })

    await showCountdown(3)


    async function showCountdown(start: number) {
        paused = true
        const countdown = add([
            pos(center()),
            anchor('center'),
            text(start.toString(), { size: 100, font: 'pixel' }),
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

    const loseText = [
        'You lose.',
        ':(',
        'You suck.',
        'Lock in bro.',
        'embarrasing.',
        'just hop off',
        '*sigh*',
        ':(',
        ':[',
        '>:(',
        ':/',
        'x_x'
    ]

    
    async function showWin(hostWon: boolean) {
        paused = true
        const winText = hostWon == isHost ? 'You Won!' : loseText[randi(loseText.length)]
        const textObject = add([
            text(winText, { size: 100, font: 'pixel' }),
            pos(center()),
            anchor('center'),
        ])
        wait(1, async () => {
            textObject.destroy()
            go('game')
        })
        
    }
}
