import { FunctionComponent, useEffect } from 'react'
import CookieConsent, { Cookies, getCookieConsentValue } from "react-cookie-consent"
import ReactGA from 'react-ga4'


const handleAcceptCookie = () => {
    const analyticsTag = import.meta.env.VITE_GOOGLE_ANALYTICS_ID
    if (analyticsTag) {
        ReactGA.initialize(analyticsTag)
    }
}

const handleDeclineCookie = () => {
    Cookies.remove("_ga")
    Cookies.remove("_gat")
    Cookies.remove("_gid")
}

const CookieBanner: FunctionComponent = () => {
    useEffect(() => {
        const consenting = getCookieConsentValue()
        if (consenting === "true") {
            handleAcceptCookie()
        } else {
            console.log(`Cookies rejected, doing nothing`)
        }
    }, [])

    return (
        <CookieConsent
            enableDeclineButton
            onAccept={handleAcceptCookie}
            onDecline={handleDeclineCookie}
        >
            This website uses an analytics cookie to count page views and estimate
            the size of the user base. No advertising information is collected, but
            you may opt out entirely if you wish.
        </CookieConsent>
    )
}

export default CookieBanner
