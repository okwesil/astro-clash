import type { GameObj, Vec2, SpriteComp, AreaComp, PosComp, RotateComp } from "kaplay"
import { send } from "./network"

type ProjectileType = 'cress laser'

export type ProjectileData = { 
    type: ProjectileType
    sprite: string
    pos: Vec2
    direction: number
    speed: number
}

type updateFunction = (self: ProjectileObject) => void
const updateFunctions: Record<ProjectileType, updateFunction> = {
    'cress laser': (self) => {
        // @ts-ignore
        self.pos = self.pos.add(Vec2.fromAngle(self.direction).scale(self.speed)) 
    }
}

export type ProjectileObject = GameObj<
    SpriteComp | AreaComp | PosComp | RotateComp | {
    speed: number
    direction: number
    _onUpdate: (self: ProjectileObject) => void
}>

export function shoot(data: ProjectileData, sending: boolean) {
    const proj = add([
        sprite(data.sprite + (!sending ? ' blue' : '' )),
        pos(data.pos.x, data.pos.y),
        area(),
        rotate(data.direction),
        anchor('center'),
        offscreen({ destroy: true }),
        scale(1.5),
        (!sending ? 'blue projectile' : ''),
        {
            type: data.type,
            speed: data.speed,
            direction: data.direction - 90,
            _onUpdate: updateFunctions[data.type]
        }
    ])
    
    if (sending) {
        send('projectileShot', data)
    }

    proj.onUpdate(() => {
        proj._onUpdate(proj)
    })
}
