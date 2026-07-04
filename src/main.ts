import kaplay from "kaplay"
import "kaplay/global"
import { setupGame } from './game'
import { setupMenu } from './menu'
import { setupTitle } from "./title"
import { BG_COLOR, setupBackground } from "./background"

kaplay({
    width: 900,
    height: 900,
    stretch: true,
    letterbox: true,
    crisp: true,
})
console.log('main.ts loaded', window.location.href)

export const ZLevels = [
    'stars',
    'menu text background',
    'menu text',
    'healthbar',
    'other player',
    'current player',
    'laser',
    'railgun',
    'win text'
]

loadFont('pixel', '/assets/Minecraft.ttf')

const singleSprites: { name: string, path: string }[] = [
    { name: 'arrow', path: '/assets/arrow.png' },
    { name: 'logo', path: '/assets/logo.png' },
    { name: 'cress bullet', path: '/assets/cress/cress-bullet.png' },
    { name: 'cress bullet blue', path: '/assets/cress/cress-bullet-blue.png' },
    { name: 'crown', path: '/assets/red-crown.png' },
    { name: 'crown blue', path: '/assets/blue-crown.png' },
    { name: 'star', path: '/assets/star.png' },
    { name: 'ringed planet', path: '/assets/ringed planet.png' },
]

const sounds: { name: string, path: string }[] = [
    { name: 'laser sound', path: '/assets/cress/laser-sfx.mp3' },
    { name: 'railgun charging', path: '/assets/cress/railgun-charging.mp3' },
    { name: 'railgun firing', path: '/assets/cress/railgun-fire.mp3' },
    { name: 'boom', path: '/assets/boom.mp3' }
]

for (const sprite of singleSprites) {
    loadSprite(sprite.name, sprite.path)
}

for (const sound of sounds) {
    loadSound(sound.name, sound.path)
}


loadSprite('shooting star', '/assets/shooting star.png', {
    sliceX: 4,
    sliceY: 1,
    anims: {
        fly: {
            from: 0,
            to: 3,
            loop: true
        }
    }
})



loadSprite('cress', '/assets/cress/cress.png', {
    sliceX: 4,
    sliceY: 2,
    anims: {
        thruster: {
            from: 0,
            to: 3,
        },

        idle: {
            from: 5,
            to: 7,
        }
    }
})

loadSprite('cress blue', '/assets/cress/cress-blue.png', {
    sliceX: 4,
    sliceY: 2,
    anims: {
        thruster: {
            from: 0,
            to: 3,
        },

        idle: {
            from: 4,
            to: 7,
        }
    }
})


loadSprite('laser collide', '/assets/laser-collision.png', {
    sliceX: 2,
    sliceY: 2,
    anims: {
        expand: {
            from: 0,
            to: 3
        }
    }
})

loadSprite('railgun', '/assets/cress/railgun-laser-longer.png', {
    sliceX: 8,
    sliceY: 2,
    anims: {
        fire: {
            from: 0,
            to: 8
        },
        dissipate: {
            from: 9,
            to: 12
        }
    }
})

loadSprite('railgun blue', '/assets/cress/railgun-laser-blue.png', {
    sliceX: 8,
    sliceY: 2,
    anims: {
        fire: {
            from: 0,
            to: 8
        },
        dissipate: {
            from: 9,
            to: 12
        }
    }
})

loadSprite('boom', '/assets/boom.png', {
    sliceX: 7,
    sliceY: 1,
    anims: {
        expand: {
            from: 0,
            to: 6
        }
    }
})

const TRANSITION_DURATION = .15
export async function transition(scene: string, ...args: any[]) {
    const rectangle = add([
        rect(width(), height()),
        pos(-width(), 0),
        anchor('topleft'),
        z(100000),
        timer(),
        stay(),
        color(BG_COLOR)
    ])

    rectangle.tween(-rectangle.width, 0, TRANSITION_DURATION, (value) => (rectangle.pos.x = value))
    await new Promise((resolve) => setTimeout(resolve, TRANSITION_DURATION * 1000))
    go(scene, ...args)

    setTimeout(() => {
        rectangle.tween(0, width(), TRANSITION_DURATION, (value) => (rectangle.pos.x = value))
        setTimeout(() => rectangle.destroy(), TRANSITION_DURATION * 1000)
    }, 100)
}

const fpsVisual = add([
    text(debug.fps().toString(), {
        size: 20,
        font: 'pixel'
    }),
    pos(vec2(20)),
    area(),
    opacity(1),
    stay(),
    timer(),
    'ui',
    {
        update: () => {
            fpsVisual.text = debug.fps().toString()
        }
    }
])


setupBackground()
setupTitle()
setupMenu()
setupGame()
transition('title')

