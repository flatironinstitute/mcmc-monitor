import { describe, expect, test } from 'vitest'

// need to mock:
// postApiRequest
// SimplePeer
// Date.now() timer

describe("WebrtcConnectionToService embedded peer", () => {
    test("Connection object instantiates peer as part of construction", () => {

    })
    test("Instantiated peer responds to signal event", () => {

    })
    test("Instantiated peer posts a signaling request on signal event", () => {

    })
    test("Instantiated peer throws on bad signaling response", () => {

    })
    test("Instantiated peer handles connect event", () => {

    })
    test("Instantiated peer listens for data event", () => {

    })
    test("Instantiated peer throws on bad data event response", () => {

    })
    test("Instantiated peer warns on peer data response with no matching ID", () => {

    })
    test("Instantiated peer calls and deletes ID-matched callback on data response", () => {
        
    })
})

describe("WebrtcConnectionToService upon-construction peer connection", () => {
    test("Connection object attempts to connect on construction", () => {

    })
    test("Connection object times out after 15 seconds", () => {

    })
    test("Connection object throws on wrong response type", () => {

    })
    test("Connection object responds to all received signals", () => {

    })
})

describe("GUI web rtc connection post api request", () => {

})

describe("GUI web rtc connection status function", () => {
    test("Returns connection's current status", () => {
        expect(1).toBe(1)
    })
})
