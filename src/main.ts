import kaplay from "kaplay"
import "kaplay/global"
import { setupGame } from './game'
import { setupMenu } from './menu'
import { setOnConnect } from "./network"

kaplay({
  width: 600,
  height: 600,
  stretch: true,
  letterbox: true,
})

// setupPlayer()
setOnConnect(() => go('game'))
setupMenu()
setupGame()
go('menu')

