import { setupBackground } from './background'
import { musicPlayer, shipDescriptions, ships, transition, ZLevels, type Ship } from './main'
import { connect, peerId, send, setConnectionListener, setOnError } from './network'
import type { Vector } from './game'
import type { GameObj, SpriteComp, PosComp, AnchorComp, TimerComp, ScaleComp, RotateComp } from 'kaplay'


export function setupMenu() {
    scene('menu', menu)
}

let selectedShipIndex = 0
export const getSelectedShip = (): Ship => ships[selectedShipIndex]
function menu(reason: string | undefined) {
    setConnectionListener('close', (reason) => transition('menu', reason))
    setBackground(BLACK)
    setupBackground()
    setConnectionListener('open', () => {
        transition('game', true)
    })

    const soundToggle = add([
        sprite(musicPlayer.isPlaying ? 'sound on' : 'sound off'),
        area(),
        pos(10, height() + 70),
        anchor('botleft'),
        timer(),
        z(ZLevels.indexOf('ui')),
    ])

    const songText = add([
        text(musicPlayer.song, { size: 30, font: 'pixel' }),
        pos(80, height() + 40),
        anchor('botleft'),
        z(ZLevels.indexOf('ui')),
        timer()
    ])

    soundToggle.tween(height() + soundToggle.height, height() - 10, 0.3, (value) => (soundToggle.pos.y = value))
    if (musicPlayer.isPlaying)
        songText.tween(height() + songText.height, height() - 15, 0.3, (value) => (songText.pos.y = value))

    musicPlayer.onChangeState = (isPlaying, song) => {
        if (isPlaying) {
            soundToggle.sprite = 'sound on'
            songText.tween(height() + songText.height, height() - 15, 0.3, (value) => (songText.pos.y = value))
        } else {
            soundToggle.sprite = 'sound off'
            songText.tween(height() - 15, height() + songText.height, 0.3, (value) => (songText.pos.y = value))
        }
        songText.text = song
    }

    soundToggle.onClick(() => {
        if (musicPlayer.isPlaying) musicPlayer.pause()
        else musicPlayer.resume()
    })

    const idText = add([
        pos(vec2(width() / 2, 20)),
        anchor('top'),
        text('generating ID', {
            size: 60,
            width: width(),
            font: 'pixel',
            align: 'center'
        }),
        area(),
        color(rgb(255, 37, 37)),
        z(ZLevels.indexOf('ui')),
    ])

    let _peerId: string | null = null
    peerId.then(id => {
        idText.text = 'your id is: ' + id
        idText.color = rgb(255, 255, 255)
        _peerId = id
    })

    // input background so stars does mess it up
    const startingMessage = 'type the id of the player you want to join'
    const input = add([
        pos(width() / 2, 90),
        anchor('top'),
        text(startingMessage, {
            size: 30,
            width: 500,
            font: 'pixel'
        }),
        textInput(),
        color(WHITE),
        z(ZLevels.indexOf('ui')),
    ])


    setOnError((error) => {
        connecting = false
        connectingText.text = error.message
    })
    let connecting = false
    const connectingText = add([
        pos(vec2(width() / 2, 140)),
        anchor('center'),
        text(reason ? reason : 'connecting...', {
            size: 30,
            width: 500,
            font: 'pixel'
        }),
        color(RED),
        z(ZLevels.indexOf('ui')),
        opacity(reason ? 1 : 0),
    ])

    onUpdate(async () => {
        if (isKeyDown('control') && isKeyDown('v')) {
            input.text = await navigator.clipboard.readText()
            connect(input.text)
            connecting = true
        }

        if (connecting) {
            connectingText.opacity = 1
            connectingText.text = 'connecting...'
            input.hasFocus = false
        } else {
            input.hasFocus = true
        }
    })

    input.onKeyPress('enter', () => {
        if (input.text.length > 2 && input.text != startingMessage && !connecting) {
            connect(input.text)
            connecting = true
        }
    })

    onKeyPress('escape', () => transition('title'))

    idText.onClick(() => {
        if (_peerId) {
            try {
                navigator.clipboard.writeText(_peerId)
                debug.log('copied id')
            } catch (error) {
                console.error("Couldn't print because of: ", error)
            }
        }
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
        pos(width() / 2, height() - 180),
        anchor('center'),
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

