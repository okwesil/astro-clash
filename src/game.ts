import { setupOtherPlayer } from "./otherPlayer"
import { setupPlayer } from "./player"
import { setupBackground } from "./background"
import { createLaserCollisionParticles, projFunctions } from "./projectiles"
import { setDataListener, isHost, send, closeConnection } from "./network"
import { ZLevels } from "./main"

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
const score = {
    host: 0,
    other: 0,
}

// TODO: Add a timer here and make it so that the user has a grace period and if the connect back on time, then their client will ask the other for score and stuff
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        closeConnection()
    }
})

async function game(reset: boolean) {
    if (reset) {
        rounds = 1
        score.host = 0
        score.other = 0
    }
    setupBackground()
    const player = setupPlayer(rounds)
    const otherPlayer = setupOtherPlayer(rounds)

    const playerScore = isHost ? score.host : score.other
    const otherPlayerScore = isHost ? score.other : score.host
    //scoreboard
    add([
        text(`[red]${playerScore}[/red]:[blue]${otherPlayerScore}[/blue]`, { 
            font: 'pixel',
            styles: {
                red: {
                    color: RED
                },
                blue: {
                    color: BLUE
                }
            }
        }),
        pos(vec2(width() / 2, 20)),
        anchor('top')
    ])

    if (playerScore != otherPlayerScore) {
        const currentPlayerIsWinning = playerScore > otherPlayerScore
        const crown = add([
            sprite('crown' + (!currentPlayerIsWinning ? ' blue' : '')),
            pos(),
            follow(currentPlayerIsWinning ? player : otherPlayer, vec2(0, -(player.height / 2))),
            anchor('bot'),
            scale(3),
        ])
        wait(3, () => crown.destroy())
    }

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
        boom(player.pos)
        player.destroy()
        send('death', { hostWon: !isHost, roundDied: rounds })
        if (isHost) score.other++
        else score.host++
        showWin(!isHost)
    })
    setDataListener('death', ({ hostWon, roundDied }) => {
        if (!paused) {
            if (isHost) score.host++
            else score.other++
            boom(otherPlayer.pos)
            otherPlayer.destroy()
            rounds = roundDied
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
            debug.log(`are you 'host': ${isHost ? 'yes' : 'no'}`)
            debug.log(`round ${rounds}`)
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

    

    
    async function showWin(hostWon: boolean) {
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

        paused = true
        rounds++
        const winText = hostWon == isHost ? 'You Won!' : loseText[randi(loseText.length)]
        const textObject = add([
            text(winText, { size: 100, font: 'pixel' }),
            pos(center()),
            anchor('center'),
            z(ZLevels.indexOf('win text'))
        ])
        wait(1, async () => {
            textObject.destroy()
            go('game', false)
        })
        
    }
}
