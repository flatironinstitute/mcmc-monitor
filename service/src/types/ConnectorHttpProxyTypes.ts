export type RequestFromClient = {
    type: 'requestFromClient'
    request: any
    requestId: string
}

export type ResponseToClient = {
    type: 'responseToClient'
    requestId?: string // added when sending over websocket
    response: any
    error?: string
}

export type InitializeMessageFromService = {
    type: 'initialize'
    serviceId: string
    servicePrivateId: string
    proxySecret: string
}

export type AcknowledgeMessageToService = {
    type: 'acknowledge'
}

export type PingMessageFromService = {
    type: 'ping'
}
