# How to Develop on MCMC Monitor

As an open source project, particularly one in a field
with considerable prior art and interacting with a
broad community of users with diverse existing needs
and use cases, MCMC Monitor welcomes contributions.
Our [contributions policy](../CONTRIBUTING.md)
describes the mechanics and standards of contributing,
while this document offers practical advice on how to
develop MCMC Monitor.

## Code organization and components

This repository contains both parts of MCMC Monitor: the client,
which runs in the web browser and provides the UI and visualizations,
and the service, which parses the CSV data files from the
MCMC runs and serves it to the client(s).

Basic project structure is as follows:

- `src/` -- client code
  - `src/components/` -- front-end code
  - `src/MCMCMonitorDataManager/` -- code for managing interactions with service & the client-side data cache
  - `src/pages/` -- top-level UI layouts
- `service/` -- everything related to the service package
  - `service/src/` -- main service code directory. Directly contains communication/protocol code and file parsing code
    - `service/src/types/` -- all shared types for the application--including those shared by the client--should reside here

This outline is an overview and does not list caches, config files, or administrative files.

If you are developing on the client side, you'll mainly be
interested in the `src` directory; if you're working on the service,
the contents of interest are in the `service/` directory.

## Testing

This project uses [vitest](https://vitest.dev/) as a testing environment, which integrates nicely with the rest
of the `vite` tooling and has good support for ESM modules. Tests are located in the `test/` directory at
the top level of the project and should be laid out to match the corresponding source code files.

To run tests for the project, execute `yarn test` from project root. This will drop the terminal into a
continuous (hot-reloading) test environment that will rerun affected tests as files change. Alternatively,
`yarn coverage` will execute existing tests and then exit. (Despite the name, both commands will generate test
coverage reports in the `coverage/` top-level directory). Coverage reports are configured to work nicely with
the VSCode coverage-gutters plugin.

## Running changes locally

Access to MCMC Monitor is through a URL of the form:

`https://CLIENT_LOCATION?s=SERVICE_LOCATION`

When you launch the service, a URL of this form is shown on the screen, for instance:

`https://flatironinstitute.github.io/mcmc-monitor?s=https://mcmc-monitor-proxy.herokuapp.com/s/5e088817c361db5a2a98&webrtc=1`

In this case, the `flatironinstitute.github.io/mcmc-monitor` section refers to the
current production version of the client (as hosted on GitHub Pages) and the part after
the `?s=` query string (`https://mcmc-monitor-proxy.herokuapp.com/s/5e088817c361db5a2a98&webrtc=1`)
tells the client where to find a running service instance. (The `&webrtc=1` in the query string
also tells the client that it can use the [Web Realtime Communication](https://webrtc.org/) protocol
to connect to the service.)

During development, you will run one or both of these services locally. To access
your local version, you will need to replace one or both of the parts of this URL with your
local server's location. If you are working on the client, you'll use
replace the first part; if you're working on the service, you'll replace the second part;
and if you're working on both, you'll need to replace both.

### Setup

Before running, you'll need to obtain the code and install dependencies.

- Clone the repository
  - e.g. `git clone git@github.com:flatironinstitute/mcmc-monitor.git`
  - These instructions assume you've cloned the repo into `~/src/mcmc-monitor`
- Install client dependencies
  - `cd ~/src/mcmc-monitor` (or wherever you cloned the repo)
  - `yarn install` to install client dependencies
- Install service dependencies
  - `cd ~/src/mcmc-monitor/service`
  - `yarn install` to install dev dependencies
- Generate sample data
  - `cd ~/src/mcmc-monitor/examples`
  - If it is not yet installed, you will need to install [pystan](https://pystan.readthedocs.io/en/latest/)
  - Run one of the `test_*.py` scripts, which will generate sample data
  - Ensure the sample data is located in `~/src/mcmc-monitor/examples/example-output/` (This is the directory
  that's hard-coded in the delivered script that runs the service in dev mode. If you use a different directory,
  you'll need to edit `~/src/mcmc-monitor/service/package.json`.)

### Client

The project is set up to deliver the client-side code through [vite](https://vitejs.dev/).
To run the vite server locally, ensure you are in the top level of the cloned repository
(`~/src/mcmc-monitor`) and execute `yarn dev`. (This invokes the `dev` command defined in the
`~/src/mcmc-monitor/package.json` file.)

Leave this window open and note the "Local" url displayed (most likely `http://localhost:5173/mcmc-monitor`).
To use your local version of the client, use this address in place of the
`https://flatironinstitute.github.io/mcmc-monitor` part of an existing URL.

### Service

The service can also be run locally:

- `cd ~/src/mcmc-monitor/service` (Note that this is the `service` directory)
- `yarn dev` to invoke the script from `~/src/mcmc-monitor/service/package.json`
  - This script is set up to use [nodemon](https://www.npmjs.com/package/nodemon), 
  a simple live-update wrapper for Node applications, so it should automatically reload
  and recompile when you save new changes.

Caveats:
- The configured `yarn dev` script will look for CSV files to parse in the
  `~/src/mcmc-monitor/examples/example-output` directory, so you should ensure any data
  you want to test on is written there.
- Just like in production mode, the dev mode service will display a URL to access it.
However, the service is not aware of whether you are running the client locally, so it
will always print URLs referring to the published client version
(`https://flatironinstitute.github.io/mcmc-monitor...`). This is fine if you are only
developing on the service, but if you have made client-side changes as well, you will
need to manually edit the URL to refer to the client version being served locally
(resulting in something like `http://localhost:5713/mcmc-monitor?s=http://localhost:61542`).

## Recommended Tooling

Running both client and service require [nodejs](https://nodejs.org/en/) version 16+. Other
dependencies will be pulled in automatically by the [yarn package manager](https://yarnpkg.com/).

Scripts to generate example data require [python](https://www.python.org/) (version at least 3.8+).

Current developers prefer to use [VSCode](https://code.visualstudio.com/) as an IDE.
