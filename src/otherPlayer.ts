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
    follow(player, vec2(-(player.width / 2), 30))
  ])

  setDataListener('healthChange', ({ maxHP, currentValue }) => {
    healthbar.width = (currentValue / maxHP) * player.width
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