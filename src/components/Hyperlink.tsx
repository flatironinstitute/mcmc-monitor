import React, { FunctionComponent, PropsWithChildren } from "react";

type Props ={
	onClick: () => void
}

const Hyperlink: FunctionComponent<PropsWithChildren<Props>> = ({children, onClick}) => {
	return (
		<a onClick={onClick} style={{cursor: 'pointer'}}>{children}</a>
	)
}

export default Hyperlink
