import { Peer, type DataConnection } from 'peerjs'
import type { Vec2 } from 'kaplay'
import type { ProjectileData } from './projectiles'

function generateId() {
    return Math.floor(Math.random() * 100000).toString()
}
const peer = new Peer(generateId())

export let peerId = new Promise<string>((resolve) => peer.on('open', (id) => resolve(id)))
export let isHost = false
let conn: DataConnection | null = null 
 
export const setOnConnect = (func: () => void) => onConnect = func 
let onConnect = () => {}


type PacketMap = {
    all: Packet
    movement: Vec2
    projectileShot: ProjectileData
    death: { hostWon: boolean }
    healthChange: { maxHP: number, currentValue: number }
}

type Packet =
    { [K in keyof PacketMap]: { type: K; data: PacketMap[K] } }[keyof PacketMap]

type Listener<TData> = (data: TData) => void

type ListenerMap = {
    [K in keyof PacketMap]: Listener<PacketMap[K]>
}

export const listeners: ListenerMap = {
    all: () => {},
    movement: () => {},
    projectileShot: () => {},
    death: () => {},
    healthChange: () => {},
}

export function setDataListener<K extends keyof PacketMap>(type: K, func: ListenerMap[K]): void {
    listeners[type] = func
}

function callListener(packet: Packet) {
    switch (packet.type) {
        case 'all':
            listeners.all(packet.data)
            break
        case 'movement':
            listeners.movement(packet.data)
            break
        case 'projectileShot':
            listeners.projectileShot(packet.data)
            break
        case 'death':
            listeners.death(packet.data)
            break
        case 'healthChange':
            listeners.healthChange(packet.data)
            break
    }
}

export function send<K extends keyof PacketMap>(type: K, data: PacketMap[K]) {
    if (!conn) return
    conn.send({ type, data })
}

// this client is trying to connect to another client
export function connect(id: string) {
    conn = peer.connect(id)
    // @ts-ignore
    conn.on('data', (packet: Packet) => callListener(packet))
    onConnect()
}

// this client is being connected to by another client
peer.on('connection', (c) => {
    isHost = true
    conn = c 
    // @ts-ignore
    c.on('data', (packet: Packet) => callListener(packet))
    onConnect()
})
