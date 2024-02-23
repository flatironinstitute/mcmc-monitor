// See: https://github.com/flatironinstitute/bayes-kit/blob/main/bayes_kit/ess.py

import { computeMean } from "../updateSequenceStats"
import { inverseTransform, transform as transformFft } from "./fft"

// Here's the reference implementation from bayes_kit/ess.py
// def autocorr_fft(chain: VectorType) -> VectorType:
//     """
//     Return sample autocorrelations at all lags for the specified sequence.
//     Algorithmically, this function calls a fast Fourier transform (FFT).
//     Parameters:
//     chain: sequence whose autocorrelation is returned
//     Returns:
//     autocorrelation estimates at all lags for the specified sequence
//     """
//     size = 2 ** np.ceil(np.log2(2 * len(chain) - 1)).astype("int")
//     var = np.var(chain)
//     ndata = chain - np.mean(chain)
//     fft = np.fft.fft(ndata, size)
//     pwr = np.abs(fft) ** 2
//     N = len(ndata)
//     acorr = np.fft.ifft(pwr).real / var / N
//     return acorr
export function autocorr_fft(chain: number[], n: number): number[] {
    const size = Math.round(Math.pow(2, Math.ceil(Math.log2(2 * chain.length - 1))))
    const variance = computeVariance(chain)
    if (variance === undefined) return []
    const mean = computeMean(chain)
    const ndata = chain.map(x => (x - (mean || 0)))
    while (ndata.length < size) {
        ndata.push(0)
    }
    const ndataFftReal = [...ndata]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ndataFftImag = ndata.map(_x => (0))
    transformFft(ndataFftReal, ndataFftImag)
    const pwr = ndataFftReal.map((r, i) => (r * r + ndataFftImag[i] * ndataFftImag[i]))
    const N = ndata.length
    const acorrReal = [...pwr]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const acorrImag = pwr.map(x => (0))
    inverseTransform(acorrReal, acorrImag) // doesn't include scaling
    return acorrReal.slice(0, n).map(x => (x / variance / N / chain.length))
}

// not used - fft is used instead
export function autocorr_slow(chain: number[], n: number): number[] {
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

// Here's the reference implementation from bayes_kit/ess.py
// def first_neg_pair_start(chain: VectorType) -> IntType:
//     """
//     Return the index of first element of the sequence whose sum with the following
//     element is negative, or the length of the sequence if there is no such element.
    
//     Parameters:
//     chain: input sequence
//     Return:
//     index of first element whose sum with following element is negative, or
//     the number of elements if there is no such element
//     """
//     N = len(chain)
//     n = 0
//     while n + 1 < N:
//         if chain[n] + chain[n + 1] < 0:
//             return n
//         n = n + 2
//     return N
export function first_neg_pair_start(chain: number[]): number {
    const N = chain.length
    let n = 0
    while (n + 1 < N) {
        if (chain[n] + chain[n + 1] < 0) {
            return n
        }
        n = n + 2
    }
    return N
}

export function ess_ipse(chain: number[]): number {
    if (chain.length < 4) {
        console.warn('ess requires chain.length >=4')
        return 0
    }
    
    // for verifying we get the same answer with both methods
    // console.log('test autocor_slow', autocorr_slow([1, 2, 3, 4, 0, 0, 0], 5))
    // console.log('test autocor_fft', autocorr_fft([1, 2, 3, 4, 0, 0, 0], 5))

    // const acor = autocorr_slow(chain, chain.length)
    const acor = autocorr_fft(chain, chain.length)
    const n = first_neg_pair_start(acor)
    const sigma_sq_hat = acor[0] + 2 * sum(acor.slice(1, n))
    const ess = chain.length / sigma_sq_hat
    return ess
}

// Here's the reference implementation from bayes_kit/ess.py (note there is a typo -- minprev should be prev_min)
// def ess_imse(chain: VectorType) -> FloatType:
//     """
//     Return an estimate of the effective sample size (ESS) of the specified Markov chain
//     using the initial monotone sequence estimator (IMSE).  This is the most accurate
//     of the available ESS estimators.  Because of the convex minorization used,
//     this approach is slower than using the IPSE function `ess_ipse`.
//     This estimator was introduced in the following paper.
//     Geyer, C.J., 1992. Practical Markov chain Monte Carlo. Statistical Science
//     7(4):473--483. 
    
//     Parameters:
//     chain: Markov chain whose ESS is returned
//     Return:
//     estimated effective sample size for the specified Markov chain
//     Throws:
//     ValueError: if there are fewer than 4 elements in the chain
//     """
//     if len(chain) < 4:
//         raise ValueError(f"ess requires len(chains) >=4, but {len(chain) = }")
//     acor = autocorr(chain)
//     n = first_neg_pair_start(acor)
//     prev_min = acor[1] + acor[2]
//     # convex minorization uses slow loop
//     accum = prev_min
//     i = 3
//     while i + 1 < n:
//         minprev = min(prev_min, acor[i] + acor[i + 1])
//         accum = accum + minprev
//         i = i + 2
//     # end diff code
//     sigma_sq_hat = acor[0] + 2 * accum
//     ess = len(chain) / sigma_sq_hat
//     return ess
export function ess_imse(chain: number[]): {ess: number, acor: number[]} {
    if (chain.length < 4) {
        console.warn('ess requires chain.length >=4')
        return {ess: 0, acor: []}
    }
    // const acor = autocorr_slow(chain, chain.length)
    const acor = autocorr_fft(chain, chain.length)
    const n = first_neg_pair_start(acor)
    let prev_min = acor[1] + acor[2]
    let accum = prev_min
    let i = 3
    while (i + 1 < n) {
        prev_min = Math.min(prev_min, acor[i] + acor[i + 1])
        accum = accum + prev_min
        i = i + 2
    }

    const sigma_sq_hat = acor[0] + 2 * accum
    const ess = chain.length / sigma_sq_hat
    return {ess, acor} // also return the acor for use in the plots
}

export function ess(chain: number[]) {
    // use ess_imse for now
    return ess_imse(chain)
}

function sum(x: number[]) {
    return x.reduce((a, b) => (a + b), 0)
}

function computeVariance(x: number[]) {
    const mu = computeMean(x)
    if (mu === undefined) return undefined
    return sum(x.map(a => (
        (a - mu) * (a - mu)
    ))) / x.length
}