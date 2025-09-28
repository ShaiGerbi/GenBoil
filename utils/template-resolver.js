/**
 * Looks up a nested property in an object using a string path.
 * @param {object} obj - The object to search within.
 * @param {string} path - The string path (e.g., 'project.name').
 * @returns {*} The found value, or undefined if not found.
 */
function lookupProperty(obj, path) {
  return path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
}

/**
 * Recursively resolves placeholder variables (e.g., ${project.version}) in any given data structure.
 * @param {*} data - The value to process (can be a string, object, or array).
 * @param {object} config - The full config object to use as the data source.
 * @returns {*} The data with placeholders replaced by their actual values.
 */
export function resolveParams(data, config) {
  if (typeof data === 'string') {
    // Use a regular expression to find all instances of ${...}
    return data.replace(/\$\{(.+?)\}/g, (match, key) => {
      const value = lookupProperty(config, key.trim());
      // Return the found value, or the original placeholder if the value is not found.
      return value !== undefined ? value : match;
    });
  }

  if (Array.isArray(data)) {
    // If it's an array, recursively process each item.
    return data.map(item => resolveParams(item, config));
  }

  if (data && typeof data === 'object') {
    // If it's an object, recursively process each value.
    const newObj = {};
    for (const key in data) {
      newObj[key] = resolveParams(data[key], config);
    }
    return newObj;
  }

  // If it's not a string, array, or object, return the value as is.
  return data;
}