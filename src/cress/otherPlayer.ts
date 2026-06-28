import { angleBetween } from "../game"
import { ZLevels } from "../main"
import { setDataListener, isHost } from "../network"
import { drawChargeCircle, drawRailgunAimingLine, fireRailgun } from "./player"
import { shoot } from "../projectiles"
import { drawStunCircle } from "../player"


export default function setupOtherCress(rounds: number) {
      let startPos = !isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
  let angle = isHost ? 180 : 0
  if (rounds % 2 == 0) {
    startPos.y = height() - startPos.y
    angle += 180
  }
  const player = add([
    pos(startPos),
    sprite('cress blue', {
      anim: 'idle'
    }),
    color(),
    scale(1.2),
    z(ZLevels.indexOf('other player')),
    area(),
    rotate(angle),
    anchor("center"),
    opacity(1),
    'cress',
    {
      otherPlayersPos: vec2(),
      blinking: false,
      blinkingFrequency: 8
    }
  ])

  player.onUpdate(() => {
    if (player.blinking) {
      player.opacity = Math.min(2 * (Math.sin(debug.numFrames() / player.blinkingFrequency) +  1), 1)
    }

    if (railgunChargeCompletion == 0) {
      player.angle = angleBetween(player.pos, player.otherPlayersPos)
    }
  })

  player.onDraw(() => {
    if (railgunChargeCompletion > 0) {
      drawRailgunAimingLine(vec2(), 0, railgunChargeCompletion)
      drawChargeCircle(vec2(), player.width, railgunChargeCompletion)
    }

    if (stunFrames > 0) {
      drawStunCircle(vec2(), player.width, stunFrames)
    }

  })

  setDataListener('movement', (data) => {
    player.pos.x = data.x
    player.pos.y = data.y
  })

  setDataListener('projectileShot', (data) => {
    shoot(data, false)
  })

  let stunFrames = 0
  setDataListener('stunFrames', ({ frames }) => {
    stunFrames = frames
  })

  let railgunChargeCompletion = 0
  setDataListener('railgunCharge', ({ completion }) => {
    railgunChargeCompletion = completion
  })

  setDataListener('stoppedRailgunCharge', () => {
    railgunChargeCompletion = 0
  })

  setDataListener('aimingRailgun', ({ angle }) => {
    player.angle = angle
  })

  setDataListener('fireRailgun', () => {
    fireRailgun(player.pos, player.angle - 180, false)
  })

  return player
}