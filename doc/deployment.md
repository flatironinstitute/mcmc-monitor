# MCMC Monitor Deployment

As discussed in [the MCMC Monitor readme](../README.md), MCMC Monitor
consists of a **service** and a **client**.

As with many modern web applications, the MCMC client runs entirely in
the web browser. The browser downloads prepackaged Javascript code for the client
from a public website, and then the downloaded code handles all further
communication with the service (which usually runs on the same machine
that's running Stan).

The MCMC Monitor developers make the client code available for download
from the [Github Pages](https://pages.github.com/) page associated with
this repository, https://flatironinstitute.github.io/mcmc-monitor.
*Deploying* a new version of the client consists of packaging up the
Javascript code and making it available for download at that URL.

If you've
[forked](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
this repo, you can deploy your own version of the MCMC Monitor client
using the same scripts as the MCMC Monitor developers.
This might be useful as a way to test some changes you're thinking of
[contributing to the project](../CONTRIBUTING.md)
(which is highly encouraged!). While it is also possible to run
your own version of the client, we strongly recommend and humbly request
that you share with the broader community any extensions you have made.

Alternatively, it is probably easier to just run
the client locally. See our [developer documentation](./developing.md)
for more details on recommended workflow.


## Deployment

The project offers two deployment scripts, one for the production
version of the client and one for a development/testing/staging branch.
Configuration of the deployment verbs is handled in the `package.json`
of the client `src` directory, and the build process is managed
using [Vite](https://vitejs.dev/). As typical for github-pages-based
deployments, the deployment commands push the fully built pacakge into
the `gh-pages` branch of the repository's configured `origin` remote.


### To Dev Branch

Having a publicly-available `dev` or `staging` branch gives a broad
audience of end users a convenient want to test-drive changes and see how
their use cases would be impacted, before those changes become part
of the main production version of the code.

To do a dev deployment, execute the `dev-deploy` script as:
```bash
$ yarn dev-deploy
```

This will automatically build the current branch using the
`vite.dev-config.ts` configuration and push it into a `/dev` directory
on the repository, so it will be available at
`https://flatironinstitute.github.io/mcmc-monitor/dev`.


### To Production

To deploy to the production branch, execute:
```bash
$ yarn deploy
```

This will automatically execute the `build` script as well, using the
(default) `vite.config.ts` configuration. Additionally, the `build` script
can be executed by itself using `yarn build` to confirm that everything has
built correctly before attempting to deploy.
