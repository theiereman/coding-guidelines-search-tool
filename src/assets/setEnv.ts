/* tslint:disable */
// @ts-nocheck

//https://betterprogramming.pub/how-to-secure-angular-environment-variables-for-use-in-github-actions-39c07587d590

const { writeFile, existsSync, mkdirSync } = require('fs');
require('dotenv').config();

function writeFileUsingFS(targetPath, environmentFileContent) {
  writeFile(targetPath, environmentFileContent, function (err) {
    if (err) {
      console.log(err);
    }
    if (environmentFileContent !== '') {
      console.log(`wrote variables to ${targetPath}`);
    }
  });
}

// Providing path to the `environments` directory
const envDirectory = './src/environments';

// creates the `environments` directory if it does not exist
if (!existsSync(envDirectory)) {
  mkdirSync(envDirectory);
}

// choose the correct targetPath based on the environment chosen
const targetPath = './src/environments/environment.ts';
//creates the `environment.ts` file if it does not exist
writeFileUsingFS(targetPath, '');

//actual content to be compiled dynamically and pasted into respective environment files
const environmentFileContent = `
// This file was autogenerated by dynamically running setEnv.ts and using dotenv for managing API key secrecy
export const environment = {
    clientId: '${process.env.CLIENT_ID}',
    tenantId: '${process.env.TENANT_ID}'
};
`;

writeFileUsingFS(targetPath, environmentFileContent); // appending data into the target file
/* tslint:enable */