function createStar() {
    const star = add([
        sprite('star'),
        pos(rand(vec2(width(), height()))),
        scale(rand(0.2, .9)),
        z(2),
        {
            direction: rand(vec2(-1), vec2(1)).scale(6)
        },
        'star'
    ])
}

export function setupBackground() {
    for (let i = 0; i < 76; i++) {
        createStar()
    }

    let lastDeletionTime = Date.now()

    onUpdate('star', (star) => {
        star.move(star.direction)
        if (Date.now() - lastDeletionTime > 1000) {
            star.destroy()    
            createStar()
            lastDeletionTime = Date.now()
        }
    })
}

const FREQUENCY = 20
export const BOUNDARY_SIZE = 550
export function setupBoundary() {
    const boundary = add([
        pos(center()),
        rect(BOUNDARY_SIZE, BOUNDARY_SIZE, { fill: false }),
        outline(4, RED),
        z(1),
        opacity(0.6),
        anchor('center')
    ])
    
    boundary.onUpdate(() => {
        boundary.opacity = (Math.sin(debug.numFrames() / FREQUENCY) + 1.5) / 3
    })

    
}