import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import Server from './Server'

const main = () => {
    yargs(hideBin(process.argv))
        .command('start', 'Start the server', (yargs) => {
            return yargs
        }, (argv) => {
            const dir: string = argv.dir as string
            start({port: parseInt(process.env.PORT || "61542"), dir, verbose: argv.verbose ? true : false})
        })
        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: 'Run with verbose logging'
        })
        .option('dir', {
            type: 'string',
            description: 'Parent directory where the output files live'
        })
        .strictCommands()
        .demandCommand(1)
        .parse()
}

let server: Server
function start({port, dir, verbose}: {port: number, dir: string, verbose: boolean}) {
    server = new Server({port, dir, verbose})
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