import { setDataListener, isHost } from "./network"
import { shoot } from "./projectiles"

export function setupOtherPlayer() {
  const START_POS = !isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
  const player = add([
    pos(START_POS),
    sprite('cress blue', {
      anim: 'idle'
    }),
    color(),
    // body(),
    scale(1.2),
    z(3),
    area(),
    rotate(),
    anchor("center"),
    opacity(1),
    'solid'
  ])

  const HEALTHBAR_HEIGHT = 10
  // red bar
  add([
    pos(),
    rect(player.width, HEALTHBAR_HEIGHT, { radius: 3 }),
    color(RED),
    follow(player, vec2(-(player.width / 2), 30))
  ])

  // green bar
  const healthbar = add([
    pos(),
    rect(player.width, HEALTHBAR_HEIGHT, { radius: 3 }),
    color(GREEN),
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
  })

  setDataListener('movement', (data) => {
    player.pos.x = data.x
    player.pos.y = data.y
  })

  setDataListener('projectileShot', (data) => {
    shoot(data, false)
  })

  return player

}