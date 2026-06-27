import kaplay from "kaplay"
import "kaplay/global"
import { setupGame } from './game'
import { setupMenu } from './menu'
import { setOnConnect } from "./network"

kaplay({
  width: 700,
  height: 700,
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

loadFont('pixel', 'src/assets/Tiny5-Regular.ttf')

loadSprite('star','src/assets/star.png' )
loadSprite('cress', 'src/assets/cress/cress.png', {
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


loadSprite('cress blue', 'src/assets/cress/cress-blue.png', {
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

loadSprite('cress bullet', 'src/assets/cress/cress-bullet.png')
loadSprite('cress bullet blue', 'src/assets/cress/cress-bullet-blue.png')

loadSprite('laser collide', 'src/assets/laser-collision.png', {
  sliceX: 2,
  sliceY: 2,
  anims: {
    expand: {
      from: 0,
      to: 3
    }
  }
})

loadSprite('railgun', 'src/assets/cress/railgun-laser-longer.png', {
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

loadSprite('railgun blue', 'src/assets/cress/railgun-laser-blue.png', {
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

loadSprite('boom', 'src/assets/cress/boom.png', {
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
setOnConnect(() => go('game'))
setupMenu()
setupGame()
go('menu')

