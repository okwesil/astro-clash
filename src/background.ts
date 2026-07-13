import type { Vector } from "./game"
import { ZLevels } from "./main"


function choose<T>(...stuff: T[]): T {
    return stuff[randi(stuff.length)]
}

type SideOfScreen = 'left' | 'right' | 'top' | 'bot'
function randomPosOnSideOfScreen(): [Vector, SideOfScreen] {
    const side = choose('left', 'right', 'top', 'bot')
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
        case "bot":
            position = vec2(rand(width()), height())
            break
    }
    return [position, side]
}

function oppositeSide(side: SideOfScreen): SideOfScreen {
    switch (side) {
        case "left":
            return 'right'
        case "right":
            return 'left'
        case "top":
            return 'bot'
        case "bot":
            return 'top'
    }
}

function angleTowardsScreen(side: SideOfScreen) {
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
        case "bot":
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
        anchor(oppositeSide(side)),
        offscreen({ destroy: true, distance: 500 }),
        z(ZLevels.indexOf('stars')),
        rotate(rand(-30, 30)),
        scale(rand(0.5, 1.5)),
        opacity(0.8),
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

// if amp and offset are both above zero and are the same number the wave will never go below 0
const oscillate = (freq: number, amp: number, offset: number): number => Math.sin(debug.numFrames() * freq) * amp + offset
const BG_FREQ = 0.001
const BG_AMP = 10
export let BG_COLOR = () => rgb(oscillate(BG_FREQ, BG_AMP, BG_AMP), oscillate(BG_FREQ, BG_AMP, BG_AMP), oscillate(BG_FREQ, BG_AMP, BG_AMP))

export function setupBackground() {
    setBackground(BG_COLOR() as any)


    const swirl = add([
        rect(width(), height()),
        pos(0, 0),
        color(BG_COLOR()),
        shader("swirl", () => ({
            highlight: rgb(0.09, 0.09, 0.09),
            base: rgb(0.1, 0.1, 0.1),
            u_time: time()
        }))
    ])
    fillScreenWithStars()

    let timeSincePlanet = 0
    let timeSinceShootingStar = 0
    onUpdate(() => {
        setBackground(BG_COLOR() as any)
        swirl.color = BG_COLOR()
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
    })


    onSceneLeave(fillScreenWithStars)

    onDraw(() => {
        for (const { pos, scale } of stars) {
            drawSprite({
                sprite: 'star',
                pos,
                scale,
            })
        }

    })
}

