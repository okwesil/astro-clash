import { Peer, type DataConnection } from "peerjs"
import type { Vec2 } from "kaplay"
import type { ProjectileData } from "./projectiles"

function generateId() {
    return Math.floor(Math.random() * 100000).toString()
}
const peer = new Peer(generateId())

export let peerId = new Promise<string>((resolve) => peer.on("open", (id) => resolve(id)))
export let isHost = false
let conn: DataConnection | null = null 
 
export const setOnConnect = (func: () => void) => onConnect = func 
let onConnect = () => {}


type PacketMap = {
    all: Packet
    movement: Vec2
    'projectileShot': ProjectileData
}

type Packet =
    { [K in keyof PacketMap]: { type: K; data: PacketMap[K] } }[keyof PacketMap]

type Listener<TData> = (data: TData) => void

type ListenerMap = {
    all: Listener<Packet>[]
} & {
    [K in keyof PacketMap]: Listener<PacketMap[K]>[]
}

export const listeners: ListenerMap = {
    all: [],
    movement: [],
    'projectileShot': []
}

export function addDataListener<K extends keyof PacketMap>(type: K, func: Listener<PacketMap[K]>): void {
    listeners[type].push(func as never)
}

function callListener(packet: Packet) {
    switch (packet.type) {
        case 'movement':
            for (const listener of listeners.movement) listener(packet.data)
            break
        case 'projectileShot':
            for (const listener of listeners.projectileShot) listener(packet.data)
            break
    }

    for (const listener of listeners.all) {
        listener(packet)
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
