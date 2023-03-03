import { FunctionComponent } from "react";

type Props = any

// tricky
const logoUrl = window.location.hostname.includes('github.io') ? (
	`/mcmc-monitor/mcmc-monitor-logo.png`
) : (
	`/mcmc-monitor-logo.png`
)

const Logo: FunctionComponent<Props> = () => {
	return (
		<img src={logoUrl} width="600px" />
	)
}

export default Logo
