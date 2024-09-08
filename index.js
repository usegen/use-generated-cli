#!/usr/bin/env node

/**
 * use-generated
 * Use 'init' arg for initial setup or 'api' to regenerate the API after models or appconfig.json has changed
 *
 * @author usegenerated <usegenerated.com>
 */
const { execSync } = require('child_process');
const init = require('./utils/init');
const cli = require('./utils/cli');
const log = require('./utils/log');

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;
const path = require('path');
(async () => {
	init({ clear });


	const isInit = input[0] ==='init'
	const isGenerating = input[0] ==='api'
	if (isInit) {
		const filePath = path.join(__dirname, './src/initConfigFolder.js');
		execSync(`node ${filePath}`)
	} 
	if (isGenerating) {
		execSync(`tsc ./src/computed-props/computed-props-defs.ts`)
	
		const filePath = path.join(__dirname, './src/createApi.js');
		execSync(`node ${filePath}`)
	} 
	input.includes(`help`) && cli.showHelp(0);

	debug && log(flags);
})();
