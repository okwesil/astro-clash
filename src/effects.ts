import type { GameObj, PosComp, SpriteComp, RotateComp, ScaleComp, AnchorComp, KEventController, Circle, CircleComp } from "kaplay"
import type { Vector } from "./game"

export class DamageOverTime {
    ticksLeft: number
    // milliseconds
    interval: number
    damage: number
    lastTickTime: number

    constructor(amountOfTicks: number, interval: number, damage: number) {
        this.ticksLeft = amountOfTicks
        this.interval = interval
        this.damage = damage
        this.lastTickTime = Date.now() + interval
    }

}


// for now only cirlces
type ParticleFunction = () => GameObj<CircleComp | {
    vel: Vector
}>
export function emitPartilces(generate: ParticleFunction, amount: number, range: number) {
    for (let i = 0; i < amount; i++) {
        generate()
    }
}


type ObjectToFollow = GameObj<PosComp | SpriteComp | RotateComp | ScaleComp | AnchorComp>
export class Trail {
    object: ObjectToFollow
    // in milliseconds
    delay: number
    lastShadowTime = Date.now()
    items: { pos: Vector, angle: number, timeCreated: number }[] = []
    // in milliseconds
    lifespan: number
    // in seconds
    trailLifespan: number
    dead: boolean = false
    eventController: KEventController

    constructor(obj: ObjectToFollow, delay: number, lifespan: number, trailLifespan: number) {
        this.object = obj
        this.delay = delay
        this.lifespan = lifespan
        this.trailLifespan = trailLifespan
        this.eventController = onUpdate(this.update)
    }


    get lastItem() {
        return this.items.length > 0 ? null : this.items[this.items.length - 1]
    }

    update() {
        if (this.dead && this.items.length == 0) {
            this.eventController.cancel()
            return
        }

        this.trailLifespan -= dt()
        if (this.trailLifespan < 0) {
            this.dead = true
            return
        }

        const now = Date.now()
        if (!this.dead && (now - this.lastShadowTime) > this.delay) {
            this.items.push({ pos: this.object.pos, timeCreated: now, angle: this.object.angle })
            this.lastShadowTime = now
        }
    }

    draw() {
        const now = Date.now()
        this.items = this.items.filter(item => {
            const opacity = 1 - (now - item.timeCreated) / this.lifespan
            drawSprite({
                pos: item.pos,
                angle: item.angle,
                sprite: this.object.sprite,
                anchor: this.object.anchor,
                scale: this.object.scale,
                opacity,
            })

            return (now - item.timeCreated) < this.lifespan
        })
    }

    kill() {
        this.dead = true
    }
}
