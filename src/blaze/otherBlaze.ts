import { angleBetween } from "../game"
import { ZLevels } from "../main"
import { setDataListener, isHost } from "../network"
import { AMMO_REFRESH_TIME, MAX_AMMO } from "./blaze"
import { shoot } from "../projectiles"
import { Trail } from "../effects"


export default function setupOtherBlaze(rounds: number) {
    let startPos = !isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
    let angle = isHost ? 180 : 0
    if (rounds % 2 == 0) {
        startPos.y = height() - startPos.y
        angle += 180
    }
    const player = add([
        pos(startPos),
        sprite('blaze blue'),
        color(),
        scale(1.2),
        z(ZLevels.indexOf('other player')),
        area({ scale: 1.2 }),
        rotate(angle),
        anchor("center"),
        opacity(1),
        'blaze',
        'player',
        'other player',
        {
            targetPos: startPos,
            otherPlayersPos: vec2(),
            blinking: false,
            blinkingFrequency: 8,
            stunFrames: 0,
            dashing: false
        }
    ])

    let autoaim = true
    player.onUpdate(() => {
        if (player.blinking) {
            player.opacity = Math.min(2 * (Math.sin(debug.numFrames() / player.blinkingFrequency) + 1), 1)
        }

        if (autoaim) {
            player.angle = angleBetween(player.pos, player.otherPlayersPos)
        }

        player.pos = lerp(player.pos, player.targetPos, 0.8)
    })

    const ammoBar = add([
        rect(10, player.height),
        pos(), follow(player, vec2(-40, (player.height / 2))),
        anchor('botleft'),
        color(BLUE),
        timer()
    ])
    setDataListener('projectileShot', (data) => {
        if (data.newAmmo > 0) {
            ammoBar.height = data.newAmmo / MAX_AMMO * player.height
        } else {
            ammoBar.tween(0, player.height, AMMO_REFRESH_TIME, (value) => (ammoBar.height = value))
        }

        shoot(data.data, false, -1, player)
    })

    setDataListener('ammo', ({ ammo }) => {
        ammoBar.height = ammo / MAX_AMMO * player.height
    })

    setDataListener('startedDashing', () => {
        player.dashing = true
        new Trail(player, 50, 500, 500)
        player.area.scale = vec2(3)
    })

    setDataListener('stoppedDashing', () => {
        player.dashing = false
        player.area.scale = vec2(1)
    })

    return player
}
