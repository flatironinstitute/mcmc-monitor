import { FunctionComponent } from "react";
import Hyperlink from "../components/Hyperlink";
import RunsTable from "../components/RunsTable";
import { defaultServiceBaseUrl, exampleServiceBaseUrl, serviceBaseUrl } from "../config";
import Logo from "../Logo";

type Props = any

const Home: FunctionComponent<Props> = () => {
	return (
		<div style={{margin: 60}}>
			<Logo />
			<h3>WIP</h3>
			<div style={{color: 'green'}}>Connected to service: {serviceBaseUrl}</div>
			{
				serviceBaseUrl === exampleServiceBaseUrl && (
					<Hyperlink
						onClick={() => {;(window as any).location = `${window.location.protocol}//${window.location.host}${window.location.pathname}?s=${exampleServiceBaseUrl}?s=${defaultServiceBaseUrl}`}}
					>Connect to local service</Hyperlink>
				)
			}
			<RunsTable />
		</div>
	)
}

export default Home
