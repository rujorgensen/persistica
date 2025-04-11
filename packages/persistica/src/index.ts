#!/usr/bin/env bun
import { consola } from 'consola';
import { defineCommand, runMain } from 'citty';
import { readFileSync } from 'node:fs';
import { run } from './lib/core/run.js';

const data = readFileSync('./package.json', 'utf-8');
const opackage = JSON.parse(data);

consola.box(`Persistica v. ${opackage.version}`);

const main = defineCommand({
    meta: {
        name: 'Persistica',
        version: opackage.version,
        description: 'Persistica CLI',
    },
    args: {
        configuration: {
            type: 'string',
            description: 'Path of configuration file',
            required: true,
        },
    },
    async run({ args }) {

        const configurationPath = args.configuration;

        /*
        if (!await consola.prompt('Generate?', {
            type: 'confirm',
        })) {
            consola.error('Deployment cancelled');

            return;
        }
 */
        consola.start('Generating');

        run(configurationPath);

        consola.success('Project built!');
    },
});

runMain(main);

