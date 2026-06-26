import { setupBackground } from './background'
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
            size: 20,
            width: 500,
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

    const input = add([
        pos(center()),
        anchor('center'),
        text('type the id of the player you want to join', {
            size: 25,
            width: 500,
        }),
        textInput(),
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