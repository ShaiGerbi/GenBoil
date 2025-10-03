/**
 * Validates task parameters against a set of declarative rules.
 * Throws an error if any validation rule fails.
 *
 * @param {object} params - The parameters object to validate (from config.json).
 * @param {object[]} rules - An array of validation rule objects defined in the task.
 */
export function validateParams(params, rules = []) {
  for (const rule of rules) {

    if (rule.allOf) {
      // Rule: All parameters in the list must exist.
      for (const param of rule.allOf) {
        if (params[param] === undefined) {
          const defaultMessage = `Missing required parameter: '${param}'.`;
          throw new Error(rule.errorMessage || defaultMessage);
        }
      }
    }

    if (rule.oneOf) {
      // Rule: At least one of the parameters in the list must exist.
      const found = rule.oneOf.some(param => params[param] !== undefined);
      if (!found) {
        const defaultMessage = `You must provide at least one of these parameters: ${rule.oneOf.join(', ')}.`;
        throw new Error(rule.errorMessage || defaultMessage);
      }
    }

    if (rule.exclusive) {
      // Rule: No more than one of the parameters in the list can exist at the same time.
      const foundParams = rule.exclusive.filter(param => params[param] !== undefined);
      if (foundParams.length > 1) {
        const defaultMessage = `Parameters ${rule.exclusive.join(', ')} are mutually exclusive. Please provide only one.`;
        throw new Error(rule.errorMessage || defaultMessage);
      }
    }

    if (rule.exactlyOneOf) {
      // Rule: Exactly one of the parameters in the list must exist.
      const foundParams = rule.exactlyOneOf.filter(param => params[param] !== undefined);
      if (foundParams.length !== 1) {
        const defaultMessage = `You must provide exactly one of the following parameters: ${rule.exactlyOneOf.join(', ')}.`;
        throw new Error(rule.errorMessage || defaultMessage);
      }
    }

    if (rule.enum) {
      // Rule: A specific parameter's value must be one of the values from a predefined list.
      const { param, allowed } = rule.enum;
      if (params[param] !== undefined && !allowed.includes(params[param])) {
        const defaultMessage = `Parameter '${param}' must be one of the following: ${allowed.join(', ')}.`;
        throw new Error(rule.errorMessage || defaultMessage);
      }
    }

    if (rule.requires) {
      // Rule: If parameter 'if' exists, then parameter 'then' must also exist.
      const { if: ifParam, then: thenParam } = rule.requires;
      if (params[ifParam] !== undefined && params[thenParam] === undefined) {
        const defaultMessage = `Parameter '${thenParam}' is required when '${ifParam}' is provided.`;
        throw new Error(rule.errorMessage || defaultMessage);
      }
    }

    if (rule.pattern) {
      // Rule: A specific parameter's string value must match a regular expression.
      const { param, regex } = rule.pattern;
      if (params[param] !== undefined && !(new RegExp(regex)).test(params[param])) {
        const defaultMessage = `Parameter '${param}' does not match the required pattern.`;
        throw new Error(rule.errorMessage || defaultMessage);
      }
    }

  }
}