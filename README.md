# MCMC Monitor

![tests](https://github.com/flatironinstitute/mcmc-monitor/actions/workflows/test_coverage.yaml/badge.svg)
[![npm version](https://badge.fury.io/js/mcmc-monitor.svg)](https://badge.fury.io/js/mcmc-monitor)

<!-- Wait until we have more coverage before we show the percent coverage badge. -->
<!-- [![codecov](https://codecov.io/gh/flatironinstitute/mcmc-monitor/branch/main/graph/badge.svg)](https://codecov.io/gh/flatironinstitute/mcmc-monitor) -->

MCMC Monitor enables tracking and visualization of MCMC processes executed with [Stan](https://mc-stan.org/) in local or remote web browsers. When you run a sampler, you can configure Stan to generate output to a directory on your computer. MCMC Monitor reads this output and displays it in the web app, with real-time updates. As you track the progress of the run, MCMC provides diagnostic plots and statistics.

![image](https://github.com/flatironinstitute/mcmc-monitor/assets/3679296/d998f86d-2e81-457a-987b-9d5e290d9acc)

## How it works:

1. [Run the mcmc-monitor service](#running-the-monitor-service) on your local computer (see below), configuring it to monitor an output directory.
2. [Run a Stan program](#running-a-stan-program), configuring it to write output to a subdirectory of the output directory.
3. [Open the web app](http://flatironinstitute.github.io/mcmc-monitor) to monitor and visualize the Stan run.

You can optionally configure MCMC Monitor to enable monitoring from a remote computer (see below).

* [Running the monitoring service](#running-the-monitor-service)
* [Running a Stan program](#running-a-stan-program)
* [Opening the web app](#opening-the-web-app)
* [Enabling remote access](#enabling-remote-access)
* [Installing cmdstan and cmdstanpy](#installing-cmdstan-and-cmdstanpy)
* [Including and excluding parameters](#including-and-excluding-parameters)

[Miscellaneous screenshots](https://github.com/flatironinstitute/mcmc-monitor/wiki/Miscellaneous-screenshots)

### Quick Demo

To see MCMC-Monitor in action against sample data, follow this
[link to a demo version](https://flatironinstitute.github.io/mcmc-monitor/?s=https://lit-bayou-76056.herokuapp.com).

### Feedback welcome!

This tool is under active development. We welcome bug reports and feature requests--please feel free to submit
a [Github issue](https://github.com/flatironinstitute/mcmc-monitor/issues) if you spot a way MCMC Monitor can be improved.

## Running the monitor service

First, make sure you have a recent version of [NodeJS](https://nodejs.org/en/download/) installed. Our tests use version 16.
(`node` version 16.0.0 is considered the minimum supported version for the project.)

> Note: there is no need to clone this repo. You can use the npx command below.

Install node-pre-gyp globally:

```bash
# prerequisite
npm install -g @mapbox/node-pre-gyp
```

Start the monitor:

```bash
npx mcmc-monitor@latest start --dir /path/to/parent/output/directory/of/sampler --verbose
# The server will start listening for requests
# Keep this terminal open
# Open the web app linked above

# Optionally use the --enable-remote-access flag
```

The `--dir` flag tells `mcmc-monitor` which directory to monitor for output, and should correspond to the directory where
the sampler (e.g. Stan) writes its output files. The service expects each subdirectory of `--dir` to contain the output
CSV files from one execution of a sampler program (a "run"). These runs are the links displayed on the MCMC Monitor home page.

For example, suppose we run `mcmc-monitor` with `--dir /home/user/examples/`, and that this directory contains two
subdirectories, `multi-normal-1` and `multi-normal-2`, each containing the output of a Stan run (completed or
still in progress). Then the monitor home page will list two runs, linked as `multi-normal-1` and `multi-normal-2`.
If another process subsequently writes an analysis to `/home/user/examples/analysis-3`, then the monitor will
begin displaying a run called `analysis-3` as well.

Note that there is not currently a way to change the monitored directory while the monitor is running.
Some tools (such as `CmdStanPy` and `CmdStanR`) use `tmp` directories by default; in this case, you will need
to provide an `output_dir` argument for those packages which should match the path given to `mcmc-monitor`.

To enable remote access (i.e., access this monitor service from a different computer) follow the instructions in the section below.

### Note on `npx` and installation

Some users have experienced an issue in which the `npx mcmc-monitor@latest ...` command above is not successful. In
these cases, `npx` asks for permission to install the new version, and appears to install, but does not actually install or launch
`mcmc-monitor`. In this case, it may be necessary to install `mcmc-monitor` manually:

```bash
npm install mcmc-monitor@latest
```
After manually installing, invoking the program with `npx` as above should work. However, you will need to rerun the manual installation step
when new versions are released. Also note that installing a node package without the `-g` (global) flag will cause npm to create
a `node_modules` folder in the current working directory, so you may wish to create a specific subdirectory first if you don't
want this added to your home directory.


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

For the above examples, you should monitor the examples/example-output directory.

## Opening the web app

The web app is hosted [here](http://flatironinstitute.github.io/mcmc-monitor).

By default, the web app will attempt to connect to your monitoring service on port 61542 of localhost, but you can configure the GUI to point to other services, including remote services via our proxy server. See [enabling remote access](#enabling-remote-access).

## Enabling remote access

To allow remote computers to access your monitoring service, do the following

* Use the --enable-remote-access flag when starting the service.
* Follow the link printed in the console output.

**How does this work?** We provide a proxy server that allows remote machines to access your monitor service. In order to avoid excessive bandwidth usage on our server, the system establishes a WebRTC connection so that traffic flows directly between computers, bypassing our proxy. However, since it is not always possible to establish a WebRTC connection (due to firewall configurations), you may need to disable WebRTC by changing `webrtc=1` to `webrtc=0` in the query parameters of the URL. Note that in the case of `webrtc=0`, our proxy server may limit the amount of data that is served. Please try to keep `webrtc=1` whenever that is working. You can also [host your own proxy server](https://github.com/magland/connector-http-proxy).

## Installing cmdstan and cmdstanpy

To install cmdstan and cmdstanpy (within your conda environment):

```bash
conda install -c conda-forge cmdstan cmdstanpy
```

**Important**: You must reopen your terminal after running this install command, or reactivate the conda environment. This is necessary so that the $CMDSTAN environment variable is set properly.

For more information see the [cmdstanpy documentation](https://mc-stan.org/cmdstanpy/).

## Including and excluding parameters

By default, MCMC Monitor will not necessarily monitor all model parameters. It will always monitor system diagnostic variables (those ending in `__` such as `lp__`), scalar parameters, and vectors, matrices and tensors with up to 100 elements. By default, MCMC will not monitor variables with larger than 100 elements. You can override this by creating a `mcmc-run.yaml` file in the output directory for the run and then including the following content, for example:

```
# mcmc-run.yaml
includeVariables: [y.1, y.2, y.3]
```

This will force monitoring of the variables included.

## What is MCMC sampling?

[Markov Chain Monte Carlo](https://en.wikipedia.org/wiki/Markov_chain_Monte_Carlo) (MCMC) sampling is a method of sampling from a probability distribution, such as a posterior distribution, in order to approximate the distribution. This is accomplished by running a Markov Chain with the desired distribution as its equilibrium distribution. With each step of the Markov Chain, a sample is taken from the probability distribution. After a sufficient number of steps, the samples will approximate the desired distribution.

## What is Stan?

[Stan](https://mc-stan.org/) is a statistical software package designed for Bayesian inference. To use Stan, the user must first write a Stan program, which contains a probabilistic model specification and a set of data-generating parameters. The program is then compiled and run on the Stan platform, which uses MCMC sampling to generate posterior distributions for the parameters in the model. With the posterior distributions, the user can then make inferences about the data and make predictions.

## Why monitor a running Stan program?

Monitoring a running Stan program provides insight into the progress of the run and the results of the sampling. By tracking the progress of the MCMC sampling, it is possible to detect and diagnose problems with the program and observe whether the iterations are converging to the equilibrium distribution. Additionally, monitoring the results of the sampling allows the user to gain a better understanding of the posterior distributions, even before the program completes, which can inform decisions and predictions.

## License

Apache-2.0

## Authors

Jeremy Magland and Jeff Soules, Center for Computational Mathematics, Flatiron Institute

Thanks also to
* Brian Ward
* Bob Carpenter
