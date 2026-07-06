import { setupBackground } from './background'
import { musicPlayer, transition, ZLevels } from './main'
import { connect, peerId, setConnectionListener, setOnError } from './network'


export function setupMenu() {
    scene('menu', menu)
}

function menu(reason: string | undefined) {
    setConnectionListener('close', (reason) => transition('menu', reason))
    setBackground(BLACK)
    setupBackground()
    setConnectionListener('open', () => transition('game', true))

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
        pos(soundToggle.pos.x + soundToggle.width + 10, height() - 15),
        anchor('botleft'),
        z(ZLevels.indexOf('ui')),
    ])

    soundToggle.tween(height() + soundToggle.height, height() - 10, 0.3, (value) => (soundToggle.pos.y = value))

    musicPlayer.onChangeState = (isPlaying, song) => {
        if (isPlaying) {
            soundToggle.sprite = 'sound on'
        } else {
            soundToggle.sprite = 'sound off'
        }
        songText.text = song
    }

    soundToggle.onClick(() => {
        if (musicPlayer.isPlaying) musicPlayer.pause()
        else musicPlayer.resume()
    })

    const idText = add([
        pos(center().add(vec2(0, -60))),
        anchor('center'),
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
        pos(center()),
        anchor('center'),
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
        pos(vec2(width() / 2, height() / 2 + 70)),
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
}
