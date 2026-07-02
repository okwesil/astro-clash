import { setupOtherPlayer } from "./otherPlayer"
import { setupPlayer } from "./player"
import { setupBackground } from "./background"
import { createLaserCollisionParticles, projFunctions } from "./projectiles"
import { setDataListener, isHost, send, closeConnection } from "./network"
import { transition, ZLevels } from "./main"

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
            anim: 'expand',
            animSpeed: 2
        }),
        scale(3),
        pos(position),
        anchor('center'),
    ])
}



let rounds = 1
let score = {
    host: 0,
    other: 0,
}

let disconnectTimer: number | null = null
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        disconnectTimer = setTimeout(() => {
            send('reasonForDisconnect', { reason: 'Other player stayed idle too long' })
            closeConnection('You were idle for 2 long')
        }, 6000)
    } else if (disconnectTimer != null) {
        clearTimeout(disconnectTimer)
        send('getCurrentState', null)
    }
})

function drawScoreboard(currentPlayerScore: number, otherPlayerScore: number) {
    drawText({
        text: `[red]${currentPlayerScore}[/red]:[blue]${otherPlayerScore}[/blue]`,
        styles: {
            red: {
                color: RED
            },
            blue: {
                color: BLUE
            }
        },
        font: 'pixel',
        anchor: 'top',
        opacity: 0.5,
        pos: vec2(width() / 2, 20)
    })
}

async function game(reset: boolean) {
    if (reset) {
        rounds = 1
        score.host = 0
        score.other = 0
    }


    setDataListener('reasonForDisconnect', ({ reason }) => closeConnection( reason ))

    setupBackground()
    const player = setupPlayer(rounds)
    const otherPlayer = setupOtherPlayer(rounds)

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

    // TODO: fix bug where if both players death at the same time, both get credited a loss
    player.onDeath(() => {
        paused = true
        boom(player.pos)
        player.destroy()
        send('death', { hostWon: !isHost, roundDied: rounds })
        if (isHost) score.other++
        else score.host++
        showWin(!isHost)
    })

    setDataListener('death', ({ hostWon, roundDied }) => {
        if (!paused) {
            paused = true
            if (isHost) score.host++
            else score.other++
            boom(otherPlayer.pos)
            otherPlayer.destroy()
            rounds = roundDied
            showWin(hostWon)
        }
    })


    const arrow = add([
        sprite('arrow'),
        pos(),
        follow(player, vec2(player.width / 2 + 20, 0)),
        anchor('left'),
        opacity(1),
        scale(3),
        animate(),
    ])
    arrow.animate('opacity', [1, 0], { duration: .5 })

    wait(2, () => {
        arrow.destroy()
    })


    const playerScore = isHost ? score.host : score.other
    const otherPlayerScore = isHost ? score.other : score.host
    // crown 
    if (playerScore != otherPlayerScore) {
        const currentPlayerIsWinning = playerScore > otherPlayerScore
        const crown = add([
            sprite('crown' + (!currentPlayerIsWinning ? ' blue' : '')),
            pos(),
            follow(currentPlayerIsWinning ? player : otherPlayer, vec2(0, -(player.height / 2 + 10))),
            anchor('bot'),
            scale(2.5),
            opacity(1),
            timer()
        ])

        wait(2, () => {
            crown.tween(1, 0, 1, (value) => (crown.opacity = value))
        })
        wait(3, () => crown.destroy())
    }
    
    onUpdate(() => {
        player.otherPlayersPos = otherPlayer.pos
        otherPlayer.otherPlayersPos = player.pos

        // fps visualizer
        drawText({ text: 'FPS: ' + debug.fps().toString(), size: 20, pos: vec2(20, 20), font: 'pixel' })
        
        drawScoreboard(playerScore, otherPlayerScore)
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
            debug.log(`are you 'host': ${isHost ? 'yes' : 'no'}`)
            debug.log(`round ${rounds}`)
            debug.log(`host: ${score.host} other: ${score.other}`)
            sentPing = false
        }
    })

    await showCountdown(3)

    async function showCountdown(start: number) {
        paused = true
        const countdown = add([
            text(start.toString(), { size: 100, font: 'pixel' }),
            pos(center()),
            anchor('center'),
            opacity(1),
            animate()
        ])
    
        for (let i = start - 1; i >= 0; i--) {
            await wait(0.4)
            countdown.animate('opacity', [0, 1], { duration: 0.4 })            
            countdown.text = i.toString()
        }

        countdown.text = 'CLASH!'
        wait(0.3, () => {
            countdown.destroy()
        })
        paused = false
    }
    
    async function showWin(hostWon: boolean) {
        paused = true
        const loseText = [
            'you lose.',
            'u lose.',
            'lock in bro.',
            'embarrasing.',
            'sigh',
            ':(',
            ':|',
            ':(',
            ':[',
            '>:(',
            'x_x'
        ]

        rounds++
        const winText = hostWon == isHost ? 'You Win!' : loseText[randi(loseText.length)]
        const textObject = add([
            text(winText, { size: 100, font: 'pixel' }),
            pos(center()),
            anchor('center'),
            z(ZLevels.indexOf('win text'))
        ])
        wait(1, async () => {
            textObject.destroy()
            transition('game', false)
        })
        
    }
}
