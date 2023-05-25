import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export type Route = {
    page: 'home'
} | {
    page: 'run',
    runId: string
} | {
    page: 'spa',
    analysisId: string
    fileName: string
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
        else if (location.pathname.startsWith('/spa/')) {
            const a = location.pathname.split('/')
            const analysisId = a[2]
            const fileName = a[3]
            return {
                page: 'spa',
                analysisId,
                fileName
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
        else if (r.page === 'spa') {
            navigate({...location, pathname: `/spa/${r.analysisId}/${r.fileName}`})
        }
    }, [location, navigate])

    return {
        route,
        setRoute
    }    
}

export default useRoute