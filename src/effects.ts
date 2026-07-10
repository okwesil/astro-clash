import type { GameObj, PosComp, SpriteComp, RotateComp, ScaleComp, AnchorComp, KEventController, Circle, CircleComp, OpacityComp, TimerComp } from "kaplay"
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

// function that creates a particle which is just a game object with a position component
type Particle = GameObj<PosComp | OpacityComp | TimerComp | {
    vel: Vector,
}>

// lifespan is in seconds
export function emitParticles(create: () => Particle, amount: number, force: number, range: number, lifespan: number) {
    for (let i = 0; i < amount; i++) {
        const particle = create()
        particle.vel = Vec2.fromAngle(rand(range)).scale(force)
        particle.tween(1, 0, 0.3, (value) => (particle.opacity = value))
        particle.onUpdate(() => { particle.pos = particle.pos.add(particle.vel) })
        particle.wait(lifespan, () => {
            particle.destroy()
        })
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
    // in milliseconds
    trailLifespan: number
    dead: boolean = false
    eventController: KEventController

    constructor(obj: ObjectToFollow, delay: number, lifespan: number, trailLifespan: number) {
        this.object = obj
        this.delay = delay
        this.lifespan = lifespan
        this.trailLifespan = trailLifespan / 1000
        this.eventController = onUpdate(() => this.update())

        onDraw(() => {
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

                return opacity > 0
            })
        })
    }


    get lastItem() {
        return this.items.length > 0 ? null : this.items[this.items.length - 1]
    }

    update() {
        if (this.dead && this.items.length == 0) {
            console.log('dead')
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
    }
}
