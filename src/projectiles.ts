import type { Vector } from "./game"
import { send } from "./network"
import type { setupPlayer } from "./player"

type ProjectileType = 'cress laser'

export type ProjectileData = { 
    type: ProjectileType
    damage: number
    sprite: string
    pos: Vector
    direction: number
    speed: number
    sound: string
    projId: string
}

type updateFunction = (self: ProjectileObject, move: boolean) => void
type onHitFunction = (player: ReturnType<typeof setupPlayer>, self: ProjectileObject) => void
export const projFunctions: Record<ProjectileType, { update: updateFunction, onHit: onHitFunction }> = {
    'cress laser': {
        update: (self, move) => {
            // @ts-ignore
            if (move) {
                self.pos = self.pos.add(Vec2.fromAngle(self.direction).scale(self.speed)) 
            }
        },
        onHit: (player, self) => {
            player.hurt(self.damage)
            player.knockback(Vec2.fromAngle(self.direction), 50)
            player.stun(10)
        }
    }
}

export type ProjectileObject = ReturnType<typeof shoot>

export function shoot(data: ProjectileData, sendToOtherPlayer: boolean) {
    const proj = add([
        sprite(data.sprite + (!sendToOtherPlayer ? ' blue' : '' )),
        pos(data.pos.x, data.pos.y),
        area(),
        rotate(data.direction),
        anchor('center'),
        offscreen({ destroy: true }),
        scale(1.5),
        (!sendToOtherPlayer ? 'enemy projectile' : 'friendly projectile'),
        'projectile',
        {
            projId: data.projId,
            type: data.type,
            speed: data.speed,
            direction: data.direction - 90,
            damage: data.damage,
        }
    ])

    play(data.sound, {
        volume: 0.1
    })
    
    if (sendToOtherPlayer) {
        send('projectileShot', data)
    }

    proj.onUpdate(() => {
        projFunctions[proj.type].update(proj, proj.is('enemy projectile'))
        send('projectilePos', { pos: proj.pos, projId: proj.projId })
    })
    return proj
}
export function createLaserCollisionParticles(position: Vector) {
    const particles = add([
        sprite('laser collide', { anim: 'expand', animSpeed: 2 }),
        pos(position),
        scale(3)
    ])
    particles.onAnimEnd(() => particles.destroy())
}
