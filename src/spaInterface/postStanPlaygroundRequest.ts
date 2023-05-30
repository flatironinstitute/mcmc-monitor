import { stanPlaygroundUrl } from "../config"

const postStanPlaygroundRequest = async (req: any): Promise<any> => {
    const url = stanPlaygroundUrl

    const rr = {
        payload: req
    }
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rr),
    })
    const responseData = await resp.json()
    return responseData
}

export default postStanPlaygroundRequest