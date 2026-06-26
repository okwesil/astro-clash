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
}

type projFunction = (self: ProjectileObject) => void
type onHitFunction = (player: ReturnType<typeof setupPlayer>, self: ProjectileObject) => void
export const projFunctions: Record<ProjectileType, { update: projFunction, onHit: onHitFunction }> = {
    'cress laser': {
        update: (self) => {
            // @ts-ignore
            self.pos = self.pos.add(Vec2.fromAngle(self.direction).scale(self.speed)) 
        },
        onHit: (player, self) => {
            player.hurt(self.damage)
            player.knockback(Vec2.fromAngle(self.direction), 50)
            player.stun(10)
        }
    }
}

export type ProjectileObject = ReturnType<typeof shoot>

export function shoot(data: ProjectileData, sending: boolean) {
    const proj = add([
        sprite(data.sprite + (!sending ? ' blue' : '' )),
        pos(data.pos.x, data.pos.y),
        area(),
        rotate(data.direction),
        anchor('center'),
        offscreen({ destroy: true }),
        scale(1.5),
        (!sending ? 'enemy projectile' : 'friendly projectile'),
        'projectile',
        {
            type: data.type,
            speed: data.speed,
            direction: data.direction - 90,
            damage: data.damage,
        }
    ])

    
    if (sending) {
        send('projectileShot', data)
    }

    proj.onUpdate(() => {
        projFunctions[proj.type].update(proj)
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
