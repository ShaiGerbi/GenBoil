import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Executes the 'git add' command.
 * @param {string|string[]} files - A single file or an array of files to add.
 * @param {string} workingDir - The directory to run the command in.
 * @param {winston.Logger} logger - The logger instance.
 */
async function gitAdd(files, workingDir, logger) {
  const filesToAdd = Array.isArray(files) ? files.join(' ') : files;
  const addCommand = `git add ${filesToAdd}`;
  logger.info(`Executing: ${addCommand}`);
  await execAsync(addCommand, { cwd: workingDir });
}

/**
 * Executes the 'git commit' command.
 * @param {string|boolean} commitMessageOrBool - The commit message or 'true'.
 * @param {object} task - The parent task object, used to get the description.
 * @param {string} workingDir - The directory to run the command in.
 * @param {winston.Logger} logger - The logger instance.
 */
async function gitCommit(commitMessageOrBool, task, workingDir, logger) {
  let commitMessage = commitMessageOrBool;

  if (commitMessageOrBool === true) {
    if (!task.description) {
      throw new Error("Cannot use 'commit: true' when the task has no description.");
    }
    commitMessage = task.description;
  }

  const sanitizedMessage = commitMessage.replace(/"/g, '\\"');
  const commitCommand = `git commit -m "${sanitizedMessage}"`;
  logger.info(`Executing: ${commitCommand}`);
  const { stdout } = await execAsync(commitCommand, { cwd: workingDir });
  if (stdout) logger.info(`Commit successful:\n${stdout}`);
}

/**
 * Executes the 'git push' command.
 * @param {string} workingDir - The directory to run the command in.
 * @param {winston.Logger} logger - The logger instance.
 */
async function gitPush(workingDir, logger) {
  const pushCommand = 'git push';
  logger.info(`Executing: ${pushCommand}`);
  const { stdout, stderr } = await execAsync(pushCommand, { cwd: workingDir });
  if (stdout) logger.info(stdout);
  if (stderr) logger.info(stderr);
}

/**
 * Handles the git actions associated with a task by orchestrating helper functions.
 * @param {object} task - The full parent task object, which contains the git config.
 * @param {object} globalConfig - The global project configuration.
 * @param {winston.Logger} logger - A logger instance.
 */
export async function handleGitAction(task, globalConfig, logger) {
  // Get the git configuration directly from the task object.
  const gitConfig = task.git;
  if (!gitConfig) return; // Defensive check, although index.js already checks this.

  const { add, commit, push } = gitConfig;
  const workingDir = path.resolve(globalConfig.project.basePath);
  
  const gitLogger = logger.child({ git: true });
  gitLogger.info('Starting post-task Git actions...');

  try {
    if (add) {
      await gitAdd(add, workingDir, gitLogger);
    }
    if (commit) {
      await gitCommit(commit, task, workingDir, gitLogger);
    }
    if (push) {
      await gitPush(workingDir, gitLogger);
    }
  }
  catch (error) {
    logger.error('A Git command failed:');
    logger.error(`STDOUT: ${error.stdout || 'N/A'}`);
    logger.error(`STDERR: ${error.stderr || 'N/A'}`);
    throw new Error(`Git operation failed. See logs for details.`);
  }

  gitLogger.log('success', 'Git actions completed successfully.');
}