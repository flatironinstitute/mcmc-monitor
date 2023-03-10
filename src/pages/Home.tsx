import { Fragment, FunctionComponent } from "react";
import ConnectionStatusWidget from "../components/ConnectionStatusWidget";
import Hyperlink from "../components/Hyperlink";
import RunsTable from "../components/RunsTable";
import { defaultServiceBaseUrl, exampleServiceBaseUrl, serviceBaseUrl } from "../config";

type Props = any

const Home: FunctionComponent<Props> = () => {
	return (
        <Fragment>
			{
				serviceBaseUrl !== exampleServiceBaseUrl && (
					<div>
						<Hyperlink
							onClick={() => {;(window as any).location = `${window.location.protocol}//${window.location.host}${window.location.pathname}?s=${exampleServiceBaseUrl}`}}
						>View example data</Hyperlink>
					</div>
				)
			}
			{
				serviceBaseUrl === exampleServiceBaseUrl && (
					<div>
						Viewing example data.&nbsp;
						<Hyperlink
							onClick={() => {;(window as any).location = `${window.location.protocol}//${window.location.host}${window.location.pathname}?s=${defaultServiceBaseUrl}`}}
						>Connect to local service</Hyperlink>
					</div>
				)
			}
			<RunsTable />
			<hr />
			<ConnectionStatusWidget />
        </Fragment>
	)
}

export default Home
