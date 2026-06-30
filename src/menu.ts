import { setupBackground } from './background'
import { ZLevels } from './main'
import './network'
import { connect, peerId, setConnectionListener, setOnError } from './network'


export function setupMenu() {
    console.log('menu setup')
    scene('menu', menu)
}

function menu(reason: string | undefined) {
    setBackground(BLACK)
    setupBackground()
    setConnectionListener('open', () => go('game', true))
    

    const idText = add([
        pos(center().add(vec2(0, -60))),
        anchor('center'),
        text('generating ID', {
            size: 60,
            width: 500,
            font: 'pixel'
        }),
        area(),
        color(rgb(255, 37, 37)),
    ])
    
    let _peerId: string | null = null
    peerId.then(id => {
        idText.text = 'your id is: ' + id
        idText.color = rgb(255, 255, 255)
        _peerId = id
    })
    

    // input background so stars does mess it up
    add([
        rect(500, 40),
        anchor('center'),
        pos(center()),
        color(BLACK),
        z(ZLevels.indexOf('menu text background'))
    ])
    const input = add([
        pos(center()),
        anchor('center'),
        text('type the id of the player you want to join', {
            size: 30,
            width: 500,
            font: 'pixel'
        }),
        textInput(),
        color(WHITE),
        z(ZLevels.indexOf('menu text'))
    ])
    

    setOnError((error) => {
        connecting = false
        connectingText.text = error.message
    })
    let connecting = false
    const connectingText = add([
        pos(vec2(width() / 2, height() / 2 + 70)),
        anchor('center'),
        text(reason ? reason :  'connecting...', {
            size: 30,
            width: 500,
            font: 'pixel'
        }),
        color(RED),
        z(ZLevels.indexOf('menu text')),
        opacity(reason ? 1 : 0),
    ])

    onUpdate(async () => {
        if (isKeyDown('control') && isKeyDown('v')) {
            input.text = await navigator.clipboard.readText()
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
        if (input.text.length > 2 && !connecting) {
            connect(input.text)
            connecting = true
        }
    })

    
    // onKeyPress('p', () => {
    //     go('game')
    // })

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