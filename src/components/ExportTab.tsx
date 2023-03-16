import { FunctionComponent, useMemo } from "react";
import { useMCMCMonitor } from "../MCMCMonitorDataManager/useMCMCMonitor";

type Props = any

const ExportTab: FunctionComponent<Props> = () => {
	const {selectedRunId: runId, selectedChainIds, selectedVariableNames, sequences} = useMCMCMonitor()
	const csvText = useMemo(() => {
		const lines: string[] = []
		lines.push(['chain_', 'draw_', ...selectedVariableNames].join(','))
		for (const chainId of selectedChainIds) {
			const sss: number[][] = []
			let n = 0
			for (const variableName of selectedVariableNames) {
				const s = sequences.filter(s => (s.runId === runId && s.chainId === chainId && s.variableName === variableName))[0]
				if (s) {
					n = Math.max(n, s.data.length)
					sss.push(s.data)
				}
				else {
					sss.push([])
				}
			}
			for (let i = 0; i < n; i++) {
				const vals: string[] = []
				for (let j = 0; j < selectedVariableNames.length; j++) {
					const aa = sss[j][i]
					vals.push(aa === undefined ? '' : `${aa}`)
				}
				lines.push([chainId, `${i + 1}`, ...vals].join(','))
			}
		}
		return lines.join('\n')
	}, [selectedVariableNames, sequences, selectedChainIds, runId])
	return (
		<div>
			<textarea style={{width: '90%', maxWidth: 1000, height: 500}} value={csvText} />
		</div>
	)
}

export default ExportTab
