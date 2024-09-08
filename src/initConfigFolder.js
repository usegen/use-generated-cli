const fs = require('fs-extra')
const path = require('path');


function initConfigFolder() {
  const configFolderExist = fs.existsSync('./use-generated-config/')
 
  if (!configFolderExist) {
  fs.copy(path.join(__dirname,'./code-for-copy/use-generated-config/'), './use-generated-config/')
    .then(() => console.log('success!'))
    .catch(err => console.error(err));
  }
  const prismaFolderExists = fs.existsSync('./prisma/')
  
  if(!prismaFolderExists) {
    fs.copy(path.join(__dirname,'./code-for-copy/prisma-init/'), './prisma/')
    .then(() => console.log('success!'))
    .catch(err => console.error(err));
  }
  const computedFolderExists = fs.existsSync('./src/computed-props/')
  
  if(!computedFolderExists) {
    fs.copy(path.join(__dirname,'./code-for-copy/computed-props/'), './src/computed-props/')
    .then(() => console.log('success!'))
    .catch(err => console.error(err));
  }
  const initialAppModuleContents = fs.readFileSync(path.join(__dirname,'./code-for-copy/app.module.ts')).toString();
  fs.writeFileSync(
    "./src/app.module.ts",
    initialAppModuleContents,
    { flag: 'w' });

}

initConfigFolder()