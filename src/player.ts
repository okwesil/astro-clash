import { addDataListener, isHost, send } from "./network"

export function setupPlayer() {
  const OUTLINE_COLOR = rgb(255, 24, 24)
  const SPEED = 80
  const FRICTION = 0.8
  const START_POS = isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
  const player = add([
    pos(START_POS),
    sprite('cress', {
      anim: 'idle'
    }),
    color(),
    outline(4, OUTLINE_COLOR),
    area(),
    rotate(),
    scale(),
    z(3),
    anchor("center"),
    {
      vel: vec2()
    }
  ])

  function keepPlayerOnScreen() {
    // if (player.pos.x + player.width / 2 > 600) {
    //   player.pos.x = 600 - player.width / 2
    // }

    // if (player.pos.x - player.width / 2 < 0) {
    //   player.pos.x = player.width / 2
    // }

    // if (player.pos.y + player.height / 2 > 600) {
    //   player.pos.y = 600 - player.height / 2
    // }

    // if (player.pos.y - player.height / 2 < 0) {
    //   player.pos.y = player.height / 2
    // }
  }

  player.onUpdate(() => {
    keepPlayerOnScreen()
    player.move(player.vel)
    player.vel = player.vel.scale(FRICTION)
    send('movement',  player.pos)
  })

  onKeyDown(['w', 'up'], () => {
    player.vel = player.vel.add(vec2(0, -SPEED))
  })
  onKeyDown(['s', 'down'], () => {
    player.vel = player.vel.add(vec2(0, SPEED))
  })
  onKeyDown(['a', 'left'], () => {
    player.vel = player.vel.add(vec2(-SPEED, 0))
  })
  onKeyDown(['d', 'right'], () => {
    player.vel = player.vel.add(vec2(SPEED, 0))
  })

  return player
}
