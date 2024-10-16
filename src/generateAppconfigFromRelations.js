const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
// Path to the relations.json file
const filePath = path.join(__dirname, './generateRelationsFromModels.js');
execSync(`node "${filePath}"`)
const relationsPath = path.join('./use-generated-config/relations.json');

// Function to generate the desired JSON structure
function generateModulesFromRelations(relationsFilePath) {
  // Read and parse the relations.json file
  const relations = JSON.parse(fs.readFileSync(relationsFilePath, 'utf-8'));

  // Initialize the modules array
  const modules = [];

  // Iterate through the relations object
  for (const modelName in relations) {
    if (relations.hasOwnProperty(modelName)) {
      // Create the module entry
      const moduleEntry = {
        name: modelName.toLowerCase() + 's', // Pluralize the module name (simple pluralization)
        models: [
          {
            name: modelName,
            queryDepthLevel: 2 // Assuming queryDepthLevel is always 2 as per the example
          }
        ]
      };

      // Add the module entry to the modules array
      modules.push(moduleEntry);
    }
  }

  // Return the generated output
  return { modules };
}

// Function to save the output JSON to a file
function saveOutputToFile(output, outputPath) {
const appconfig = {
    "defaultRequireLogin": true,
    "createAuthModule": true,
    "defaultQueryDepthLevel": 2,
    "modules": output.modules,
    "createPrismaModule": true,
    "createCommonTypes": true,
    "createMailTemplates": true
  }
  fs.unlinkSync(outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(appconfig, null, 2), 'utf-8');
  console.log(`Output saved to ${outputPath}`);
}

// Run the script
const output = generateModulesFromRelations(relationsPath);

// Save the output JSON to a file
saveOutputToFile(output, `./use-generated-config/appconfig.json`);
