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
  maxFPS: 60
})

loadSprite('cress', 'src/assets/cress.png', {
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

loadSprite('cress blue', 'src/assets/cress-blue.png', {
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

loadSprite('star','src/assets/star.png' )

// setupPlayer()
setOnConnect(() => go('game'))
setupMenu()
setupGame()
go('menu')

