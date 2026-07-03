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