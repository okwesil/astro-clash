function createStar() {
    add([
        sprite('star'),
        pos(rand(vec2(width(), height()))),
        scale(rand(0.2, 1.3)),
        offscreen({ destroy: true }),
        z(1),
        {
            direction: rand(vec2(-1), vec2(1)).scale(3)
        },
        'star'
    ])
}

export function setupBackground() {
    setBackground(BLACK)
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