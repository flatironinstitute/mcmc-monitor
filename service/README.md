# mcmc-monitor service

Run this server on the machine that contains the MCMC output files.

## Prerequisites

[A recent version of nodejs](https://nodejs.dev/en/learn/how-to-install-nodejs/)

## Running the local server

You do **not** need to clone this repo. Just run:

```bash
npx mcmc-monitor@latest start --dir /path/to/parent/output/directory
# The server will start listening for requests
# Keep this terminal open
```