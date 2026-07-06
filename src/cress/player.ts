import type { AudioPlay, TimerController } from "kaplay"
import { angleBetween, paused, type Vector } from "../game"
import { ZLevels } from "../main"
import { isHost, send, setDataListener } from "../network"
import { drawStunCircle, MAX_STUN } from "../player"
import { shoot, type ProjectileData } from "../projectiles"


export const RAILGUN_CHARGE_TIME = 0.5
export function drawChargeCircle(pos: Vector, width: number, completion: number) {
    const color = completion == 1 ? RED : rgb(100, 0, 0)
    drawCircle({
        pos,
        radius: width,
        anchor: 'center',
        fill: false,
        outline: { width: 5, color, opacity: 1 },
        start: 360 - (completion * 360),
    })
}

export function drawRailgunAimingLine(p1: Vector, angle: number, completion: number) {
    const radians = (angle - 90) / 180 * Math.PI
    p1 = p1.add(Vec2.fromAngle(angle - 90).scale(50))
    const length = width() * 2
    const p2 = vec2(p1.x + (length * Math.cos(radians)), p1.y + (length * Math.sin(radians)))

    const color = completion == 1 ? RED : rgb(100, 0, 0)
    drawLine({
        p1, p2,
        width: 5,
        color
    })
}

export function fireRailgun(position: Vector, angle: number, red: boolean) {
    const railgun = add([
        sprite('railgun' + (red ? '' : ' blue'), { anim: 'fire' }),
        anchor('top'),
        pos(position),
        area({ scale: vec2(0.2, 1) }),
        rotate(angle),
        z(ZLevels.indexOf('railgun')),
        scale(vec2(1, 1.5)),
        (red ? 'friendly railgun' : 'enemy railgun')
    ])

    play('railgun firing', {
        volume: 0.2
    })

    // after a short interval deactivate hitbox
    wait(0.1, () => {
        railgun.collisionIgnore = ['*']
    })

    railgun.onAnimEnd((anim) => {
        if (anim == 'fire') {
            railgun.play('dissipate')
        } else {
            railgun.destroy()
        }
    })

    shake(50)
}

export const MAX_AMMO = 20
export const AMMO_REFRESH_TIME = 2
export default function setupCress(rounds: number) {
    const SPEED = 80
    const FRICTION = 0.8
    const KNOCKBACK_FRICTION = 0.6
    let startPos = isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
    let angle = isHost ? 180 : 0
    if (rounds % 2 == 0) {
        startPos.y = height() - startPos.y
        angle += 180
    }
    let elapsedCharge = 0

    const player = add([
        health(100, 100),
        pos(startPos),
        sprite('cress', {
            anim: 'idle'
        }),
        color(),
        area(),
        rotate(angle),
        scale(1.2),
        offscreen(),
        z(ZLevels.indexOf('current player')),
        anchor("center"),
        opacity(1),
        'current player',
        'cress',
        'player',
        {
            vel: vec2(),
            angularSpeed: 0,
            turningDirection: '',
            knockbackVel: vec2(),
            angleX: 0,
            stun: (duration: number) => {
                stunFrames = Math.min(duration, MAX_STUN)
            },
            knockback: (direction: Vector, strength: number) => {
                player.knockbackVel = player.knockbackVel.add(direction.scale(strength))
            },
            charged: () => elapsedCharge >= RAILGUN_CHARGE_TIME - 0.01,
            otherPlayersPos: vec2()
        },
    ])

    let stunFrames = 0
    player.onHeal(() => {
        send('healthChange', { maxHP: player.maxHP() as number, currentValue: player.hp() })
    })

    let blinking = false
    let blinkingFrequency = 8
    player.onHurt(() => {
        if (player.hp() < (player.maxHP() as number) * 0.65) {
            blinking = true
        }
        if (player.hp() < (player.maxHP() as number) * 0.25) {
            blinkingFrequency = 1
        }
        send('healthChange', { maxHP: player.maxHP() as number, currentValue: player.hp() })
    })

    let lastPos = player.pos

    function partiallyOffscreen(padding: number): 'top' | 'left' | 'right' | 'bottom' | null {
        const halfWidth = player.width / 2
        const halfHeight = player.height / 2

        const right = player.pos.x + halfWidth
        const left = player.pos.x - halfWidth
        const top = player.pos.y - halfHeight
        const bottom = player.pos.y + halfHeight

        if (right >= width() - padding) return 'right'
        if (left <= padding) return 'left'
        if (bottom >= height() - padding) return 'bottom'
        if (top <= padding) return 'top'

        return null
    }

    function keepPlayerOnScreen() {
        const halfWidth = player.width / 2
        const halfHeight = player.height / 2

        const right = player.pos.x + halfWidth
        const left = player.pos.x - halfWidth
        const top = player.pos.y - halfHeight
        const bottom = player.pos.y + halfHeight

        if (right > width()) player.pos.x = width() - halfWidth
        if (left < 0) player.pos.x = halfWidth
        if (bottom > height()) player.pos.y = height() - halfHeight
        if (top < 0) player.pos.y = halfWidth
    }


    player.onUpdate(() => {
        if (paused) { player.vel = vec2(); return }
        timeSinceLastShot += dt()
        if (timeSinceLastShot > 1 && ammoRefreshTimer == null && ammo < MAX_AMMO) {
            ammoBar.tween(ammoBar.height, AMMO_BAR_HEIGHT, 0.3, (value) => (ammoBar.height = value))
            wait(0.3, () => {
                ammo = MAX_AMMO
                send('ammo', { ammo })
            })
        }

        player.vel = player.vel.add(player.knockbackVel)
        player.move(player.vel)
        player.vel = player.vel.scale(FRICTION)
        player.knockbackVel = player.knockbackVel.scale(KNOCKBACK_FRICTION)

        const offscreenSide = partiallyOffscreen(1)
        if (player.knockbackVel.len() > 0 && offscreenSide != null) {
            if (offscreenSide == 'right' || offscreenSide == 'left') {
                player.knockbackVel.x *= -1
                player.vel.x *= -1
            }

            if (offscreenSide == 'top' || offscreenSide == 'bottom') {
                player.knockbackVel.y *= -1
                player.vel.y *= -1
            }
        }

        keepPlayerOnScreen()

        if (elapsedCharge == 0) {
            player.angle = angleBetween(player.pos, player.otherPlayersPos)
        }

        if (blinking) {
            player.opacity = Math.min(2 * (Math.sin(debug.numFrames() / blinkingFrequency) + 1), 1)
        }

        if (stunFrames > 0) {
            stunFrames--
            send('stunFrames', { frames: stunFrames })
            elapsedCharge = 0
        }

        if (Math.abs(player.vel.x) > 0.2) {
            if (player.getCurAnim()?.name != 'thruster') {
                player.play('thruster')
            }
        } else {
            if (player.getCurAnim()?.name != 'idle') {
                player.play('idle')
            }
        }


        player.angle += player.angularSpeed

        if (Math.floor(player.pos.x) == Math.floor(lastPos.x) && Math.floor(player.pos.y) == Math.floor(lastPos.y)) return
        send('movement', player.pos)
        lastPos = player.pos
    })

    player.onDraw(() => {
        if (stunFrames > 0) {
            drawStunCircle(vec2(), player.width + 3, stunFrames)
        }
        if (elapsedCharge > 0) {
            drawChargeCircle(vec2(), player.width + 3, elapsedCharge / RAILGUN_CHARGE_TIME)
            drawRailgunAimingLine(vec2(), 0, elapsedCharge / RAILGUN_CHARGE_TIME)
        }
    })


    const movePlayer = (direction: Vector) => {
        let speed = shooting ? SPEED * 0.3 : SPEED
        player.vel = player.vel.add(direction.scale(speed))
    }

    onKeyDown(['w', 'up'], () => {
        if (stunFrames > 0 || elapsedCharge != 0) return
        movePlayer(vec2(0, -1))
    })
    onKeyDown(['s', 'down'], () => {
        if (stunFrames > 0 || elapsedCharge != 0) return
        movePlayer(vec2(0, 1))
    })


    const turnPlayer = (direction: 1 | -1) => {
        player.angle += direction
    }

    onKeyDown(['a', 'left'], () => {
        if (stunFrames > 0) return

        if (elapsedCharge != 0) {
            turnPlayer(-1)
            send('aimingRailgun', { angle: player.angle })
            return
        }

        movePlayer(vec2(-1, 0))
    })

    onKeyDown(['d', 'right'], () => {
        if (stunFrames > 0) return

        if (elapsedCharge != 0) {
            turnPlayer(1)
            send('aimingRailgun', { angle: player.angle })
            return
        }

        movePlayer(vec2(1, 0))
    })

    onKeyRelease(['a', 'left', 'd', 'right'], () => {
        player.angularSpeed = 0
    })

    let alreadySentFullCompletion = false
    let railgunAudio: AudioPlay = play('railgun charging', {
        volume: 0
    })

    let firstFrameOfCharge = true
    let alreadyPlaying = false
    onKeyDown(['x', '/'], () => {
        if (paused) return
        elapsedCharge += dt()
        if (player.charged()) elapsedCharge = RAILGUN_CHARGE_TIME

        if (!player.charged()) {
            if (!alreadyPlaying && firstFrameOfCharge && railgunAudio) {
                railgunAudio.volume = 0.05
                railgunAudio.play()
                railgunAudio.onEnd(() => (alreadyPlaying = false))

                alreadyPlaying = true
                firstFrameOfCharge = false
            }
            send('railgunCharge', { completion: elapsedCharge / RAILGUN_CHARGE_TIME })
        }

        if (player.charged() && !alreadySentFullCompletion) {
            alreadySentFullCompletion = true
            send('railgunCharge', { completion: 1 })
        }
    })

    onKeyRelease(['x', '/'], () => {
        send('stoppedRailgunCharge', null)
        alreadySentFullCompletion = false
        railgunAudio.stop()
        alreadyPlaying = false
        firstFrameOfCharge = true

        if (player.charged()) {
            fireRailgun(player.pos, player.angle - 180, true)
            player.stun(10)
            send('fireRailgun', null)
        }
        elapsedCharge = 0
    })

    let ammo = MAX_AMMO
    let ammoRefreshTimer: TimerController | null = null
    const AMMO_BAR_HEIGHT = height() / 4

    const SHOT_COOLDOWN = 150
    let lastShotTime = 0
    let shootOnLeftSide = false
    const CENTER_OFFSET = 22
    let timeSinceLastShot = 0
    let shooting = false


    onKeyDown(['z', '.'], () => {
        if (!paused && stunFrames == 0 && !player.charged() && ammo > 0 && Date.now() - lastShotTime > SHOT_COOLDOWN) {
            shooting = true
            ammo--
            ammoBar.height = ammo / MAX_AMMO * AMMO_BAR_HEIGHT
            timeSinceLastShot = 0
            const data: ProjectileData = {
                type: 'cress laser',
                sprite: 'cress bullet',
                pos: vec2(player.pos.add(shootOnLeftSide ? vec2(-CENTER_OFFSET, 0) : vec2(CENTER_OFFSET, 0))),
                direction: player.angle,
                speed: 15,
                damage: 1,
                sound: 'laser sound',
                projId: randi(100000).toString()
            }

            shoot(data, true, ammo)
            shootOnLeftSide = !shootOnLeftSide
            lastShotTime = Date.now()
        }

        if (ammo == 0 && ammoRefreshTimer == null) {
            shooting = false
            ammoBar.tween(0, AMMO_BAR_HEIGHT, AMMO_REFRESH_TIME, (value) => (ammoBar.height = value))
            ammoBarOutline.animation.paused = false
            ammoRefreshTimer = wait(AMMO_REFRESH_TIME, () => {
                ammo = MAX_AMMO
                ammoRefreshTimer = null
                ammoBarOutline.animation.paused = true
                ammoBarOutline.opacity = 0.5
            })
        }
    })

    onKeyRelease(['z', '.'], () => {
        shooting = false
    })

    // ammo bar outline
    const ammoBarOutline = add([
        rect(40, AMMO_BAR_HEIGHT, { fill: false }),
        pos(width() - 10, height() - 10),
        anchor('botright'),
        outline(5, WHITE),
        opacity(0.5),
        animate(),
        timer(),
        area(),
        'ui'
    ])

    ammoBarOutline.animate('opacity', [0, 0.5], { duration: AMMO_REFRESH_TIME / 10, direction: 'ping-pong' })
    ammoBarOutline.animation.paused = true

    const ammoBar = add([
        rect(40, AMMO_BAR_HEIGHT),
        pos(width() - 10, height() - 10),
        anchor('botright'),
        color(BLUE),
        opacity(0.5),
        timer(),
        area(),
        'ui'
    ])


    setDataListener('projectilePositions', (data) => {
        for (let i = 0; i < data.pos.length; i++) {
            const proj = query({ include: data.projId[i] })[0]
            if (!proj) continue
            proj.targetPos.x = data.pos[i].x
            proj.targetPos.y = data.pos[i].y
        }
    })

    onUpdate('friendly projectile', (proj) => {
        proj.pos = lerp(proj.pos, proj.targetPos, 0.9)
    })
    return player
}
