from cmdstanpy import CmdStanModel
import os

def main(example_num: int):
    if example_num == 1:
        # These are adjustable parameters
        rho = 0.9 # rho should be <1
        N = 400
        iter_warmup = 20 # Number of warmup iterations
        iter_sampling = 100 # Number of sampling iterations
        ##################################
    elif example_num == 2:
        # These are adjustable parameters
        rho = 0.8 # rho should be <1
        N = 200
        iter_warmup = 20 # Number of warmup iterations
        iter_sampling = 200 # Number of sampling iterations
        ##################################

    # specify .stan file for this model
    thisdir = os.path.dirname(os.path.realpath(__file__))
    model_fname = f'{thisdir}/multi-normal.stan'

    model = CmdStanModel(stan_file=model_fname)

    # Start sampling the posterior for this model/data
    fit = model.sample(
        data={'N': N, 'rho': rho},
        output_dir=f'{thisdir}/example-output/multi-normal-{example_num}',
        iter_sampling=iter_sampling,
        iter_warmup=iter_warmup,
        save_warmup=True
    )

if __name__ == '__main__':
    main(1)
    main(2)