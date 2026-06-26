import { angleBetween, paused, type Vector } from "./game"
import { ZLevels } from "./main"
import { isHost, send } from "./network"
import { shoot, type ProjectileData } from "./projectiles"

export const MAX_STUN = 40

export function drawStunCircle(pos: Vector, width: number, stunFrames: number) {
  drawCircle({
    pos,
    radius: width,
    fill: false,
    outline:{ width: 8, color: WHITE, opacity: (stunFrames / MAX_STUN)},
    anchor: 'center',
  })
}


export const RAILGUN_CHARGE_TIME = 0.5
export function drawChargeCircle(pos: Vector, width: number, completion: number) {
  const color = completion == 1 ? RED : rgb(100, 0, 0)
  drawCircle({
    pos,
    radius: width,
    anchor: 'center',
    fill: false,
    outline: { width: 5, color, opacity: 1 },
    start: 360 - (completion * 360),
  })
}

export function drawRailgunAimingLine(p1: Vector, angle: number, completion: number) {
  const radians = (angle - 90) / 180 * Math.PI
  p1 = p1.add(Vec2.fromAngle(angle - 90).scale(50))
  const p2 = vec2(p1.x + (700 * Math.cos(radians)), p1.y + (700 * Math.sin(radians)))

  const color = completion == 1 ? RED : rgb(100, 0, 0)
  drawLine({
    p1, p2,
    width: 5,
    color
  })
}

export function fireRailgun(position: Vector, angle: number, red: boolean) {
  const railgun = add([
    sprite('railgun' + (red ? '' : ' blue'), { anim: 'fire' }),
    anchor('top'),
    pos(position),
    area({ scale: vec2(0.1, 1)}),
    rotate(angle),
    z(ZLevels.indexOf('railgun')),
    (red ? 'friendly railgun' : 'enemy railgun')
  ])

  // after a short interval deactivate hitbox
  wait(0.1, () => {
    railgun.collisionIgnore = ['*']
  })

  railgun.onAnimEnd((anim) => {
    if (anim == 'fire') {
      railgun.play('dissipate')
    } else {
      railgun.destroy()
    }
  })

  shake(50)
}

export function setupPlayer() {
  const SPEED = 80
  const FRICTION = 0.8
  const KNOCKBACK_FRICTION = 0.6
  const START_POS = isHost ? center().add(vec2(0, -200)) : center().add(vec2(0, 200))
  let elapsedCharge = 0

  const player = add([
    health(100, 100),
    pos(START_POS),
    sprite('cress', {
      anim: 'idle'
    }),
    color(),
    area(),
    rotate(isHost ? 180 : 0),
    scale(1.2),
    z(ZLevels.indexOf('current player')),
    anchor("center"),
    opacity(1),
    'current player',
    {
      vel: vec2(),
      knockbackVel: vec2(),
      stun: (duration: number) => {
        stunFrames = Math.min(duration, MAX_STUN)
      },
      knockback: (direction: Vector, strength: number) => {
        player.knockbackVel = player.knockbackVel.add(direction.scale(strength))
      },
      charged: () => elapsedCharge >= RAILGUN_CHARGE_TIME - 0.01,
      otherPlayersPos: vec2()
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

    player.vel = player.vel.add(player.knockbackVel)
    player.move(player.vel)
    player.vel = player.vel.scale(FRICTION)
    player.knockbackVel = player.knockbackVel.scale(KNOCKBACK_FRICTION)

    keepPlayerOnScreen()

    if (elapsedCharge == 0) {
      player.angle = angleBetween(player.pos, player.otherPlayersPos)
    }

    if (blinking) {
      player.opacity = Math.min(2 * (Math.sin(debug.numFrames() / blinkingFrequency) +  1), 1)
    }

    if (stunFrames > 0) {
      drawStunCircle(player.pos, player.width + 3, stunFrames)
      stunFrames--
      send('stunFrames', { frames: stunFrames })
      elapsedCharge = 0
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

  player.onDraw(() => {
    if (elapsedCharge > 0) {
      drawChargeCircle(vec2(), player.width + 3, elapsedCharge / RAILGUN_CHARGE_TIME)
      drawRailgunAimingLine(vec2(), 0, elapsedCharge / RAILGUN_CHARGE_TIME)
    }
  })

  onKeyDown(['w', 'up'], () => {
    if (stunFrames > 0 || elapsedCharge != 0) return
    player.vel = player.vel.add(vec2(0, -SPEED))
  })
  onKeyDown(['s', 'down'], () => {
    if (stunFrames > 0 || elapsedCharge != 0) return
    player.vel = player.vel.add(vec2(0, SPEED))
  })
  onKeyDown(['a', 'left'], () => {
    if (stunFrames > 0) return

    if (elapsedCharge != 0) {
      player.angle -= 1
      send('aimingRailgun', { angle: player.angle})
      return
    }

    player.vel = player.vel.add(vec2(-SPEED, 0))
  })
  onKeyDown(['d', 'right'], () => {
    if (stunFrames > 0) return
    
    if (elapsedCharge != 0) {
      player.angle += 1
      send('aimingRailgun', { angle: player.angle})
      return
    }

    player.vel = player.vel.add(vec2(SPEED, 0))
  })

  let alreadySentFullCompletion = false
  onKeyDown(['x'], () => {
    if (paused) return
    elapsedCharge += dt()
    if (player.charged()) elapsedCharge = RAILGUN_CHARGE_TIME

    if (!player.charged()) {
      send('railgunCharge', { completion: elapsedCharge / RAILGUN_CHARGE_TIME })
    }
    if (player.charged() && !alreadySentFullCompletion) {
      alreadySentFullCompletion = true
      send('railgunCharge', { completion: 1 })
    }
  })

  onKeyRelease(['x'], () => {
    send('stoppedRailgunCharge', null)
    alreadySentFullCompletion = false

    if (player.charged()) {
      fireRailgun(player.pos, player.angle - 180, true)
      player.stun(10)
      send('fireRailgun', null)
    }
    elapsedCharge = 0 
  })

  const SHOT_COOLDOWN = 150
  let lastShotTime = 0
  let shootOnLeftSide = false
  const CENTER_OFFSET = 22
  onKeyDown(['z'], () => {
    if (!paused && stunFrames == 0 && !player.charged() && Date.now() - lastShotTime > SHOT_COOLDOWN) {

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
