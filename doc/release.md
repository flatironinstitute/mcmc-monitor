# MCMC Monitor--Releasing a New Version

This documentation is intended for (and of interest mainly to) MCMC Monitor
developers with the ability to push production versions of MCMC Monitor.

To push a new release, follow these steps:

1. Ensure that the `protocolVersion` string has been updated if there
were any changes to the communication structure, protocol, or types.

2. Update the `service` version in `service/package.json` if any changes
have been made to the service.

3. Commit and push changes

4. Execute `yarn deploy` for the client, as per the
[deployment instructions](./deployment.md).

5. If any changes were made to the service, cd to the `service` directory,
then update the version of the service on NPM:
    - `$ npm login`
    - `$ export TAG=A.B.C # where A.B.C should match the version in package.json`
    - Manually enter the command in the "release" verb from `service/package.json`, i.e.:
    - `$ yarn build && yarn coverage && npm publish && git tag $TAG && git push --tags`

The last command builds and publishes the service and tags the deployed version
of the code in one serial set of operations.
