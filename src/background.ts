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
        scale: rand(0.3, 1.2),
        velocity: Vec2.fromAngle(rand(360)).scale(0.05)
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

export function setupBackground() {
    setBackground(BLACK)
    fillScreenWithStars()

    
    onUpdate(() => {
        stars = stars.filter((star) => {
            star.pos = star.pos.add(star.velocity)

            const offscreen = isOffscreen(star.pos)
            if (offscreen) {
                createStar()
            }
            return !offscreen
        })

    })

    onSceneLeave(() => { fillScreenWithStars() })

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