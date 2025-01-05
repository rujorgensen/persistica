#! /usr/bin/env bun

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { run } from './lib/core/run';

console.log('Persistica: generating');

yargs(hideBin(process.argv))
    .command(
        'generate <note>',
        'Creates a new Note',
        (yargs: any) => {
            run('/home/rj/posium/persistica/biograf/.persistica');

            return yargs.positional('persistica', {
                description: 'The content of the note',
                type: 'string',
            });
        },
        (argv: any) => console.log(argv.note)
    )
    .parse();

// px prisma generate --schema=./prisma/tap/schema.prisma
