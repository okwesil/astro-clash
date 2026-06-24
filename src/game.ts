import { send } from "./network"
import { setupOtherPlayer } from "./otherPlayer"
import { setupPlayer } from "./player"

export function setupGame() {
    scene('game', game)
}

function game() {
    setupPlayer()
    setupOtherPlayer()
}