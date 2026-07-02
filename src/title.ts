import { setupBackground } from "./background"
import { transition } from "./main";


export function setupTitle() {
    scene('title', title)
}

function easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;

    return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function title() {
    setupBackground()
    const logo = add([
        sprite('logo'),
        pos(vec2(width() / 2, -300)),
        anchor('top'),
        timer(),
        animate()
    ])
    logo.tween(-200, 20, 2, (value) => (logo.pos.y = value), easeOutElastic)
    wait(3, () => {
        logo.animate('pos', [vec2(width() / 2, 40), vec2(width() / 2, 20)], { duration: 3, direction: 'ping-pong' })
    })
    
    const rectangle = add([
        rect(0, 120),
        pos(width(), height() / 2 + 100),
        anchor('right'),
        area(),
        timer(),
    ])

    const playButton = add([
        text('Play', { font: 'pixel', size: 75 }),
        pos(center().add(vec2(0, 100))),
        anchor('center'),
        area(),
        scale(),
        color(WHITE),
        timer(),
    ])

    rectangle.onClick(() => {
        transition('menu')
    })



    let firstFrame = true    
    const RANGE_HEIGHT = 75
    const mouseWithinRange = () => Math.floor(mousePos().y) > playButton.pos.y - RANGE_HEIGHT / 2 && Math.floor(mousePos().y) < playButton.pos.y + RANGE_HEIGHT / 2
    playButton.onUpdate(() => {
        if (firstFrame && mouseWithinRange()) {
            firstFrame = false
            playButton.tween(vec2(1), vec2(1.2), 0.3, (value) => (playButton.scale = value))
            playButton.tween(WHITE, BLACK, 0.3, (value) => (playButton.color = value))
            rectangle.tween(0, width(), 0.1, (value) => rectangle.width = value)
        }
        
        if (!firstFrame && !mouseWithinRange()) {
            firstFrame = true
            playButton.tween(vec2(1.2), vec2(1), 0.3, (value) => (playButton.scale = value))
            playButton.tween(BLACK, WHITE, 0.3, (value) => (playButton.color = value))
            rectangle.tween(width(), 0, 0.1, (value) => rectangle.width = value)
        }
    })

    
}