#!/usr/bin/env node

import * as yargs from 'yargs';
import * as path from 'path';
import * as fs from 'fs';
import {generate} from './index';

const argv = yargs
    .usage('$0 [options] <csv-file>')
    .option('s', {
        alias: 'export-source',
        describe: 'Export plantuml source',
        type: 'boolean',
        default: false
    })
    .option('example', {
        describe: 'Create an example csv file in current directory',
        type: 'boolean',
        global: true,
        default: false
    })
    .version()
    .help()
    .argv;


if (argv.example) {
    fs.createReadStream(path.resolve(__dirname, '../example/example.csv'))
        .pipe(fs.createWriteStream('example.csv'));
    console.log('Example.csv is created in current directory');
} else {
    if (argv._.length != 1) {
        yargs.showHelp();
        process.exit(1);
    }

    generate({
        input: path.parse(path.resolve(argv._[0])),
        exportSrc: argv.s
    });
}

