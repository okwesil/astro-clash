import { Peer, PeerError, type DataConnection } from 'peerjs'
import type { Vec2 } from 'kaplay'
import type { ProjectileData } from './projectiles'

function generateId() {
    return Math.floor(Math.random() * 100000).toString()
}


// metered.ca
const peer = new Peer(generateId(), {
    host: 'astro-clash-peerjs-server-796645945227.us-west2.run.app',
    port: 443,
    path: '/',
    secure: true,
    config: {
        iceServers: [
            {
                urls: "stun:stun.relay.metered.ca:80",
            },
            {
                urls: "turn:standard.relay.metered.ca:80",
                username: "e1d9bd163975135eac0144ef",
                credential: "BZo6UPDzxTNZ8S1C",
            },
        ]
    },
})

export let peerId = new Promise<string>((resolve) => peer.on('open', (id) => {
    console.log('Peer open', id)
    resolve(id)
}))
export let isHost = false
let conn: DataConnection | null = null 
 
export const setOnConnect = (func: () => void) => onConnect = func 
let onConnect = () => {}

type ErrorFunc = (error: PeerError<
    "disconnected" 
    | "browser-incompatible" | "invalid-id" |
    "invalid-key" | "network" | "peer-unavailable" |
    "ssl-unavailable" | "server-error" | "socket-error" |
    "socket-closed" | "unavailable-id" | "webrtc"
    >) => void
export const setOnError = (func: ErrorFunc) => onError = func
let onError: ErrorFunc = () => {}


peer.on('error', (error) => {
    console.error('Peer error', error.cause, error.message)
    onError(error)
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
    death: { hostWon: boolean; roundDied: number }
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
    // console.log('inbound packet', packet)
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
    // console.log('sending packet', type, data)
    conn.send({ type, data })
}

function setupConnection(connection: DataConnection) {
    console.log('setupConnection', connection.peer, 'open?', connection.open)
    conn = connection

    let opened = false
    const handleOpen = () => {
        if (opened) return
        opened = true
        console.log('connection open', connection.peer)
        onConnect()
    }

    conn.on('open', handleOpen)
    if (conn.open) {
        handleOpen()
    }

    conn.on('data', (data: unknown) => {
        const packet = data as Packet
        callListener(packet)
    })
    conn.on('iceStateChanged', (state) => {
        console.log('connection iceStateChanged', connection.peer, state)
    })
    conn.on('error', (error) => {
        console.log('connection error', error)
    })
    conn.on('close', () => {
        console.log('connection closed', connection.peer)
        if (conn === connection) conn = null
    })
}

export function connect(id: string) {
    console.log('connect() called with id', id)
    const connection = peer.connect(id, {
        reliable: true,
        serialization: 'json'
    })
    setupConnection(connection)
}

peer.on('connection', (c) => {
    console.log('peer.on(connection)', c.peer, 'open?', c.open)
    isHost = true
    setupConnection(c)
})
