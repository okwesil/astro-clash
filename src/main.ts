import kaplay from "kaplay"
import "kaplay/global"
import { setupGame } from './game'
import { setupMenu } from './menu'
import { setConnectionListener } from "./network"

kaplay({
  width: 700,
  height: 700,
  stretch: true,
  letterbox: true,
  crisp: true,
})

setConnectionListener('close', (reason) => go('menu', reason))
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
loadSprite('star','/assets/star.png' )

loadSprite('crown', '/assets/red-crown.png')
loadSprite('crown blue', '/assets/blue-crown.png')

loadSound('laser sound', '/assets/cress/laser-sfx.mp3')
loadSound('railgun charging', '/assets/cress/railgun-charging.mp3')
loadSound('railgun firing', '/assets/cress/railgun-fire.mp3')

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

loadSprite('cress bullet', '/assets/cress/cress-bullet.png')
loadSprite('cress bullet blue', '/assets/cress/cress-bullet-blue.png')

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

// setupPlayer()
setupMenu()
setupGame()
go('menu')

