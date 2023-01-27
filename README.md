# MCMC Monitor

This web-browser app enables you to track and visualize MCMC processes that have been executed with [Stan](https://mc-stan.org/).

How it works:

1. Run a server on your local computer that monitors an output directory.
2. Connect to the web app to monitor the output of Stan runs.
3. Run Stan, configuring it to write to subdirectories of the the output directory.

The web app is hosted [here](http://magland.github.io/mcmc-monitor).

## Running the local server

Make sure you have a recent version of [NodeJS](https://nodejs.org/en/download/) installed.

You do **not** need to clone this repo. Just run:

```bash
npx mcmc-monitor@latest start --dir /path/to/parent/output/directory
# The server will start listening for requests
# Keep this terminal open
# Open the web app linked above
```