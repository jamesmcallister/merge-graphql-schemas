import validateSchema from './validate_schema';

const mergeTypes = (types) => {
  const sliceDefaultTypes = operation =>
    types.map((type) => {
      const regexp = new RegExp(`type ${operation} {(.*?)}`, 'gim');
      const extractedType = type.replace(/(\s)+/gim, ' ').match(regexp);
      if (extractedType != null && extractedType.length > 0) {
        const startIndex = extractedType[0].indexOf('{') + 1;
        const endIndex = extractedType[0].indexOf('}') - 1;
        return extractedType[0].slice(startIndex, endIndex);
      }
      return '';
    }).join(' ');

  const inputTypeRegEx = /input ([\s\S]*?) {/g;
  const enumTypeRegEx = /enum ([\s\S]*?) {/g;
  const scalarTypeRegEx = /scalar ([\s\S]*?).*/gim;
  const customTypeRegEx = /type (?!Query)(?!Mutation)(?!Subscription)([\s\S]*?) {/g;

  const sliceTypes = (regexp, scalar = false) => {
    const extractedMatches = [];
    types.forEach((type) => {
      const matches = type.match(regexp);
      if (matches !== null) {
        matches.forEach((match) => {
          if (scalar) {
            extractedMatches.push(match);
          } else {
            const startIndex = type.indexOf(match);
            const endIndex = type.indexOf('}', startIndex);
            extractedMatches.push(type.slice(startIndex, endIndex + 1));
          }
        });
      }
    });
    return extractedMatches;
  };

  const inputTypes = sliceTypes(inputTypeRegEx).filter(Boolean);
  const enumTypes = sliceTypes(enumTypeRegEx).filter(Boolean);
  const scalarTypes = sliceTypes(scalarTypeRegEx, true).filter(Boolean);
  const customTypes = sliceTypes(customTypeRegEx).filter(Boolean);
  const queryTypes = sliceDefaultTypes('Query');
  const mutationTypes = sliceDefaultTypes('Mutation');
  const subscriptionTypes = sliceDefaultTypes('Subscription');

  const cleanupForComparison = string => string.replace(/(\s)+/gim, '');

  const queryInterpolation = `type Query {
    ${queryTypes}
  }`;
  const mutationInterpolation = `type Mutation {
    ${mutationTypes}
  }`;
  const subscriptionInterpolation = `type Subscription {
    ${subscriptionTypes}
  }`;
  const schema = `
    schema {
      query: Query
      ${cleanupForComparison(mutationTypes) !== '' ? 'mutation: Mutation' : ''}
      ${cleanupForComparison(subscriptionTypes) !== '' ? 'subscription: Subscription' : ''}
    }

    ${cleanupForComparison(queryTypes) !== '' ? queryInterpolation : ''}

    ${cleanupForComparison(mutationTypes) !== '' ? mutationInterpolation : ''}

    ${cleanupForComparison(subscriptionTypes) !== '' ? subscriptionInterpolation : ''}
  `;

  let mergedTypes = [];
  const allTypes = [inputTypes, enumTypes, scalarTypes, customTypes];
  allTypes.forEach((t) => {
    if (t.length !== 0) { mergedTypes = mergedTypes.concat(t); }
  });

  validateSchema(schema, mergedTypes);

  return [schema, ...mergedTypes];
};

export default mergeTypes;
