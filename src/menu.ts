import { setupBackground } from './background'
import { ZLevels } from './main'
import './network'
import { connect, peerId } from './network'


export function setupMenu() {
    console.log('menu setup')
    scene('menu', menu)
}

function menu() {
    setBackground(BLACK)
    setupBackground()
    

    const idText = add([
        pos(center().add(vec2(0, -60))),
        anchor('center'),
        text('generating ID', {
            size: 50,
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
            size: 25,
            width: 500,
            font: 'pixel'
        }),
        textInput(),
        z(ZLevels.indexOf('menu text'))
    ])

    onUpdate(async () => {
        if (isKeyDown('control') && isKeyDown('v')) {
            input.text = await navigator.clipboard.readText()
        }
    })

    input.onKeyPress('enter', () => {
        if (input.text.length > 2) {
            connect(input.text)
        }
    })

    
    onKeyPress('p', () => {
        go('game')
    })

    idText.onClick(() => {
        if (_peerId) {
            navigator.clipboard.writeText(_peerId)
            debug.log('copied id')
        }
    })
}