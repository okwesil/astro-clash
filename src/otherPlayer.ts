import { addDataListener } from "./network"

export function setupOtherPlayer() {
  const OUTLINE_COLOR = rgb(24, 228, 255)
  const player = add([
    pos(center()),
    rect(50, 50),
    color(),
    outline(4, OUTLINE_COLOR),
    area(),
    rotate(),
    anchor("center"),
  ])

  addDataListener('movement', (data) => {
    player.pos.x = data.x
    player.pos.y = data.y
  })

  player.onUpdate(() => {
    player.angle -= 4
  })
}
