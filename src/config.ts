const urlSearchParams = new URLSearchParams(window.location.search)
const queryParams = Object.fromEntries(urlSearchParams.entries())

export const defaultServiceBaseUrl = 'http://localhost:61542'

export const exampleServiceBaseUrl = 'https://lit-bayou-76056.herokuapp.com'

export const serviceBaseUrl = queryParams.s ? (
    queryParams.s
) : (
    defaultServiceBaseUrl
)