import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export type Route = {
    page: 'home'
} | {
    page: 'run',
    runId: string
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
    }, [location, navigate])

    return {
        route,
        setRoute
    }    
}

export default useRoute