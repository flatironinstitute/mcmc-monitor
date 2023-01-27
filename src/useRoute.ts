import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export type Route = {
    page: 'home'
} | {
    page: 'run',
    runId: string
} | {
    page: 'chain',
    runId: string
    chainId: string
}

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const route: Route = useMemo(() => {
        if (location.pathname.startsWith('/run/')) {
            const a = location.pathname.split('/')
            const runId = a[2]
            return {
                page: 'run',
                runId
            }
        }
        else if (location.pathname.startsWith('/chain/')) {
            const a = location.pathname.split('/')
            const runId = a[2]
            const chainId = a[3]
            return {
                page: 'chain',
                runId,
                chainId
            }
        }
        else {
            return {
                page: 'home'
            }
        }
    }, [location])

    const setRoute = useCallback((r: Route) => {
        if (r.page === 'home') {
            navigate({...location, pathname: ''})
        }
        else if (r.page === 'run') {
            navigate({...location, pathname: `/run/${r.runId}`})
        }
        else if (r.page === 'chain') {
            navigate({...location, pathname: `/chain/${r.runId}/${r.chainId}`})
        }
    }, [location, navigate])

    return {
        route,
        setRoute
    }    
}

export default useRoute