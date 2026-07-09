import type { AnchorComp, AreaComp, GameObj, OffScreenComp, PosComp, RotateComp, ScaleComp, SpriteComp } from "kaplay"
import { angleBetween, type Vector } from "./game"
import { send } from "./network"
import type { BasicPlayerObject, setupPlayer } from "./player"
import { DamageOverTime } from "./effects"

type ProjectileType = 'cress laser' | 'fire blast'

export interface ProjectileData {
    type: ProjectileType
    damage: number
    sprite: string
    pos: Vector
    direction: number
    speed: number
    sound: string
    projId: string
}

type updateFunction = (self: ProjectileObject, move: boolean, timeCreated: number) => void
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
            player.stun(15)
        }
    },
    'fire blast': {
        update: (self, move, timeCreated) => {
            self.scale = self.scale.add(0.3)
            if (Date.now() - timeCreated > 250) {
                self.destroy()
                send('deleteProjectiles', { projIds: [self.projId] })
            }
        },
        onHit: (player, self) => {
            player.hurt(self.damage)
            player.knockback(Vec2.fromAngle(angleBetween(self.pos, self.playerWhoShot.otherPlayersPos) - 90 + rand(-100, 100)), 1000)
            player.stun(5)

            // add fire DOT
            player.dots.push(new DamageOverTime(5, 500, 3))
        }
    }
}

export type ProjectileObject = GameObj<SpriteComp | PosComp | AreaComp | RotateComp | AnchorComp | OffScreenComp | ScaleComp | {
    projId: string;
    type: ProjectileType
    speed: number;
    direction: number;
    damage: number;
    targetPos: Vector;
    playerWhoShot: BasicPlayerObject
}>

export function shoot(data: ProjectileData, createdByCurrPlayer: boolean, newAmmo: number, playerWhoShot: BasicPlayerObject): ProjectileObject {
    const proj = add([
        sprite(data.sprite + (!createdByCurrPlayer ? ' blue' : '')),
        pos(data.pos.x, data.pos.y),
        area({ scale: data.type == 'fire blast' ? 0.9 : 1.2 }),
        rotate(data.direction),
        anchor('center'),
        offscreen({ destroy: true, distance: 400 }),
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
            targetPos: data.pos,
            playerWhoShot
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

    const timeCreated = Date.now()
    proj.onUpdate(() => {
        projFunctions[proj.type].update(proj, !createdByCurrPlayer, timeCreated)
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
