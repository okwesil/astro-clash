import { angleBetween } from "./game"
import { ZLevels } from "./main"
import { setDataListener, isHost } from "./network"
import { drawChargeCircle, drawRailgunAimingLine, drawStunCircle, fireRailgun, MAX_STUN, RAILGUN_CHARGE_TIME } from "./player"
import { shoot } from "./projectiles"

export function setupOtherPlayer() {
  const START_POS = !isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
  const player = add([
    pos(START_POS),
    sprite('cress blue', {
      anim: 'idle'
    }),
    color(),
    scale(1.2),
    z(ZLevels.indexOf('other player')),
    area(),
    rotate(isHost ? 180 : 0),
    anchor("center"),
    opacity(1),
    {
      otherPlayersPos: vec2()
    }
  ])

  const HEALTHBAR_HEIGHT = 10
  // red bar
  add([
    pos(),
    rect(player.width, HEALTHBAR_HEIGHT, { radius: 3 }),
    color(RED),
    z(ZLevels.indexOf('healthbar')),
    follow(player, vec2(-(player.width / 2), 30))
  ])

  // green bar
  const healthbar = add([
    pos(),
    rect(player.width, HEALTHBAR_HEIGHT, { radius: 3 }),
    color(GREEN),
    z(ZLevels.indexOf('healthbar')),
    follow(player, vec2(-(player.width / 2), 30)),
    timer()
  ])

  let blinking = false
  let blinkingFrequency = 8
  setDataListener('healthChange', ({ maxHP, currentValue }) => {
    healthbar.tween(healthbar.width, (currentValue / maxHP) * player.width, .2, (value) => (healthbar.width = value))

    if (currentValue < maxHP * 0.65) {
      blinking = true
    }
    if (currentValue < maxHP * 0.25) {
      blinkingFrequency = 1
    }
  })

  
  player.onUpdate(() => {
    if (blinking) {
      player.opacity = Math.min(2 * (Math.sin(debug.numFrames() / blinkingFrequency) +  1), 1)
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