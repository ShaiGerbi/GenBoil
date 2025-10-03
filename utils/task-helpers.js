import path from 'path';
import { validateParams } from './validator.js';

/**
 * A higher-order function that creates a standard task runner function.
 * @param {object} options - The configuration for the task creator.
 * @param {object[]} [options.paramRules] - An array of validation rule objects.
 * @param {Function} options.action - The core logic of the task. This function will receive
 *   ({ params, config, logger, context }) and should contain the unique task operations.
 * @returns {Function} An async function that conforms to the runner's `run` signature.
 */
export function createTask({ paramRules = [], action }) {
  // This is the function that will be exported from the task's index.js
  return async function run(params, config, logger, context) {
    // Start Log
    logger.info('Task execution started.');

    try {
      // Parameter Validation (now delegated)
      validateParams(params, paramRules);

      // Common global validations
      if (!config.project || !config.project.basePath) {
        throw new Error('Missing \'project.basePath\' in config.json.');
      }

      // Execute the Core Action
      await action({ params, config, logger, context });

      // Success Log
      logger.log('success', 'Task action completed successfully.');
    }
    catch (error) {
      // Centralized error logging
      logger.error(`Task action failed: ${error.message}`);
      // Re-throw the error so the main runner in index.js can catch it and stop.
      throw error;
    }
  };
}

/**
 * A helper to resolve a path from the project's base path.
 * A common operation in many tasks.
 * @param {string} relativePath - The path from the params or config.
 * @param {object} config - The global config object.
 * @returns {string} The resolved absolute path.
 */
export function resolveProjectPath(relativePath, config) {
  return path.resolve(config.project.basePath, relativePath);
}