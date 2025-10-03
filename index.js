import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import prompts from 'prompts';
import chalk from 'chalk';
import createLogger from './logger.js';
import config from './config.json' with { type: 'json' };
import { handleGitAction } from './git-handler.js';
import { resolveParams } from './utils/template-resolver.js';

// Initialize logger with settings from config
const logger = createLogger(config.settings);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure command-line arguments parser (yargs)
const argv = yargs(hideBin(process.argv))
  .option('tasks', {
    alias: 't',
    type: 'string',
    description: 'Run specific tasks by action (comma-separated)',
  })
  .option('yes', {
    alias: 'y',
    type: 'boolean',
    description: 'Skip the wizard and run all selected tasks automatically',
  })
  .argv;

/**
 * Selects which tasks to run based on config and CLI arguments.
 * @returns {Array} An array of task objects to be executed.
 */
function selectTasksToRun() {
  const enabledTasks = config.tasks.filter(task => task.enabled !== false);

  if (argv.tasks) {
    const selectedTaskActions = argv.tasks.split(',').map(t => t.trim());
    const selectedTasks = enabledTasks.filter(task => selectedTaskActions.includes(task.action));
    logger.info(`Running selected tasks: ${selectedTasks.map(t => t.action).join(', ')}`);
    return selectedTasks;
  }

  logger.info(`Running all enabled tasks in order: ${enabledTasks.map(t => t.action).join(', ')}`);
  return enabledTasks;
}

/**
 * Displays a confirmation prompt to the user for a given task.
 * @param {object} task - The task object.
 * @returns {Promise<boolean>} - True if the user confirms, false if they decline.
 */
async function runWizard(task) {
  const { action, description } = task;
  const message = description
    ? `Run task '${chalk.cyan(action)}' (${description})?`
    : `Run task '${chalk.cyan(action)}'?`;

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message,
    initial: true, // Default to "Yes"
  });

  if (typeof response.value === 'undefined') {
    logger.warn('Wizard cancelled by user. Exiting.');
    process.exit(0);
  }

  return response.value;
}

/**
 * Loads and runs a single task module.
 * This function now trusts the task's wrapper to handle its own logging and error details.
 * Its main job is to orchestrate the call and report back a simple success/failure status.
 * @param {object} task - The task object to execute (with resolved params).
 * @returns {Promise<boolean>} - True on success, false on failure.
 */
async function executeTask(task) {
  const { action, params } = task;
  const taskLogger = logger.child({ task: action });
  const taskPath = path.join(__dirname, 'tasks', action, 'index.js');

  try {
    await fs.access(taskPath);
  }
  catch {
    taskLogger.error(`Task directory or index.js not found at: ${taskPath}`);
    return false; // Indicate failure
  }

  try {
    const taskUrl = new URL(`file://${taskPath}`).href;
    const taskModule = await import(taskUrl);
    if (typeof taskModule.run !== 'function') {
      throw new Error('Task module must export an async function named "run".');
    }

    const context = {
      taskDir: path.dirname(taskPath), // The absolute path to the task's own directory
    };

    // Simply call the wrapped 'run' function.
    // It will handle its own start/success/error logs internally.
    await taskModule.run(params, config, taskLogger, context);

    return true; // If we got here without an error, it succeeded.
  }
  catch (error) {
    return false; // Indicate failure
  }
}

/**
 * Main function that orchestrates the entire task running process.
 */
async function main() {
  logger.info(`Starting Task Runner for project: "${config.project.name}"`);

  const tasksToRun = selectTasksToRun();

  if (tasksToRun.length === 0) {
    logger.warn('No tasks to run. Exiting.');
    return;
  }

  if (argv.yes) {
    logger.info('\'-y\' flag detected. Running in non-interactive mode.');
  }

  for (const task of tasksToRun) {
    const shouldRun = argv.yes || await runWizard(task);

    if (shouldRun) {
      // Resolve dynamic variables in the task's parameters before execution.
      const resolvedParams = resolveParams(task.params, config);
      const resolvedTask = { ...task, params: resolvedParams };

      const success = await executeTask(resolvedTask);

      // If a task fails, stop the entire process.
      if (!success) {
        logger.error('Stopping runner due to a failed task.');
        process.exit(1); // Exit with error
      }

      // Check if it has a git block.
      if (resolvedTask.git) {
        try {
          await handleGitAction(resolvedTask, config, logger);
        }
        catch (error) {
          logger.error(`Post-task Git operation failed: ${error.message}`);
          process.exit(1); // Stop the runner if git action fails
        }
      }
    }
    else {
      logger.warn(`Skipping task: '${task.action}' as requested by user.`);
    }
  }

  logger.info('Task runner finished.');
}

// Start the application
main();