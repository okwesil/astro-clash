import { addDataListener, send } from "./network"

export function setupPlayer() {
  const OUTLINE_COLOR = rgb(255, 24, 24)
  const SPEED = 100
  const player = add([
    pos(center()),
    rect(50, 50),
    color(),
    outline(4, OUTLINE_COLOR),
    area(),
    rotate(),
    anchor("center"),
    {
      vel: vec2(),
    },
  ])

  function keepPlayerOnScreen() {
    if (player.pos.x + player.width / 2 > 600) {
      player.pos.x = 600 - player.width / 2
    }

    if (player.pos.x - player.width / 2 < 0) {
      player.pos.x = player.width / 2
    }

    if (player.pos.y + player.height / 2 > 600) {
      player.pos.y = 600 - player.height / 2
    }

    if (player.pos.y - player.height / 2 < 0) {
      player.pos.y = player.height / 2
    }
  }

  player.onUpdate(() => {
    player.angle += 4

    keepPlayerOnScreen()
    player.move(player.vel)
    player.vel = player.vel.scale(0.9)
    send('movement',  player.pos)
  })

  onKeyDown("w", () => {
    player.vel = player.vel.add(vec2(0, -SPEED))
  })
  onKeyDown("s", () => {
    player.vel = player.vel.add(vec2(0, SPEED))
  })
  onKeyDown("a", () => {
    player.vel = player.vel.add(vec2(-SPEED, 0))
  })
  onKeyDown("d", () => {
    player.vel = player.vel.add(vec2(SPEED, 0))
  })

}
