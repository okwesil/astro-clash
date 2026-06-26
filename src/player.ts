import { paused, type Vector } from "./game"
import { isHost, send } from "./network"
import { shoot, type ProjectileData } from "./projectiles"

export const MAX_STUN = 40
export function setupPlayer() {
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
    area(),
    rotate(),
    scale(1.2),
    z(3),
    anchor("center"),
    opacity(1),
    'solid',
    {
      vel: vec2(),
      knockbackVel: vec2(),
      stun: (duration: number) => {
        stunFrames = Math.min(duration, MAX_STUN)
      },
      knockback: (direction: Vector, strength: number) => {
        player.knockbackVel = player.knockbackVel.add(direction.scale(strength))
      }
    },
  ])

  let stunFrames = 0


  player.onHeal(() => {
    send('healthChange', { maxHP: player.maxHP() as number, currentValue: player.hp()})
  })

  let blinking = false
  let blinkingFrequency = 8
  player.onHurt(() => {
    if (player.hp() < (player.maxHP() as number) * 0.65) {
      blinking = true
    }
    if (player.hp() < (player.maxHP() as number) * 0.25) {
      blinkingFrequency = 1
    }
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
    player.vel = player.vel.add(player.knockbackVel)
    player.vel = player.vel.scale(FRICTION)
    player.knockbackVel = player.knockbackVel.scale(FRICTION)


    keepPlayerOnScreen()

    if (blinking) {
      player.opacity = Math.min(2 * (Math.sin(debug.numFrames() / blinkingFrequency) +  1), 1)
    }

    if (stunFrames > 0) {
      drawCircle({
        pos: player.pos,
        radius: player.width + 3,
        color: WHITE,
        fill: false,
        outline:{ width: 4, color: WHITE, opacity: (stunFrames / MAX_STUN)},
        anchor: 'center',
      })
      send('stunFrames', { frames: stunFrames })
      stunFrames--
    }

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
    if (stunFrames > 0) return
    player.vel = player.vel.add(vec2(0, -SPEED))
  })
  onKeyDown(['s', 'down'], () => {
    if (stunFrames > 0) return
    player.vel = player.vel.add(vec2(0, SPEED))
  })
  onKeyDown(['a', 'left'], () => {
    if (stunFrames > 0) return
    player.vel = player.vel.add(vec2(-SPEED, 0))
  })
  onKeyDown(['d', 'right'], () => {
    if (stunFrames > 0) return
    player.vel = player.vel.add(vec2(SPEED, 0))
  })

  const SHOT_COOLDOWN = 150
  let lastShotTime = 0
  let shootOnLeftSide = false
  const CENTER_OFFSET = 22
  onKeyDown(['z'], () => {
    if (!paused && stunFrames == 0 && Date.now() - lastShotTime > SHOT_COOLDOWN) {

      const data: ProjectileData = { 
        type: 'cress laser',
        sprite: 'cress bullet', 
        pos: vec2(player.pos.add(shootOnLeftSide ? vec2(-CENTER_OFFSET, 0) : vec2(CENTER_OFFSET, 0))), 
        direction: player.angle, 
        speed: 15,
        damage: 10
      }

      shoot(data, true)
      shootOnLeftSide = !shootOnLeftSide
      lastShotTime = Date.now()
    }
  })

  return player
}
