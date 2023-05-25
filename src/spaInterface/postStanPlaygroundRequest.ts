const postStanPlaygroundRequest = async (req: any): Promise<any> => {
    const url = `https://stan-playground.vercel.app/api/playground`
    // const url = `http://localhost:3000/api/playground`

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