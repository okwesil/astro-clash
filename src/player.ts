import { paused } from "./game"
import { isHost, send } from "./network"
import { shoot, type ProjectileData } from "./projectiles"

export function setupPlayer() {
  const OUTLINE_COLOR = rgb(255, 24, 24)
  const SPEED = 80
  const FRICTION = 0.8
  const START_POS = isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
  const player = add([
    health(100, 100),
    pos(START_POS),
    sprite('cress', {
      anim: 'idle'
    }),
    color(),
    outline(4, OUTLINE_COLOR),
    area(),
    rotate(),
    scale(1.2),
    z(3),
    anchor("center"),
    'solid',
    {
      vel: vec2()
    },
  ])


  player.onHeal(() => {
    send('healthChange', { maxHP: player.maxHP() as number, currentValue: player.hp()})
  })
  player.onHurt(() => {
    send('healthChange', { maxHP: player.maxHP() as number, currentValue: player.hp()})
  })

  let lastPos = player.pos

  function keepPlayerOnScreen() {
    const halfWidth = player.width / 2
    const halfHeight = player.height / 2

    const right = player.pos.x + halfWidth
    const left = player.pos.x - halfWidth
    const top = player.pos.y - halfHeight
    const bottom = player.pos.y + halfHeight

    if (right > width()) player.pos.x = width() - halfWidth
    if (left < 0) player.pos.x = halfWidth
    if (bottom > height()) player.pos.y = height() - halfHeight
    if (top < 0) player.pos.y = halfWidth

  }


  player.onUpdate(() => {
    if (paused) { player.vel = vec2(); return }

    player.move(player.vel)
    player.vel = player.vel.scale(FRICTION)
    keepPlayerOnScreen()

    if (Math.abs(player.vel.x) > 0.2) {
      if (player.getCurAnim()?.name != 'thruster') {
        player.play('thruster')
      } 
    } else {
      if (player.getCurAnim()?.name != 'idle') {
        player.play('idle')
      } 
    }

    if (Math.floor(player.pos.x) == Math.floor(lastPos.x) && Math.floor(player.pos.y) == Math.floor(lastPos.y)) return
    send('movement',  player.pos)
    lastPos = player.pos
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
  const SHOT_COOLDOWN = 150
  let lastShotTime = 0
  let shootOnLeftSide = false
  const CENTER_OFFSET = 22
  onKeyDown(['z'], () => {
    if (!paused && Date.now() - lastShotTime > SHOT_COOLDOWN) {

      const data: ProjectileData = { 
        type: 'cress laser',
        sprite: 'cress bullet', 
        pos: vec2(player.pos.add(shootOnLeftSide ? vec2(-CENTER_OFFSET, 0) : vec2(CENTER_OFFSET, 0))), 
        direction: player.angle, 
        speed: 15,
        damage: 1
      }

      shoot(data, true)
      shootOnLeftSide = !shootOnLeftSide
      lastShotTime = Date.now()
    }
  })

  return player
}
