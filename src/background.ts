import type { AnchorComp, GameObj, PosComp, RotateComp, ScaleComp, SpriteComp } from "kaplay"
import type { Vector } from "./game"
import { ZLevels } from "./main"


function choose<T>(...stuff: T[]): T {
    return stuff[randi(stuff.length)]
}

type sideOfScreen = 'left' | 'right' | 'top' | 'bottom'
function randomPosOnSideOfScreen(): [Vector, sideOfScreen] {
    const side = choose('left', 'right', 'top', 'bottom')
    let position;

    switch (side) {
        case 'left':
            position = vec2(0, rand(height()))
            break
        case "right":
            position = vec2(width(), rand(height()))
            break
        case "top":
            position = vec2(rand(width()), 0)
            break
        case "bottom":
            position = vec2(rand(width()), height())
            break
    }
    return [position, side]
}

function angleTowardsScreen(side: sideOfScreen) {
    let angle
    switch (side) {
        case "left":
            angle = 0
            break
        case "right":
            angle = 180
            break
        case "top":
            angle = 90
            break
        case "bottom":
            angle = 270
            break
    }
    return angle + rand(-10, 10)
}


type Star = {
    pos: Vector,
    scale: number,
    velocity: Vector
    shooting: boolean
}


let stars: Star[] = []

function createStar() {
    const star: Star = {
        pos: rand(vec2(width(), height())),
        scale: rand(0.3, 2),
        velocity: Vec2.fromAngle(rand(360)).scale(rand(0.01, 0.2)),
        shooting: false
    }
    stars.push(star)
}

function createShootingStar() {
    const [position, side] = randomPosOnSideOfScreen()
    const angle = angleTowardsScreen(side)
    add([
        sprite('shooting star', { anim: 'fly' }),
        pos(position),
        anchor('left'),
        offscreen({ destroy: true, distance: 300 }),
        z(ZLevels.indexOf('stars')),
        rotate(angle + 180),
        opacity(rand(0.1, 0.8)),
        scale(1),
        move(Vec2.fromAngle(angle), 300)
    ])
}

function createPlanet() {
    const [position, side] = randomPosOnSideOfScreen()
    const angle = angleTowardsScreen(side)
    const planet = choose('ringed planet', 'base planet')
    add([
        sprite(planet),
        pos(position),
        anchor('right'),
        offscreen({ destroy: true, distance: 100 }),
        z(ZLevels.indexOf('stars')),
        rotate(rand(-30, 30)),
        scale(rand(1, 5)),
        opacity(0.80),
        move(Vec2.fromAngle(angle), 80)
    ])
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

    let timeSincePlanet = 0
    let timeSinceShootingStar = 0
    onUpdate(() => {
        let starsToReAdd = 0
        timeSinceShootingStar += dt()
        timeSincePlanet += dt()

        if (timeSinceShootingStar > 5) {
            if (randi(0, 9) < 3) {
                createShootingStar()
                createShootingStar()
            } else {
                createShootingStar()
            }

            timeSinceShootingStar = 0
        }

        if (timeSincePlanet > 30) {
            createPlanet()
            timeSincePlanet = 0
        }

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
