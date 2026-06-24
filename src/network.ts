import { Peer, type DataConnection } from "peerjs"

const peer = new Peer()

export let peerId = new Promise<string>((resolve) => peer.on("open", (id) => resolve(id)))
let conn: DataConnection | null = null 
 
export const setOnConnect = (func: () => void) => onConnect = func 
let onConnect = () => {}


type Listener = (data: unknown) => void
type PacketType = 'movement' | 'all'

type Packet = { type: PacketType; data: unknown }

export const listeners: Record<PacketType, Listener[]> = {
    'all': [],
    'movement': []
}
export function addDataListener(type: PacketType, func: Listener) {
    listeners[type].push(func)
}

function callListener(packet: Packet) {
    for (const listener of listeners[packet.type]) {
        listener(packet.data)
    }

    for (const listener of listeners.all) {
        listener(packet)
    }
}

export function send(type: PacketType, data: unknown) {
    if (!conn) return
    conn.send({type, data})
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
    console.log('connected')
    conn = c
    // @ts-ignore
    c.on('data', (packet: Packet) => callListener(packet))
    onConnect()
})
