// See: https://github.com/flatironinstitute/bayes-kit/blob/main/bayes_kit/ess.py

export function autocorr(chain: number[], n: number): number[] {
    // todo: use FFT

    const mu = chain.length ? sum(chain) / chain.length : 0
    const chain_ctr = chain.map(a => (a - mu))
    const N = chain_ctr.length
    
    //////////////////////////////////////////////////////////////
    // acorrN = np.correlate(chain_ctr, chain_ctr, "full")[N - 1 :]
    let acorrN: number[] = []
    for (let i = 0; i < n; i++) {
        let aa = 0
        for (let j = 0; j < N - i; j++) {
            aa += chain_ctr[j] * chain_ctr[j + i]
        }
        acorrN.push(aa)
    }
    //////////////////////////////////////////////////////////////

    // normalize so that acorrN[0] = 1
    const a0 = acorrN[0]
    acorrN = acorrN.map(a => (a / a0))

    return acorrN
}

export function first_neg_pair_start(chain: number[]): number {
    const N = chain.length
    let n = 0
    while (n + 1 < N) {
        if (chain[n] + chain[n + 1] < 0) {
            return n
        }
        n = n + 1
    }
    return N
}

export function ess_ipse(chain: number[]): number {
    if (chain.length < 4) {
        console.warn('ess requires chain.length >=4')
        return 0
    }
    const acor = autocorr(chain, chain.length)
    const n = first_neg_pair_start(acor)
    const sigma_sq_hat = acor[0] + 2 * sum(acor.slice(1, n))
    const ess = chain.length / sigma_sq_hat
    return ess
}

export function ess_imse(chain: number[]): {ess: number, acor: number[]} {
    if (chain.length < 4) {
        console.warn('ess requires chain.length >=4')
        return {ess: 0, acor: []}
    }
    const acor = autocorr(chain, chain.length)
    const n = first_neg_pair_start(acor)
    let prev_min = 1
    let accum = 0
    let i = 1
    while (i + 1 < n) {
        prev_min = Math.min(prev_min, acor[i] + acor[i + 1])
        accum = accum + prev_min
        i = i + 2
    }

    const sigma_sq_hat = acor[0] + 2 * accum
    const ess = chain.length / sigma_sq_hat
    return {ess, acor}
}

export function ess(chain: number[]) {
    // use ess_imse for now
    return ess_imse(chain)
}

function sum(x: number[]) {
    return x.reduce((a, b) => (a + b), 0)
}