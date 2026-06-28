import setupOtherCress from "./cress/otherPlayer";
import { ZLevels } from "./main";
import { setDataListener } from "./network";

export function setupOtherPlayer(rounds: number) { 
  const player = setupOtherCress(rounds)
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

  setDataListener('healthChange', ({ maxHP, currentValue }) => {
    healthbar.tween(healthbar.width, (currentValue / maxHP) * player.width, .2, (value) => (healthbar.width = value))

    if (currentValue < maxHP * 0.65) {
      player.blinking = true
    }
    if (currentValue < maxHP * 0.25) {
      player.blinkingFrequency = 1
    }
  })
  
  return player
}