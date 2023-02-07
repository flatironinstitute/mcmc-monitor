# MCMC Monitor

MCMC Monitor enables tracking and visualization of MCMC processes executed with Stan. When you run a [Stan](https://mc-stan.org/) program, you can configure Stan to generate output to a directory on your computer. MCMC Monitor then reads this output and displays it in the web app, with real-time updates. You can visualize the variables in the model, track the progress of the run, and examine the results. In future versions, you will be able to share those results in the cloud.

This is a client-side web-browser app.

How it works:

1. Run the mcmc-monitor service on your local computer (see below), configuring it to monitor an output directory.
2. Run a Stan program, configuring it to write output to a subdirectory of the output directory.
3. [Open the web app](http://flatironinstitute.github.io/mcmc-monitor) to monitor and visualize the Stan run.

## Running the local server

Make sure you have a recent version of [NodeJS](https://nodejs.org/en/download/) installed.

There is no need to clone this repo. Just run:

```bash
npx mcmc-monitor@latest start --dir /path/to/parent/output/directory --verbose
# The server will start listening for requests
# Keep this terminal open
# Open the web app linked above
```

To enable remote access (i.e., access this monitor service from a different computer) follow the instructions in the section below.

## Opening the web app

The web app is hosted [here](http://flatironinstitute.github.io/mcmc-monitor).

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

## Enabling remote access

To allow remote computers to access your monitor, do the following

* Setup a free account on ngrok and store the secret ngrok API authorization token to the NGROK_AUTH_TOKEN environment variable.
* Use the --enable-remote-access flag when starting the service.
* Follow the link printed in the console output.

In order to avoid using up bandwidth on your ngrok account, the remote access system uses WebRTC to connect the browser on the remote computer to the running MCMC Monitor service. Since is not always possible to establish a WebRTC connection, you may need to disable WebRTC by changing `webrtc=1` to `webrtc=0` in the query parameters of the URL.