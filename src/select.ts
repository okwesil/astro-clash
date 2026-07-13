import type { Vector } from './game'
import type { GameObj, SpriteComp, PosComp, AnchorComp, TimerComp, ScaleComp, RotateComp } from 'kaplay'
import { type Ship, ships, shipDescriptions, ZLevels, transition } from './main'
import { setupBackground } from './background'


export function setupSelect() {
    scene('select', select)
}

let selectedShipIndex = 0
export const getSelectedShip = (): Ship => ships[selectedShipIndex]
function select() {
    setupBackground()

    add([
        pos(width() / 2, 100),
        text('Choose Your Ship', {
            font: 'pixel',
            size: 90,
        }),
        anchor('center'),
    ])

    const next = add([
        pos(width() / 2, 160),
        text('next ->', {
            font: 'pixel',
            size: 50,
        }),
        anchor('center'),
        area({ scale: 1.5 }),
        scale(),
        timer(),
    ])

    next.onClick(() => {
        transition('menu')
    })

    next.onHover(() => {
        next.tween(vec2(1), vec2(1.2), 0.3, (value) => (next.scale = value))
    })

    next.onHoverEnd(() => {
        next.tween(vec2(1.2), vec2(1), 0.3, (value) => (next.scale = value))
    })

    onKeyPress('escape', () => {
        transition('title')
    })

    const shipName = add([
        text(ships[selectedShipIndex], {
            size: 50, font: 'pixel'
        }),
        pos(width() / 2, height() / 2 + 170),
        anchor('bot'),
    ])

    const shipDescriptionText = add([
        text(shipDescriptions[selectedShipIndex], {
            size: 30, font: 'pixel', width: width() - 200
        }),
        pos(width() / 2, height() / 2 + 170),
        anchor('top'),
    ])

    const SHIP_SCALE = 4
    // all ship sprites are 50 x 50
    const SHIP_WIDTH = 50
    const SHIP_SPACING = SHIP_WIDTH * SHIP_SCALE + 100
    function calculateShipPosition(index: number): Vector {
        return vec2(width() / 2 + (SHIP_SPACING * index) - selectedShipIndex * SHIP_SPACING, height() / 2 - 30)
    }

    function repositionShips(direction: 'left' | 'right') {
        for (let i = 0; i < ships.length; i++) {
            const ship = shipObjects[i]
            if (i == selectedShipIndex) {
                ship.tween(ship.scale, vec2(SHIP_SCALE + 2.5), 0.2, (value) => (ship.scale = value))
            } else {
                ship.tween(ship.scale, vec2(SHIP_SCALE), 0.2, (value) => (ship.scale = value))
            }
            ship.tween(ship.pos, calculateShipPosition(i), 0.2 + (direction == 'right' ? (0.1 * i) : (0.1 * (ships.length - i))), (value) => (ship.pos = value))
        }

        shipDescriptionText.text = shipDescriptions[selectedShipIndex]
        shipName.text = ships[selectedShipIndex]
    }

    onKeyPress('right', () => {
        selectedShipIndex = (selectedShipIndex + 1) % ships.length
        repositionShips('right')
    })

    onKeyPress('left', () => {
        selectedShipIndex--
        if (selectedShipIndex < 0) selectedShipIndex = ships.length - 1
        repositionShips('left')
    })

    // ship selection
    type ShipObject = GameObj<SpriteComp | PosComp | AnchorComp | TimerComp | ScaleComp | RotateComp>
    const shipObjects: ShipObject[] = []
    for (let i = 0; i < ships.length; i++) {
        let position = calculateShipPosition(i)
        const obj = add([
            pos(position),
            anchor('center'),
            sprite(ships[i]),
            scale(SHIP_SCALE),
            rotate(),
            timer(),
            area(),
            z(ZLevels.indexOf('ui'))
        ])

        const rotationSpeed = rand(1, 3)
        obj.onUpdate(() => {
            obj.angle += rotationSpeed
        })

        obj.onHover(() => {
            if (selectedShipIndex == i) return
            obj.tween(vec2(SHIP_SCALE), vec2(SHIP_SCALE).add(1), 0.2, (value) => (obj.scale = value))
        })

        obj.onHoverEnd(() => {
            if (selectedShipIndex == i) return
            obj.tween(vec2(SHIP_SCALE).add(1), vec2(SHIP_SCALE), 0.2, (value) => (obj.scale = value))
        })

        obj.onClick(() => {
            const prevIndex = selectedShipIndex
            selectedShipIndex = i
            if (i < prevIndex) {
                repositionShips('right')
            } else {
                repositionShips('left')
            }

        })
        shipObjects.push(obj)
    }
    repositionShips('left')
}
