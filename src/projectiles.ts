import type { AnchorComp, AreaComp, GameObj, OffScreenComp, PosComp, RotateComp, ScaleComp, SpriteComp } from "kaplay"
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

export type ProjectileObject = GameObj<SpriteComp | PosComp | AreaComp | RotateComp | AnchorComp | OffScreenComp | ScaleComp | {
    projId: string;
    type: "cress laser";
    speed: number;
    direction: number;
    damage: number;
    targetPos: Vector;
}>

export function shoot(data: ProjectileData, createdByCurrPlayer: boolean, newAmmo: number): ProjectileObject {
    const proj = add([
        sprite(data.sprite + (!createdByCurrPlayer ? ' blue' : '' )),
        pos(data.pos.x, data.pos.y),
        area({ scale: 1.2 }),
        rotate(data.direction),
        anchor('center'),
        offscreen({ destroy: true }),
        scale(1.5),
        (!createdByCurrPlayer ? 'enemy projectile' : 'friendly projectile'),
        'projectile',
        `${data.projId}`,
        {
            projId: data.projId,
            type: data.type,
            speed: data.speed,
            direction: data.direction - 90,
            damage: data.damage,
            targetPos: data.pos
        }
    ])

    // add([
    //     text(data.projId),
    //     pos(), follow(proj, vec2(10, 0)),
    //     anchor('left')
    // ])

    play(data.sound, {
        volume: 0.1
    })
    
    if (createdByCurrPlayer) {
        send('projectileShot', { data, newAmmo })
    }

    proj.onUpdate(() => {
        projFunctions[proj.type].update(proj, !createdByCurrPlayer)
    })

    return proj
}
export function createLaserCollisionParticles(position: Vector) {
    const particles = add([
        sprite('laser collide', { anim: 'expand', animSpeed: 2 }),
        pos(position),
        scale(3),
        anchor('center'),
    ])
    particles.onAnimEnd(() => particles.destroy())
}
