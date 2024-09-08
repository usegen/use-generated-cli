
const fs = require('fs');

// Read the schema.prisma file
const schema = fs.readFileSync('./prisma/schema.prisma', 'utf8');
// Parse the schema file into an array of lines
const lines = schema.split('\n');

// Initialize an empty object to store the relations
const relations = {};

const models = schema.match(/(?<=model\s).+?(?=\s{)/g);
console.log(models)
let model
// Iterate over each line in the schema
lines.forEach((line) => {
  // Check if the line contains the model keyword
  if (line.startsWith('model')) {
    const fields = line.split(' ');

    // Get the name of the model
    model = fields[1];
    relations[model] = [];
  } else {
    const lineValues = line.split(' ').filter(str => str !== '')
    const secondStringInline = (lineValues[1] || '').replace('[]','').replace('?','')

    if (models.indexOf(secondStringInline) !== -1) { 
      // Add the relation field and type to the model's array of relations
      if (!!relations[model]) {
        const isList = lineValues[1].indexOf('[]') > -1
        const fieldName = lineValues[0]

        relations[model].push({ fieldName,modelName:secondStringInline, isList });
      }
    }
  }
  
});

// Write the relations object to a JSON file
fs.writeFileSync('./use-generated-config/relations.json', JSON.stringify(relations, null, 2));

console.log('Relations JSON file generated successfully');