import winston from 'winston';
import chalk from 'chalk';

// Custom console format with colors
const consoleFormat = winston.format.printf(({ level, message, timestamp, task }) => {

  const taskLabel = task ? `[${task}] ` : '';
  let levelLabel;

  switch (level) {
    case 'info':
      levelLabel = chalk.blue('INFO');
      break;
    case 'warn':
      levelLabel = chalk.yellow('WARN');
      break;
    case 'error':
      levelLabel = chalk.red('ERROR');
      break;
    case 'success':
      levelLabel = chalk.green('SUCCESS');
      break;
    default:
      levelLabel = level.toUpperCase();
  }

  return `${chalk.gray(timestamp)} ${levelLabel}: ${taskLabel}${message}`;
});

/**
 * Creates and configures a logger based on the provided settings.
 * @param {object} settings - Configuration object from config.json
 * @returns {winston.Logger}
 */
function createLogger(settings = {}) {
  const logFile = settings.logFile || 'runner.log';
  const logLevel = settings.logLevel || 'info';

  // Validate logLevel. If invalid, fallback to default.
  const validLevels = ['error', 'warn', 'info', 'success', 'debug'];
  const finalLogLevel = validLevels.includes(logLevel) ? logLevel : 'info';

  return winston.createLogger({
    // Logging levels, including a custom one
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      success: 3,
      debug: 4
    },

    // Minimum log level applied to all transports
    level: finalLogLevel,

    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json()
    ),
    transports: [
      // File transport
      new winston.transports.File({
        filename: logFile,
        level: 'debug'
      }),
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          consoleFormat
        ),
      }),
    ],
  });
}

export default createLogger;