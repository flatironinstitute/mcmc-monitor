# MCMC Monitor

This is a client-side web-browser app that enables tracking and visualization of MCMC processes executed with [Stan](https://mc-stan.org/).

How it works:

1. Run the mcmc-monitor service on your local computer (see below), configuring it to monitor an output directory.
2. Run a Stan program, configuring it to write output to a subdirectory of the output directory.
3. [Open the web app](http://magland.github.io/mcmc-monitor) to monitor and visualize the Stan run.

## Running the local server

Make sure you have a recent version of [NodeJS](https://nodejs.org/en/download/) installed.

You do **not** need to clone this repo. Just run:

```bash
npx mcmc-monitor@latest start --dir /path/to/parent/output/directory --verbose
# The server will start listening for requests
# Keep this terminal open
# Open the web app linked above
```

## Opening the web app

The web app is hosted [here](http://magland.github.io/mcmc-monitor).

## Installing cmdstan and cmdstanpy

To install cmdstan and cmdstanpy (within your conda environment):

```bash
conda install -c conda-forge cmdstan cmdstanpy
```

**Important**: You must reopen your terminal after running this install command, or reactivate the conda environment. This is necessary so that the $CMDSTAN environment variable is set properly.

For more information see the [cmdstanpy documentation](https://mc-stan.org/cmdstanpy/).

## What is MCMC sampling?

[Markov Chain Monte Carlo](https://en.wikipedia.org/wiki/Markov_chain_Monte_Carlo) (MCMC) sampling is a method of sampling from a probability distribution, such as a posterior distribution, in order to approximate the distribution. This is accomplished by running a Markov Chain with the desired distribution as its equilibrium distribution. With each step of the Markov Chain, a sample is taken from the probability distribution. After a sufficient number of steps, the samples will approximate the desired distribution.

## What is Stan?

[Stan](https://mc-stan.org/) is a statistical software package designed for Bayesian inference. To use Stan, the user must first write a Stan program, which contains a probabilistic model specification and a set of data-generating parameters. The program is then compiled and run on the Stan platform, which uses MCMC sampling to generate posterior distributions for the parameters in the model. With the posterior distributions, the user can then make inferences about the data and make predictions.