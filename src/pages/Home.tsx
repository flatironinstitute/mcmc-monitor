import { FunctionComponent } from "react";
import RunsTable from "../components/RunsTable";

type Props = any

const Home: FunctionComponent<Props> = () => {
	return (
		<div>
			<RunsTable />
		</div>
	)
}

export default Home
