import type { TimerController } from "kaplay"
import { angleBetween, paused, type Vector } from "../game"
import { ZLevels } from "../main"
import { isHost, send, setDataListener } from "../network"
import { drawStunCircle, MAX_STUN } from "../player"
import { HEALTHBAR_HEIGHT } from "../otherPlayer"
import { shoot, type ProjectileData } from "../projectiles"
import { Trail } from "../effects"

export const MAX_AMMO = 2
export const AMMO_REFRESH_TIME = 1
export default function setupBlaze(rounds: number) {
    const SPEED = 80
    const FRICTION = 0.8
    const KNOCKBACK_FRICTION = 0.6
    let startPos = isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
    let angle = isHost ? 180 : 0
    if (rounds % 2 == 0) {
        startPos.y = height() - startPos.y
        angle += 180
    }

    const player = add([
        health(150, 150),
        pos(startPos),
        sprite('blaze'),
        color(),
        area(),
        rotate(angle),
        scale(1.2),
        offscreen(),
        z(ZLevels.indexOf('current player')),
        anchor("center"),
        opacity(1),
        'current player',
        'blaze',
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
            otherPlayersPos: vec2(),
            dots: []
        },
    ])

    let stunFrames = 0
    player.onHeal(() => {
        send('healthChange', { maxHP: player.maxHP() as number, currentValue: player.hp() })
        healthbar.tween(healthbar.width, (player.hp() / (player.maxHP() as number)) * player.width, .2, (value) => (healthbar.width = value))
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
        healthbar.tween(healthbar.width, (player.hp() / (player.maxHP() as number)) * player.width, .2, (value) => (healthbar.width = value))
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

        player.vel = player.vel.add(player.knockbackVel)
        player.move(player.vel)
        player.vel = player.vel.scale(FRICTION)
        player.knockbackVel = player.knockbackVel.scale(KNOCKBACK_FRICTION)

        player.angle = angleBetween(player.pos, player.otherPlayersPos)

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

        if (blinking) {
            player.opacity = Math.min(2 * (Math.sin(debug.numFrames() / blinkingFrequency) + 1), 1)
        }

        if (stunFrames > 0) {
            stunFrames--
            send('stunFrames', { frames: stunFrames })
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
    })


    const movePlayer = (direction: Vector) => {
        let speed = shooting ? SPEED * 0.3 : SPEED
        player.vel = player.vel.add(direction.unit().scale(speed))
    }

    onKeyDown(['w', 'up'], () => {
        if (stunFrames > 0 || paused) return
        movePlayer(vec2(0, -1))
    })

    onKeyDown(['s', 'down'], () => {
        if (stunFrames > 0 || paused) return
        movePlayer(vec2(0, 1))
    })

    onKeyDown(['a', 'left'], () => {
        if (stunFrames > 0 || paused) return
        movePlayer(vec2(-1, 0))
    })

    onKeyDown(['d', 'right'], () => {
        if (stunFrames > 0 || paused) return
        movePlayer(vec2(1, 0))
    })

    const DASH_SCALE = 5
    const DASH_REFRESH = 1000
    let lastDashTime = Date.now()
    onButtonPress('secondary', () => {
        if (paused || stunFrames > 0 || player.vel.len() < 1 || (Date.now() - lastDashTime) < DASH_REFRESH) return

        new Trail(player, 50, 500, 500)
        send('startedDashing', null)

        wait(0.5, () => {
            send('stoppedDashing', null)
        })

        wait(0.1, () => {
            const length = player.vel.len()
            player.vel = player.vel.unit().scale(length * DASH_SCALE)
        })

        lastDashTime = Date.now()
    })

    let ammo = MAX_AMMO
    let ammoRefreshTimer: TimerController | null = null
    const AMMO_BAR_HEIGHT = height() / 4

    let shooting = false
    onButtonPress('primary', () => {
        if (stunFrames > 0 || paused || ammo == 0) return
        ammo--
        ammoBar.height = ammo / MAX_AMMO * AMMO_BAR_HEIGHT

        const blast: ProjectileData = {
            type: 'fire blast',
            damage: 5,
            sprite: 'fire blast',
            pos: player.pos,
            direction: 0,
            speed: 0,
            sound: 'missile launch',
            hitboxScale: 0.7,
            projId: rand(10000).toString()
        }

        shoot(blast, true, ammo, player)

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
