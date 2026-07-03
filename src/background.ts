import type { AnchorComp, Color, GameObj, PosComp, RotateComp, ScaleComp, SpriteComp } from "kaplay"
import type { Vector } from "./game"

type Star = {
    pos: Vector,
    scale: number,
    velocity: Vector
}
let stars: Star[] = []

function createStar() {
    const star: Star = {
        pos: rand(vec2(width(), height())),
        scale: rand(0.3, 2),
        velocity: Vec2.fromAngle(rand(360)).scale(rand(0.01, 0.5))
    }
    stars.push(star)
}

function isOffscreen(point: Vector): boolean {
    return point.x > width()
        || point.x < 0
        || point.y > height()
        || point.y < 0
}

function fillScreenWithStars() {
    stars = []
    for (let i = 0; i < 50; i++) {
        createStar()
    }
}

export const BG_COLOR = '#05050c'
export function setupBackground() {
    setBackground(BG_COLOR as any)
    fillScreenWithStars()

    
    onUpdate(() => {
        let starsToReAdd = 0
        stars = stars.filter((star) => {
            star.pos = star.pos.add(star.velocity)

            const offscreen = isOffscreen(star.pos)
            if (offscreen) starsToReAdd++
            
            return !offscreen
        })

        for (let i = 0; i < starsToReAdd; i++) {
            createStar()
        }

        for (const trail of trails) {
            trail.update()
        }
    })

    onSceneLeave(() => { fillScreenWithStars(); trails = [] })

    onDraw(() => {
        for (const { pos, scale } of stars) {
            drawSprite({
                sprite: 'star',
                pos,
                scale,
            })
        }

        for (const trail of trails) {
            trail.draw()
        }
    })
}

let trails: Trail[] = []
type ObjectToFollow = GameObj<PosComp | SpriteComp | RotateComp | ScaleComp | AnchorComp>
export class Trail {
    object: ObjectToFollow
    // in milliseconds
    delay: number
    lastShadowTime = Date.now()
    items: { pos: Vector, angle: number, timeCreated: number }[] = []
    // in milliseconds
    lifespan: number
    // in secondsx
    trailLifespan: number
    dead: boolean = false

    constructor(obj: ObjectToFollow, delay: number, lifespan: number, trailLifespan: number) {
        this.object = obj
        this.delay = delay
        this.lifespan = lifespan
        this.trailLifespan = trailLifespan
        trails.push(this)
    }

    get lastItem() {
        return this.items.length > 0 ? null : this.items[this.items.length - 1]
    }

    update() {
        if (this.dead && this.items.length == 0) {
            trails.splice(trails.indexOf(this), 1)
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