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
import { resolveParams } from "./utils/template-resolver.js";

// Initialize logger with settings from config
const logger = createLogger(config.settings);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure command-line arguments parser (yargs)
const argv = yargs(hideBin(process.argv))
  .option('tasks', {
    alias: 't',
    type: 'string',
    description: 'Run specific tasks by ID (comma-separated)',
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
    const selectedTaskIds = argv.tasks.split(',').map(t => t.trim());
    const selectedTasks = enabledTasks.filter(task => selectedTaskIds.includes(task.id));
    logger.info(`Running selected tasks: ${selectedTasks.map(t => t.id).join(', ')}`);
    return selectedTasks;
  }

  logger.info(`Running all enabled tasks in order: ${enabledTasks.map(t => t.id).join(', ')}`);
  return enabledTasks;
}

/**
 * Displays a confirmation prompt to the user for a given task.
 * @param {object} task - The task object.
 * @returns {Promise<boolean>} - True if the user confirms, false if they decline.
 */
async function runWizard(task) {
  const { id, description } = task;
  const message = description
    ? `Run task '${chalk.cyan(id)}' (${description})?`
    : `Run task '${chalk.cyan(id)}'?`;

  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message,
    initial: true // Default to "Yes"
  });

  if (typeof response.value === 'undefined') {
    logger.warn('Wizard cancelled by user. Exiting.');
    process.exit(0);
  }

  return response.value;
}

/**
 * Executes a single task, including loading its module and handling errors.
 * @param {object} task - The task object to execute (with resolved params).
 * @returns {Promise<boolean>} - True on success, false on failure.
 */
async function executeTask(task) {
  const { id, description, params } = task;
  const taskLogger = logger.child({ task: id });
  const taskPath = path.join(__dirname, 'tasks', id, 'index.js');

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
      taskDir: path.dirname(taskPath) // The absolute path to the task's own directory
    };

    taskLogger.info(`Starting task execution... (${description || id})`);

    await taskModule.run(params, config, taskLogger, context);

    taskLogger.log('success', "Task completed successfully.");
    return true; // Indicate success
  }
  catch (error) {
    taskLogger.error("Task failed with an error:");
    taskLogger.error(error.stack || error.message);
    return false; // Indicate failure
  }
}

/**
 * Main function that orchestrates the task running process.
 */
async function main() {
  logger.info(`Starting Task Runner for project: "${config.project.name}"`);

  const tasksToRun = selectTasksToRun();

  if (tasksToRun.length === 0) {
    logger.warn("No tasks to run. Exiting.");
    return;
  }

  if (argv.yes) {
    logger.info("'-y' flag detected. Running in non-interactive mode.");
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
        logger.error("Stopping runner due to a failed task.");
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
      logger.warn(`Skipping task: '${task.id}' as requested by user.`);
    }
  }

  logger.info("Task runner finished.");
}

// Start the application
main();