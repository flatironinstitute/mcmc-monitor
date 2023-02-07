# MCMC Monitor

MCMC Monitor enables tracking and visualization of MCMC processes executed with [Stan](https://mc-stan.org/) in a local or remote web browser. When you run a sampler, you can configure Stan to generate output to a directory on your computer. MCMC Monitor reads this output and displays it in the web app, with real-time updates. You can visualize the variables in the model, track the progress of the run, and examine the results.

How it works:

1. [Run the mcmc-monitor service](#running-the-monitor-service) on your local computer (see below), configuring it to monitor an output directory.
2. [Run a Stan program](#running-a-stan-program), configuring it to write output to a subdirectory of the output directory.
3. [Open the web app](http://flatironinstitute.github.io/mcmc-monitor) to monitor and visualize the Stan run.

You can optional configure mcmc-monitor to enable monitoring from a remote computer (see below).

## Running the monitor service

First, make sure you have a recent version of [NodeJS](https://nodejs.org/en/download/) installed. This software has been tested with version 16.

> Note: there is no need to clone this repo. You can use the npx command below.

Install node-pre-gyp globally:

```bash
# prerequisite
npm install -g @mapbox/node-pre-gyp
```

Start the monitor:

```bash
npx mcmc-monitor@latest start --dir /path/to/parent/output/directory --verbose
# The server will start listening for requests
# Keep this terminal open
# Open the web app linked above

# Optionally use the --enable-remote-access flag
```

To enable remote access (i.e., access this monitor service from a different computer) follow the instructions in the section below.

## Running a Stan program

Install [cmdstan](https://mc-stan.org/users/interfaces/cmdstan), and optionally [cmdstanpy](https://mc-stan.org/cmdstanpy/) or [cmdstanr](https://mc-stan.org/cmdstanr/) (see [installation instructions](#installing-cmdstan-and-cmdstanpy)).

There are some example scripts in the examples directory of this repo. Try

```bash
cd examples
python test_multi_normal.py
# you can monitor this run using mcmc-monitor

python test_finite_mixture.py
# this one executes too quickly to monitor
# but you can view the output using mcmc-monitor
```

## Opening the web app

The web app is hosted [here](http://flatironinstitute.github.io/mcmc-monitor).

By default, the web app will attempt to connect to your monitoring service on port 61542 of localhost, but you can configure the GUI to point to other services, including remote services via our proxy server. See [enabling remote access](#enabling-remote-access).

## Enabling remote access

To allow remote computers to access your monitor, do the following

* Use the --enable-remote-access flag when starting the service.
* Follow the link printed in the console output.

**How does this work?** We provide a proxy server that allows remote machines to access your monitor service. In order to avoid excessive bandwidth usage on our server, the system establishes a WebRTC connection so that traffic flows directly between computers, bypassing our proxy. However, since is not always possible to establish a WebRTC connection (due to firewall configurations), you may need to disable WebRTC by changing `webrtc=1` to `webrtc=0` in the query parameters of the URL. Note that in the case of `webrtc=0`, our proxy service may limit the amount of data that is served. Please try to keep `webrtc=1` whenever that is working. You can also [host your own proxy server](https://github.com/magland/mcmc-monitor-proxy).

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

## Why monitor a running Stan program?

Monitoring a running Stan program provides insight into the progress of the run and the results of the sampling. By tracking the progress of the MCMC sampling, it is possible to detect and diagnose problems with the program and observe whether the iterations are converging to the equilibrium distribution. Additionally, monitoring the results of the sampling allows the user to gain a better understanding of the posterior distributions, even before the program completes, which can inform decisions and predictions.
