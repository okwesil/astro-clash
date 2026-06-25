import { addDataListener, isHost } from "./network"

export function setupOtherPlayer() {
  const START_POS = !isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
  const player = add([
    pos(START_POS),
    sprite('cress blue', {
      anim: 'idle'
    }),
    color(),
    // body(),
    scale(),
    z(3),
    area(),
    rotate(),
    anchor("center"),
  ])

  addDataListener('movement', (data) => {
    player.pos.x = data.x
    player.pos.y = data.y
  })

  return player
}
