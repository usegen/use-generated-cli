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
const fs = require('fs');

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;
const path = require('path');
(async () => {
	init({ clear });


	let isInit = input[0] ==='init'
	const isGenerating = input[0] ==='api'
	const isCreate = input[0] ==='new'
	if (isCreate) {
		const projectName = input[1];
        if (!projectName) {
            console.error("Please provide a project name.");
            process.exit(1);
        }

        try {
            //Create the Nest project
            execSync(`npx @nestjs/cli new ${projectName} -p npm`, { stdio: 'inherit' });
            //Read the example.json from the root of the tool
            const exampleFilePath = path.join(__dirname, 'package_sample_for_project_root.json');
            const exampleJson = JSON.parse(fs.readFileSync(exampleFilePath, 'utf-8'));
            //Read the package.json from the newly created NestJS project
            const projectPackageJsonPath = path.join(process.cwd(), projectName, 'package.json');
            //Write the updated package.json back to the project
            fs.writeFileSync(projectPackageJsonPath, JSON.stringify(exampleJson, null, 2), 'utf-8');
            console.log('package_sample_for_project_root.json contents merged into package.json successfully.');

			isInit = true;
			//Change to the new project directory
			process.chdir(projectName);
			
        } catch (error) {
            console.error('Error executing command:', error.message);
        }
	}
	if (isInit) {
		const filePath = path.join(__dirname, './src/initConfigFolder.js');
		execSync(`node "${filePath}"`)
	} 
	if (isGenerating) {
		execSync(`tsc ./src/computed-props/computed-props-defs.ts`)
	
		const filePath = path.join(__dirname, './src/createApi.js');
		execSync(`node "${filePath}"`)
	} 
	input.includes(`help`) && cli.showHelp(0);

	debug && log(flags);
})();
