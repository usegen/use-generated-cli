import { relations } from "./relations";
import { computedPropsDefs } from "./computed-props-defs";

const applyComputedPropsCurrentLevel = async (item, listOfComputedProps, prisma) => {
  const filteredVals = (listOfComputedProps || []).filter(i => !!i);

  console.time("for of");
  const compProps = {}
  for (const compProp of filteredVals) {
    if (!!compProp.name && !!compProp.func) {
      const val = await compProp.func(item, prisma)
      compProps[compProp.name] = val;
    }
  }

  return compProps;
};

export const applyComputetdPropsIteratively = async (listOfItems, rootModelName, prisma) => {
  return (listOfItems || []).filter(i => !!i).map(async (item) => {

    const posibleNestedFields = relations[rootModelName];
    const relationNamePresentInItem = Object.keys(item || {});
    const presetFields = (posibleNestedFields || []).filter(field => {
      return relationNamePresentInItem.indexOf(field.fieldName) !== -1;
    });



    const nestedRelations = {}
    for (const compProp of presetFields) {
      if (!!compProp.name && !!compProp.func) {
        const value = !!compProp.isList
          ? await applyComputetdPropsIteratively(item[compProp?.fieldName], compProp.modelName, prisma)
          : await applyComputetdPropsIteratively([item[compProp?.fieldName]], compProp.modelName, prisma)[0]
        nestedRelations[compProp.fieldName] = value;
      }
    }


    const listOfComputedPropsCurrentLevel = computedPropsDefs[rootModelName];
    const contObj = await applyComputedPropsCurrentLevel(item, listOfComputedPropsCurrentLevel, prisma);
    return {
      ...item,
      ...contObj,
      ...nestedRelations
    };
  });


};
