import numpy as np
from cmdstanpy import CmdStanModel
import os
import shutil

def main():
    N = 400
    y = np.concatenate([np.random.normal(0, 2, 200), np.random.normal(5, 3, 200)])
    n_groups = 2

    iter_warmup = 50 # Number of warmup iterations
    iter_sampling = 200 # Number of sampling iterations

    # specify .stan file for this model
    thisdir = os.path.dirname(os.path.realpath(__file__))
    model_fname = f'{thisdir}/finite-mixture.stan'

    model = CmdStanModel(stan_file=model_fname)

    output_dir = f'{thisdir}/example-output/finite-mixture-1'
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)

    # Start sampling the posterior for this model/data
    fit = model.sample(
        data={'N': N, 'y': y, 'n_groups': n_groups},
        output_dir=output_dir,
        iter_sampling=iter_sampling,
        iter_warmup=iter_warmup,
        save_warmup=True,
        chains=10,
        parallel_chains=10
    )

if __name__ == '__main__':
    main()