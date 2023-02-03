import numpy as np
import numpy.typing as npt

FloatType = np.float64
IntType = np.int64
VectorType = npt.NDArray[FloatType]

def autocorr_fft(chain: VectorType) -> VectorType:
    """
    Return sample autocorrelations at all lags for the specified sequence.
    Algorithmically, this function calls a fast Fourier transform (FFT).
    Parameters:
    chain: sequence whose autocorrelation is returned
    Returns:
    autocorrelation estimates at all lags for the specified sequence
    """
    size = 2 ** np.ceil(np.log2(2 * len(chain) - 1)).astype("int")
    print(size)
    var = np.var(chain)
    ndata = chain - np.mean(chain)
    fft = np.fft.fft(ndata, size)
    pwr = np.abs(fft) ** 2
    N = len(ndata)
    acorr = np.fft.ifft(pwr).real / var / N
    return acorr

# x = np.random.normal(0, 1, (100,))
y = autocorr_fft([1, 0, 0, 0])
print(y)