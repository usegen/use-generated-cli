const fs = require('fs-extra')
const { execSync } = require('child_process');
const { StringUtility } = require("generate-template-files");
const path = require('path');
const pluralize = require('pluralize')
const { computedPropsDefs } = require(process.cwd()+'/src/computed-props/computed-props-defs.js');

const removeDuplicatesByModelName = (accum, current) => {
  const listOfModelNames = accum.map(relation => relation?.modelName)
  if (listOfModelNames.indexOf(current?.modelName) !== -1) {
    return [...accum]
  }
  return [...accum, current]
}


const userandRoleModel = `
model User {
  id        Int       @id @default(autoincrement())
  email       String      @unique
  passwordHash String      
  resetToken  String?  @unique
  roles       UserRole[]
}

enum UserRole {
  AuthenticatedUser
  Admin
  SuperAdmin
}
`
const getModuleNameForModelName = (modules, modelName) => {
  const moduleConfig = modules.filter(modu => {
    const modelsNamesInThisModule = (modu?.models || []).map(model => model.name)
    return modelsNamesInThisModule.indexOf(modelName) !== -1
  })[0]
  return moduleConfig?.name
}


const removeNestedArgs = (resolverTemplate) => {
  // rm import 
  const temp1 = resolverTemplate.replace(`import { _modelname_(pascalCase)NestedArgsStartPoint } from './_modelname_(kebabCase).nested-args-types';`, '')
  // rm find one 
  const temp2 = temp1.replace(`@Args({name:'nestedArgs', nullable: true}) nestedArgs: _modelname_(pascalCase)NestedArgsStartPoint`, '')
  const temp3 = temp2.replace(`@Args({name:'nestedArgs', nullable: true}) nestedArgs: _modelname_(pascalCase)NestedArgsStartPoint`, '')
  const temp4 = temp3.replaceAll('nestedArgs', '{}')

  return temp4
}

const randomStringForAvoindingCollisions = 'dffkhsdhfdsqew2adaasKUGHDFHSGFDJDS'
function addOptionalModules(config) {
  fs.copy(path.join(__dirname, './code-for-copy/generated-utils/'), './src/generated-utils/')
    .then(() => console.log('success!'))
    .catch(err => console.error(err));

  const computedPropsFolderExist = fs.existsSync('./src/computed-props/')
  if (!computedPropsFolderExist) {
    fs.copySync(path.join(__dirname, './code-for-copy/computed-props/'), './src/computed-props/')
  }
  // replace with actual relations from the relations from file

  const relations = JSON.parse(fs.readFileSync("./use-generated-config/relations.json", 'utf8'))
  const textFOrRelationsObj = `
  export const relations =  ${JSON.stringify(relations, null, 2)}
  `
  fs.writeFileSync(
    './src/computed-props/relations.ts',
    textFOrRelationsObj,
    { flag: 'w' });




  if (!!config.createPrismaModule) {
    try {
      fs.rmSync('./src/prisma/', { recursive: true, force: true });
    } catch (e) {
      // console.log('service doesnt exist')
    }
    fs.copy(path.join(__dirname, './code-for-copy/prisma/'), './src/prisma/')
      .then(() => console.log('success!'))
      .catch(err => console.error(err));
  }
  if (!!config.createAuthModule) {
    try {
      fs.rmSync('./src/auth/', { recursive: true, force: true });
    } catch (e) {
      // console.log('service doesnt exist')
    }
    const appModule = fs.readFileSync("./src/app.module.ts").toString();
    const shouldAddAUthImport = appModule.indexOf(`import { AuthModule } from './auth/auth.module';`) === -1
    if (shouldAddAUthImport) {
      execSync(`nest g mo auth `)
    }

    const prismaSchema = fs.readFileSync("./prisma/schema.prisma").toString();
    const shouldAddUserModelInPrismaSchema = prismaSchema.indexOf(`model User`) === -1
    if (shouldAddUserModelInPrismaSchema) {

      fs.writeFileSync(
        "./prisma/schema.prisma",
        userandRoleModel,
        { flag: 'a' });

    }


    fs.copy(path.join(__dirname, './code-for-copy/auth/'), './src/auth/')
      .then(() => console.log('success!'))
      .catch(err => console.error(err));
  }
  if (!!config.createMailTemplates) {
    try {
      fs.rmSync('./mailtemplates/', { recursive: true, force: true });
    } catch (e) {
      // console.log('service doesnt exist')
    }
    fs.copy(path.join(__dirname, './code-for-copy/mailtemplates/'), './mailtemplates/')
      .then(() => console.log('success!'))
      .catch(err => console.error(err));
  }
  if (!!config.createCommonTypes) {
    try {
      fs.rmSync('./src/custom-type/', { recursive: true, force: true });
    } catch (e) {
      // console.log('service doesnt exist')
    }
    fs.copy(path.join(__dirname, './code-for-copy/custom-types/'), './src/custom-types/')
      .then(() => console.log('success!'))
      .catch(err => console.error(err));
  }
}



function replaceCases(templateText, modelNamePascalCase) {
  const modelNameKebabCase = StringUtility.toSentence(modelNamePascalCase, "-")
  const modelNameCamelCase = modelNamePascalCase.charAt(0).toLowerCase() + modelNamePascalCase.slice(1)
  const modelNamePascalCasePluralized = pluralize(modelNamePascalCase)
  const template0 = templateText.replaceAll('_modelname_(pascalCase)s', modelNamePascalCasePluralized)
  const template1 = template0.replaceAll('_modelname_(pascalCase)', modelNamePascalCase)
  const template2 = template1.replaceAll('_modelname_(kebabCase)', modelNameKebabCase)
  const template3 = template2.replaceAll('_modelname_(camelCase)', modelNameCamelCase)

  return template3;
}


function generateEditableFilesIfNonExistent(module, model) {
  const modelNameKebabCase = StringUtility.toSentence(model.name, "-")
  const resolverPath = `./src/${module.name}/${modelNameKebabCase}/${modelNameKebabCase}.resolver.ts`
  const resolverExist = fs.existsSync(resolverPath)
  const servicePath = `./src/${module.name}/${modelNameKebabCase}/${modelNameKebabCase}.service.ts`
  const serviceExist = fs.existsSync(servicePath);

  if (!resolverExist) {
    // used just for adding the imports  in the module
    execSync(`nest g r ${module.name}/${modelNameKebabCase} `)
    const resolverTemplate = fs.readFileSync("./use-generated-config/templates/customizable-resolver.hbs").toString();
    fs.writeFileSync(
      resolverPath,
      replaceCases(resolverTemplate, model.name),
      { flag: 'w' });
  }
  if (!serviceExist) {
    execSync(`nest g s ${module.name}/${modelNameKebabCase} `)
    const serviceTemplate = fs.readFileSync("./use-generated-config/templates/customizable-service.hbs").toString();
    fs.writeFileSync(
      servicePath,
      replaceCases(serviceTemplate, model.name),
      { flag: 'w' });
  }


}


function createIncludePropForStructure(queryDepthStructure, parents = [], topParent = null, relations = {}) {
  const converted = {};

  for (const [key, value] of Object.entries(queryDepthStructure)) {
    if (typeof value === 'object') {
      // TODO here get if is list 
      const allrelationsField = (relations[topParent] || []).filter(f => f.fieldName === key)
      const filedInRelations = allrelationsField[0] || {}

      fs.writeFileSync(
        `./debug.json`,
        `topParent: ${topParent}--` + JSON.stringify(filedInRelations),
        { flag: 'a' });

      // based on top parent Name get if is list
      const { isList, modelName } = filedInRelations;

      if (isList) {
        const inclPropNested = createIncludePropForStructure(value, [...parents, key], modelName, relations)
        const inclProp = !!Object.keys(inclPropNested).length
          ? {
            include: inclPropNested
          }
          : {}
        converted[key] = {
          ...inclProp,
          [`${randomStringForAvoindingCollisions}`]: `...convertPageAndPerPageToTakeAndSkip(nestedArgs?.${[...parents, key].toString().replaceAll(',', '?.')}?.args)`
        };
      } else {
        const inclPropNested = createIncludePropForStructure(value, [...parents, key], modelName, relations)

        converted[key] = !!Object.keys(inclPropNested).length
          ? {
            include: inclPropNested
          }
          : true

      }
    } else {

      converted[key] = value;
    }
  }
  return converted;
}


function getStructureForLevel(relations, modelName, depthLevel) {
  if (depthLevel <= 0) {
    return {};
  }

  const obj = {};
  const fields = relations[modelName] || [];
  for (const field of fields) {
    obj[field.fieldName] = getStructureForLevel(relations, field.modelName, depthLevel - 1);
  }
  return obj;
}


function createIncludePropForDepthLevel(queryDepthLevel, modelName, moduleName) {
  const relations = JSON.parse(fs.readFileSync("./use-generated-config/relations.json", 'utf8'))
  const queryDepthStructure = getStructureForLevel(relations, modelName, queryDepthLevel)
  return createIncludePropForStructure(queryDepthStructure, [], modelName, relations)
}


function parseNestedIncludes(depthLayers) {
  const nestedINcludes = JSON.stringify(depthLayers, null, 2)
    .replaceAll(`"`, '').replaceAll(`${randomStringForAvoindingCollisions}:`, '')
  if (!!Object.keys(nestedINcludes).length) {
    return nestedINcludes
  }
  return null
}

function generateNestedArgsInputTypes(depthLayers, relations, initialModelName) {

  let mainTemplate = "";
  let indexNames = {}
  let importsTemplate = `import {  
    InputType, Field
  } from '@nestjs/graphql';`
  let baseArgsTempl = ''
  
  function generateInputType(modelName, depthLayers, isList = false, isFirstTime = false) {
    let recursiveTemplate = ""

    const fields = relations[modelName] || [];



    const isRootLevel = (modelName === initialModelName) && isFirstTime
    const hasNestedFieldsThatAreList = !!depthLayers && JSON.stringify(depthLayers).indexOf('convertPageAndPerPageToTakeAndSkip') !== -1

    if (hasNestedFieldsThatAreList || (!isRootLevel)) {
      const indexName = !!indexNames[`${modelName}`]
        ? indexNames[`${modelName}`][indexNames[`${modelName}`].length - 1]
        : 11188888

      recursiveTemplate += `\n@InputType()\n`;
      recursiveTemplate += `export class ${modelName}NestedArgs${isRootLevel ? 'StartPoint' : `${indexName}For${initialModelName}`} {\n`;


      if (!isRootLevel && isList) {
        recursiveTemplate += `  @Field(() => ${modelName}ArgsFor${initialModelName}, {nullable:true})\n`;
        recursiveTemplate += `  args: ${modelName}ArgsFor${initialModelName}\n`;
        // create the args at the top level


        const baseArgsDefinedAlready = baseArgsTempl.indexOf(`class ${modelName}ArgsFor${initialModelName}`) !== -1
        if (!baseArgsDefinedAlready) {
          baseArgsTempl += `\n@InputType()\n`;
          baseArgsTempl += `class ${modelName}ArgsFor${initialModelName} {\n`;
          baseArgsTempl += `  @Field(() => Number, {nullable:true})\n`;
          baseArgsTempl += `  page: number\n`;
          baseArgsTempl += `  @Field(() => Number, {nullable:true})\n`;
          baseArgsTempl += `  perPage: number\n`;
          baseArgsTempl += `  @Field(() => ${modelName}OrderByWithRelationInput, {nullable:true})\n`;
          baseArgsTempl += `  orderBy: ${modelName}OrderByWithRelationInput\n`;
          baseArgsTempl += `  @Field(() => ${modelName}WhereInput, {nullable:true})\n`;
          baseArgsTempl += `  where: ${modelName}WhereInput\n`;
          baseArgsTempl += "}\n";

          // create the args at the top level end
          const modelNameKebabCase = StringUtility.toSentence(modelName, "-")
          importsTemplate += `
import {
  ${modelName}OrderByWithRelationInput,
  ${modelName}WhereInput
} from 'src/@generated/${modelNameKebabCase}';`
        }
      }


      for (const field of fields) {
        const fieldName = field.fieldName;
        const fieldModelName = field.modelName;


        const isListOrHasNestedArgs = !!depthLayers && !!depthLayers[fieldName]
          && (field?.isList ||
         JSON.stringify(depthLayers[fieldName]?.include || {})
          .indexOf('convertPageAndPerPageToTakeAndSkip') !== -1)
        // && !!Object.keys(depthLayers[fieldName].include || {}).length

          
        if (isListOrHasNestedArgs) {
          let index
          if (!indexNames[`${fieldModelName}`]) {
            indexNames[`${fieldModelName}`] = [0]
            index = 0
          } else {

            index = indexNames[`${fieldModelName}`][indexNames[`${fieldModelName}`].length - 1] + 1
            indexNames[`${fieldModelName}`].push(index)
          }



          // if (initialModelName === 'BatchRecord' && fieldModelName == 'BatchRecord') {
          //   // {"fieldName":"sentToBatch","modelName":"BatchRecord","isList":false}
          //   // {"include":{"doneByUser":true,"previous":true,"next":true,"batch":true,"receivedFromLot":true,"receivedFromSubbatch":true,"receivedFromBatch":true,"sentToSubbatch":true,"sentToBatch":true,"sentToLot":true}}
          //   fs.writeFileSync(
          //     `./deb.txt`,
          //     JSON.stringify(depthLayers[fieldName]),
          //     { flag: 'w' })
          // }



          recursiveTemplate += `  @Field(() => ${fieldModelName}NestedArgs${index}For${initialModelName}, {nullable:true})\n`;
          recursiveTemplate += `  ${fieldName}: ${fieldModelName}NestedArgs${index}For${initialModelName}\n`;

          generateInputType(fieldModelName, depthLayers[fieldName].include, field?.isList)

        }

      }

      recursiveTemplate += "}\n";
      mainTemplate = mainTemplate + recursiveTemplate

    }
  }
  generateInputType(initialModelName, depthLayers, false, true);

  return importsTemplate + baseArgsTempl + mainTemplate;
}

function replaceAuthConfigs(resolverTemplate, model, defaultRequireLogin) {
  const addModelLevelRequireLogin = model.requireLogin === undefined
    ? !!defaultRequireLogin
    : model.requireLogin === true
  // go ahead and replace with required login or empty string 
  let afterModelLevelRequired = resolverTemplate
  const rolesDefinedAtModelLevel = !!model.requiredRoles && Array.isArray(model?.requiredRoles) && model?.requiredRoles?.length

  if (rolesDefinedAtModelLevel) {
    const rolesDecorator = `@Roles(${"'" + model?.requiredRoles.join("','") + "'"})`
    afterModelLevelRequired = resolverTemplate.replaceAll(
      '__model_authPlaceholder__',
      `${rolesDecorator}
@UseGuards(GqlAuthGuard,RolesGuard)`)
  } else {
    afterModelLevelRequired = resolverTemplate.replaceAll(
      '__model_authPlaceholder__',
      addModelLevelRequireLogin ? '@UseGuards(GqlAuthGuard)' : '')
  }

  let afterMethodLevel = afterModelLevelRequired;

  ['update', 'delete', 'updateMany', 'create', 'findAll', 'countAll', 'findOne'].forEach((methodName) => {
    let methodAuthDecorators = ''
    const rolesDefinedAtMethodLevel = !!model?.requiredRoles && !!model?.requiredRoles[methodName] && Array.isArray(model?.requiredRoles[methodName]) && model?.requiredRoles[methodName]?.length
    if (!rolesDefinedAtModelLevel && rolesDefinedAtMethodLevel) {
      const rolesDecorator = `@Roles(${"'" + model?.requiredRoles[methodName].join("','") + "'"})`
      // does this worl to have the roles guard at this level or shoudl it be just at the model level?
      methodAuthDecorators = addModelLevelRequireLogin ? rolesDecorator : `${rolesDecorator}\n@UseGuards(GqlAuthGuard,RolesGuard)`
    }

    if (!rolesDefinedAtModelLevel && !rolesDefinedAtMethodLevel) {
      const requireLoginAtMethodLevel = (model.requireLogin || []).indexOf(methodName) > -1
      if (requireLoginAtMethodLevel) {
        methodAuthDecorators = '@UseGuards(GqlAuthGuard)'
      }
    }

    afterMethodLevel = afterMethodLevel.replaceAll(
      `__${methodName}_authPlaceholder__`,
      methodAuthDecorators
    )
  })



  return afterMethodLevel
}


function generateNonEditableFiles(module, model, config) {
  const { defaultQueryDepthLevel, defaultRequireLogin, modules } = config
  const modelNameKebabCase = StringUtility.toSentence(model.name, "-")
  try {
    fs.mkdirSync(`./src/${module.name}/${modelNameKebabCase}/generated`)
  } catch (e) {
    // console.log('resolver doesn't exist')
  }



  const queryDepthLevel = defaultQueryDepthLevel || model.queryDepthLevel
  const relations = JSON.parse(fs.readFileSync("./use-generated-config/relations.json", 'utf8'))
  const depthLayers = !!model.queryDepthStructure
    ? createIncludePropForStructure(model.queryDepthStructure, [], model.name, relations)
    : createIncludePropForDepthLevel(queryDepthLevel, model.name, module.name)





  // depth layers are wrong: ot includes the same arges where is not list
  const hasNestedFieldsThatAreList = !!depthLayers && JSON.stringify(depthLayers).indexOf('convertPageAndPerPageToTakeAndSkip') !== -1
  if (hasNestedFieldsThatAreList) {
    fs.writeFileSync(
      `./src/${module.name}/${modelNameKebabCase}/generated/${modelNameKebabCase}.nested-args-types.ts`,
      generateNestedArgsInputTypes(depthLayers, relations, model.name),
      { flag: 'w' });
  }

  // service
  const serviceTemplate = fs.readFileSync("./use-generated-config/templates/service1.hbs").toString();
  const serviceWithDynamicContent = serviceTemplate.replace(
    'const getInclude = () => {}',
    `const getInclude = (nestedArgs) => { 
return ${parseNestedIncludes(depthLayers)}
}`)


  fs.writeFileSync(
    `./src/${module.name}/${modelNameKebabCase}/generated/${modelNameKebabCase}.generated-service.ts`,
    replaceCases(serviceWithDynamicContent, model.name),
    { flag: 'w' });

  // resolver
  const resolverTemplate = fs.readFileSync("./use-generated-config/templates/resolver1.hbs").toString();
  const afterNestedArgs = hasNestedFieldsThatAreList ? resolverTemplate : removeNestedArgs(resolverTemplate)
  const fileContent = replaceAuthConfigs(afterNestedArgs, model, defaultRequireLogin)
  fs.writeFileSync(
    `./src/${module.name}/${modelNameKebabCase}/generated/${modelNameKebabCase}.generated-resolver.ts`,
    replaceCases(fileContent, model.name),
    { flag: 'w' });




  const customTypePath = `./src/${module.name}/${modelNameKebabCase}/generated/${modelNameKebabCase}.custom-types.ts`

  const customTypeTemplate = fs.readFileSync("./use-generated-config/templates/custom-type1.hbs").toString();


  // add again all the relations on this object using the custom types
  const withTheModelName = replaceCases(customTypeTemplate, model.name)





  const relationsWithExtended = (relations[model.name] || []).map(relation => {
    const { fieldName, modelName, isList } = relation;
    if (isList) {
      return `@Field(() => [Extended${modelName}], {nullable:true})
  ${fieldName}?: Array<Extended${modelName}>; `
    } else {
      return `@Field(() => Extended${modelName}, {nullable:true})
  ${fieldName}?: Extended${modelName} | null;`
    }
  }).join(`
  `)

  // todo stick the array with a nl
  const withTheRelations = withTheModelName.replace('_(relations_here)_', relationsWithExtended)






  // look at the config to import from correct folder
  const relationsImports = (relations[model.name] || [])
    .filter(relation => relation?.modelName != model.name)
    .reduce(removeDuplicatesByModelName, [])
    .map(relation => {
      const { modelName } = relation;

      const moduleName = getModuleNameForModelName(modules, modelName);

      if (!!moduleName) {
        return `import { Extended${modelName} } from 'src/${moduleName}/${StringUtility.toSentence(modelName, "-")}/generated/${StringUtility.toSentence(modelName, "-")}.custom-types';`
      } else {
        // generate   the unexposed custom types !!!!!
      }
    }).join(`
`)

  const withTheRelationsImports = withTheRelations.replace('_(relations__imports_here)_', relationsImports)



  const computedPropsForCurrentObject = computedPropsDefs[model.name]

  const computedPropertiesFieldsTypes = (computedPropsForCurrentObject || []).map(computedField => {
    const { type, name } = computedField
    return `
  @Field(() => ${type}, {nullable:true})
  ${name}?:  ${type}; `
  }).join(`
  
`)
  // todo look at computed properties 

  const withComputedProps = withTheRelationsImports.replace('_(computedProps)_', computedPropertiesFieldsTypes)

  fs.writeFileSync(
    customTypePath,
    withComputedProps,
    { flag: 'w' });

}


function generateModule(module) {
  const moduleTemplate = fs.readFileSync(`./src/${module.name}/${module.name}.module.ts`).toString();
  if (moduleTemplate.indexOf('import { PrismaModule }') === -1) {
    const moduleTemplateWithPrismaImport = moduleTemplate.replace(`import { Module } from '@nestjs/common';`,
      `import { Module } from '@nestjs/common';
  import { PrismaModule } from 'src/prisma/prisma.module';`)
    const moduleTemplateWithPrismaImport2 = moduleTemplateWithPrismaImport.replace('@Module({})', '@Module({imports:[PrismaModule]})')

    fs.writeFileSync(
      `./src/${module.name}/${module.name}.module.ts`,
      moduleTemplateWithPrismaImport2)
  }

}

function removeDuplicateImports(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const uniqueImports = new Set();
    const result = [];
    for (let line of lines) {
      if (line.startsWith('import')) {
        if (!uniqueImports.has(line.trim())) {
          uniqueImports.add(line.trim());
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }
    const cleanedContent = result.join('\n');
    fs.writeFileSync(filePath, cleanedContent, 'utf-8');
    console.log(`Duplicates removed and file saved: ${filePath}`);
  } catch (error) {
    console.error('Error while processing the file:', error);
  }
}

function createApi() {
  const filePath = path.join(__dirname, './generateRelationsFromModels.js');
  execSync(`node "${filePath}"`)
  const config = JSON.parse(fs.readFileSync("./use-generated-config/appconfig.json", 'utf8'))

  addOptionalModules(config);

  for (const module of config.modules) {
    if(fs.existsSync(`./src/${module.name}/${module.name}.module.ts`)){
      fs.unlinkSync(`./src/${module.name}/${module.name}.module.ts`)
    }
    execSync(`nest g mo ${module.name} `)
    generateModule(module)
    for (const model of module.models) {

      generateEditableFilesIfNonExistent(module, model)
      generateNonEditableFiles(module, model, config)
    }
  }
  removeDuplicateImports('./src/app.module.ts');
}

createApi()