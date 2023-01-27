import { FunctionComponent } from "react";
import RunsTable from "../components/RunsTable";

type Props = any

const Home: FunctionComponent<Props> = () => {
	return (
		<div>
			<h1>MCMC Monitor</h1>
			<RunsTable />
		</div>
	)
}

export default Home
