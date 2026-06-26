import { Peer, type DataConnection } from 'peerjs'
import type { Vec2 } from 'kaplay'
import type { ProjectileData } from './projectiles'

function generateId() {
    return Math.floor(Math.random() * 100000).toString()
}

const peer = new Peer(generateId(), {
    host: '192.168.1.87',
    port: 9000,
    path: '/space-fight',
    secure: false
})

export let peerId = new Promise<string>((resolve) => peer.on('open', (id) => {
    console.log('Peer open', id)
    resolve(id)
}))
export let isHost = false
let conn: DataConnection | null = null 
 
export const setOnConnect = (func: () => void) => onConnect = func 
let onConnect = () => {}

peer.on('error', (error) => {
    console.log('Peer error', error)
})
peer.on('disconnected', () => {
    console.log('Peer disconnected')
})
peer.on('close', () => {
    console.log('Peer closed')
})

type PacketMap = {
    ping: null
    all: any
    movement: Vec2
    projectileShot: ProjectileData
    death: { hostWon: boolean }
    healthChange: { maxHP: number, currentValue: number }
    stunFrames: { frames: number }
    railgunCharge: { completion: number }
    stoppedRailgunCharge: null
    aimingRailgun: { angle: number }
    fireRailgun: null 
}

type Packet =
    { [K in keyof PacketMap]: { type: K; data: PacketMap[K] } }[keyof PacketMap]

type Listener<TData> = (data: TData) => void

type ListenerMap = {
    [K in keyof PacketMap]: Listener<PacketMap[K]>
}

export const listeners: ListenerMap = {
    ping: () => {},
    all: () => {},
    movement: () => {},
    projectileShot: () => {},
    death: () => {},
    healthChange: () => {},
    stunFrames: () => {},
    railgunCharge: () => {},
    stoppedRailgunCharge: () => {},
    aimingRailgun: () => {},
    fireRailgun: () => {}
}

export function setDataListener<K extends keyof PacketMap>(type: K, func: ListenerMap[K]): void {
    listeners[type] = func
}

function callListener(packet: Packet) {
    console.log('inbound packet', packet)
    listeners.all(packet)
    for (const type of Object.keys(listeners) as Array<keyof PacketMap>) {
        if (type !== 'all' && packet.type === type) {
            const listener = listeners[type] as (data: unknown) => void
            listener(packet.data)
        }
    }
}

export function send<K extends keyof PacketMap>(type: K, data: PacketMap[K]) {
    if (!conn) {
        console.log('send dropped: no conn', type, data)
        return
    }
    if (!conn.open) {
        console.log('send dropped: conn not open', type, data)
        return
    }
    console.log('sending packet', type, data)
    conn.send({ type, data })
}

function setupConnection(connection: DataConnection) {
    console.log('setupConnection', connection.peer)
    conn = connection
    conn.on('open', () => {
        console.log('connection open', connection.peer)
        onConnect()
    })
    conn.on('data', (data: unknown) => {
        const packet = data as Packet
        callListener(packet)
    })
    conn.on('error', (error) => console.log('connection error', error))
    conn.on('close', () => {
        console.log('connection closed', connection.peer)
        if (conn === connection) conn = null
    })
}

export function connect(id: string) {
    console.log('connect() called with id', id)
    const connection = peer.connect(id)
    setupConnection(connection)
}

peer.on('connection', (c) => {
    console.log('peer.on(connection)', c.peer)
    isHost = true
    setupConnection(c)
})
