import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Server from './Server'

const main = () => {
    yargs(hideBin(process.argv))
        .command('start', 'Start monitoring', (yargs) => {
            return yargs
        }, (argv) => {
            const dir: string = argv.dir as string
            start({port: parseInt(process.env.PORT || "61542"), dir, verbose: argv.verbose ? true : false, enable_remote_access: argv.enable_remote_access ? true : false})
        })
        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: 'Run with verbose logging'
        })
        .option('dir', {
            type: 'string',
            description: 'Parent directory where the output subdirectory lives'
        })
        .option('enable-remote-access', {
            type: 'boolean',
            description: 'Enable remote access'
        })
        .strictCommands()
        .demandCommand(1)
        .parse()
}

let server: Server
function start({port, dir, verbose, enable_remote_access}: {port: number, dir: string, verbose: boolean, enable_remote_access: boolean}) {
    server = new Server({port, dir, verbose, enableRemoteAccess: enable_remote_access})
    server.start()
}

process.on('SIGINT', function() {
    if (server) {
        console.info('Stopping server.')
        server.stop().then(() => {
            console.info('Exiting.')
            process.exit()
        })
    }
})

main()