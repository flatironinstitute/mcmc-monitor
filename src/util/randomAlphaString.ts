const randomAlphaString = (num_chars: number) => {
    if (!num_chars || num_chars < 0) {
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    let text = ""
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    for (let i = 0; i < num_chars; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

export default randomAlphaString
