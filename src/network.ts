import { Peer, PeerError, type DataConnection } from 'peerjs'
import type { Vec2 } from 'kaplay'
import type { ProjectileData } from './projectiles'
import type { Vector } from './game'

function generateId() {
    return Math.floor(Math.random() * 100000).toString()
}


// metered.ca
const PEER_CONFIG = {
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
            {
                urls: "turn:standard.relay.metered.ca:80?transport=tcp",
                username: "e1d9bd163975135eac0144ef",
                credential: "BZo6UPDzxTNZ8S1C",
            },
            {
                urls: "turn:standard.relay.metered.ca:443",
                username: "e1d9bd163975135eac0144ef",
                credential: "BZo6UPDzxTNZ8S1C",
            },
            {
                urls: "turns:standard.relay.metered.ca:443?transport=tcp",
                username: "e1d9bd163975135eac0144ef",
                credential: "BZo6UPDzxTNZ8S1C",
            },
        ],
    },
}
let peer = new Peer(generateId(), PEER_CONFIG)

export let peerId = new Promise<string>((resolve) => peer.on('open', (id) => {
    console.log('Peer open', id)
    resolve(id)
}))
export let isHost = false
let conn: DataConnection | null = null 
 
type ConnEventMap = {
    open: null,
    // reason for closure
    close: string
}

type ConnEventListener<T> = (data: T) => void

type ConnEventListenerMap = {
    [K in keyof ConnEventMap]: ConnEventListener<ConnEventMap[K]>
}

const connectionListeners: ConnEventListenerMap = {
    open: () => {},
    close: () => {},
}

export function setConnectionListener<K extends keyof ConnEventMap>(type: K, func: ConnEventListenerMap[K]) {
    connectionListeners[type] = func
}
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
    connectionListeners.close('Peer disconnected, try refreshing')
    peer.reconnect()
    console.log('Peer disconnected')
})
peer.on('close', () => {
    connectionListeners.close('Peer closed, try refreshing')
    console.log('Peer closed')
})

type PacketMap = {
    ping: null
    all: Packet
    movement: Vec2
    projectileShot: ProjectileData
    projectilePos: { pos: Vector, projId: string }
    deleteProjectiles: { projIds: string[] }
    death: { hostWon: boolean; roundDied: number }
    healthChange: { maxHP: number, currentValue: number }
    stunFrames: { frames: number }
    railgunCharge: { completion: number }
    stoppedRailgunCharge: null
    aimingRailgun: { angle: number }
    fireRailgun: null 
    endOfCooldown: { sentByHost: boolean }
    getCurrentState: null
    currentState: { score: { host: number, other: number }, rounds: number }
    reasonForDisconnect: { reason: string }
}

type Packet =
    { [K in keyof PacketMap]: { type: K; data: PacketMap[K] } }[keyof PacketMap]

type Listener<TData> = (data: TData) => void

type ListenerMap = {
    [K in keyof PacketMap]: Listener<PacketMap[K]>
}

export const listeners: ListenerMap = {
    all: () => {},
    ping: () => {},
    movement: () => {},
    projectileShot: () => {},
    projectilePos: () => {},
    deleteProjectiles: () => {},
    death: () => {},
    healthChange: () => {},
    stunFrames: () => {},
    railgunCharge: () => {},
    stoppedRailgunCharge: () => {},
    aimingRailgun: () => {},
    fireRailgun: () => {},
    endOfCooldown: () => {},
    getCurrentState: () => {},
    currentState: () => {},
    reasonForDisconnect: () => {}
}

const listenersForAllPackets: Record<string, Listener<Packet>> = {}
export function setDataListener<K extends keyof PacketMap>(type: K | 'all', func: ListenerMap[K]): string | undefined {
    if (type == 'all') {
        let id = rand(10000).toString()
        while (Object.keys(listenersForAllPackets).includes(id)) {
            id = rand(10000).toString()
        }
        listenersForAllPackets[id] = func as unknown as Listener<Packet>
        return id
    }
    listeners[type] = func
}


export function waitForPacket<K extends keyof PacketMap>(type: K): Promise<Packet> {
    return new Promise(resolve => {
        const id = setDataListener('all', (packet: Packet) => {
            if (id) delete listenersForAllPackets[id]
            if (packet.type == type) resolve(packet)
        })
    })
}

function callListener(packet: Packet) {
    // console.log('inbound packet', packet)
    
    for (const id in listenersForAllPackets) {
        listenersForAllPackets[id](packet)
    }
    for (const type of Object.keys(listeners) as Array<keyof PacketMap>) {
        if (packet.type === type) {
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

    conn.on('open', () => {
        console.log('connection open', connection.peer)
        connectionListeners.open(null)
    })

    conn.on('data', (data: unknown) => {
        const packet = data as Packet
        callListener(packet)
    })
    conn.on('iceStateChanged', (state) => {
        console.log('connection iceStateChanged', connection.peer, state)
        if (state == 'disconnected') {
            connectionListeners.close('the other player has closed the connection :(')
        }
    })
    conn.on('error', (error) => {
        console.log('connection error', error)
    })
    conn.on('close', () => {
        console.log('connection closed', connection.peer)
        let reasoning = reasonForClosure != null ? reasonForClosure : 'the other player has closed the connection >:(' 
        connectionListeners.close(reasoning)
        reasonForClosure = null
        if (conn === connection) conn = null
    })
}

export function connect(id: string) {
    console.log('connect() called with id', id)
    const connection = peer.connect(id, {
        reliable: false,
    })
    isHost = false
    setupConnection(connection)
}

peer.on('connection', (c) => {
    console.log('peer.on(connection)', c.peer, 'open?', c.open)
    isHost = true
    setupConnection(c)
})

export const closeConnection = (reason: string) => {
    reasonForClosure = reason
    conn?.close()
}
export let reasonForClosure: string | null = null
