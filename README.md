[English](README.md) ｜ [עברית](README.he.md)

---

# Modular Task Runner in Node.js

A flexible and powerful command-line interface (CLI) tool for automating repetitive tasks in development workflows. The tool allows you to define, manage, and run a sequence of actions (such as creating files, executing commands, and performing Git operations) using a central, simple, and readable JSON configuration file.

The tool is built with an emphasis on modularity, extensibility, and a user-friendly experience, including an interactive wizard for controlled execution.

## Key Features

*   **Modular Architecture:** Each task is a self-contained "black box" in its own directory, bundling its own logic and assets.
*   **Declarative Configuration (`config.json`):** Define *what* you want to happen, and the runner takes care of *how*. It's easy to read and maintain.
*   **Interactive Wizard:** Run tasks step-by-step and confirm each action, or skip the wizard for a fully automated run.
*   **Dynamic Placeholders:** Use values from the configuration file (like the project name) to generate dynamic paths and content.
*   **Built-in Git Integration:** Automatically perform `add`, `commit`, and `push` operations after any task succeeds.
*   **Simple Extensibility:** Adding new capabilities is as simple as copying an example, making minor adjustments, and updating the configuration file.
*   **Detailed Logging:** Colorful console logs and file-based logging for analysis and documentation.

## Project Structure

```
/
├── index.js              # The main script that runs the process
├── config.json           # The central configuration file - where everything is defined
├── logger.js             # Logger (Winston) settings
├── git-handler.js        # Dedicated module for handling Git operations
├── package.json          # Project dependencies
│
├── tasks/                # Contains all tasks for the project
│   └── <action-name>/
│       ├── index.js      # The task's logic
│       └── (assets...)   # Additional files the task needs (templates, images, etc.)
│
├── examples/             # A collection of ready-to-use examples for common tasks
│
└── utils/                # Shared utilities, like the template resolver
    └── template-resolver.js
```

## Installation and Initial Setup

### Prerequisites

The only prerequisite for running the tool is to have Node.js installed:

*   **Node.js:** `^20.19.0`

### Installation Steps

1.  **Clone the Project:**
    ```bash
    git clone https://github.com/ShaiGerbi/GenBoil
    cd GenBoil
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure `config.json`:**
    This is the most important step. Open the `config.json` file and adapt it to your project. Here is a basic example to get you started:
    ```json
    {
      "project": {
        "name": "MyAwesomeApp",
        "description": "An awesome application",
        "basePath": "C:/Projects/MyAwesomeApp",
        "version": "1.0.0"
      },
      "settings": {
        "logLevel": "info",
        "logFile": "./runner.log"
      },
      "tasks": [
        {
          "action": "create-readme",
          "description": "Creates an initial README file",
          "enabled": true,
          "params": {
            "destFile": "./README.md",
            "content": "# ${project.name}\n\n${project.description}"
          },
          "git": {
            "add": ["./README.md"],
            "commit": "Initial commit: Create README.md",
            "push": false
          }
        }
      ]
    }
    ```

## How to Use

### Interactive Run (with Wizard)

The recommended way for manual execution. The tool will prompt you for confirmation before running each task.
```bash
node index.js
# Or, the shorthand version
npm start
```
**Example output:**
`? Run task 'create-readme' (Creates an initial README file)? › (Y/n)`

### Automated Run (Headless)

Perfect for use in scripts or CI/CD pipelines. Use the `--yes` or `-y` flag.
```bash
node index.js --yes
```

### Running Specific Tasks

You can run a subset of the tasks defined in the config file by using the `--tasks` or `-t` flag, with a comma-separated list of action names.
```bash
# Run a single task
node index.js --tasks=create-readme

# Run multiple tasks
node index.js --tasks=create-readme,build-project
```

## The `config.json` File

The configuration file is divided into three main sections:

### 1. `project`
An object containing general information about your project. You can use these values as dynamic placeholders throughout the rest of the file.
*   `name`: The project's name.
*   `basePath`: The base path of your project. **All relative paths within tasks will be resolved relative to this path.**
*   `version`: The project's version.

### 2. `settings`
Internal settings for the runner itself.

*   `logLevel`: Determines the verbosity of logs displayed in the console. Setting a level will display all messages at that level and above (more severe).
    The available levels, from most verbose to most severe, are:
    *   `debug`: All information, including detailed messages for debugging.
    *   `success`: Special success messages (e.g., for successful task completion).
    *   `info`: (Default) General information about the process flow and task execution.
    *   `warn`: Warnings about potential issues that did not stop the execution.
    *   `error`: Only critical errors that stopped the runner or require attention.
*   `logFile`: The path to the log file that will be created.

### 3. `tasks`
An array of objects, where each object represents a task to be executed. **The order in the array determines the order of execution.**

**Task Object Structure:**
*   `action` (Required, string): The name of the action to perform. This must match the task's folder name in the `/tasks` directory.
*   `description` (Optional, string): A human-readable description shown in the wizard.
*   `enabled` (Optional, boolean): Set to `false` to temporarily skip this task. If omitted, the task is considered enabled (`true`).
*   `params` (Required, object): An object containing the specific parameters that the task needs to function.
*   `git` (Optional, object): Defines Git operations to be executed **after the task has completed successfully**.

## Advanced Capabilities

### Dynamic Placeholders
You can use any value from the `config` object as a dynamic placeholder within strings. Use the syntax `${path.to.value}`.
The runner will automatically replace the placeholders with their corresponding values before executing the task.

**Example:**
The string `"./src/${project.name}/main.js"` will become `"./src/MyAwesomeApp/main.js"`.

### Automated Git Actions
Adding a `git` object to a task will trigger controlled Git operations after that task succeeds.

**`git` Object Structure:**
*   `add` (Optional, string or array): A single path or a list of paths to be added (`git add`).
*   `commit` (Optional, string or boolean):
    *   **As a string:** The commit message to be used (`git commit -m "..."`).
    *   **As `true`:** **Smart commit!** Uses the task's `description` field as the commit message.
*   `push` (Optional, boolean): If `true`, will execute `git push` after the commit.

## How to Add a New Task

The easiest way to add a new task is by using the provided examples from the `/examples` directory.

1.  **Choose an Example:** Browse the `/examples` directory and find the example file that best fits your needs (e.g., `create-file.js`).

2.  **Create a Folder and Copy:** Create a new folder inside your `/tasks` directory and give it a descriptive name that represents the action (e.g., `create-main-activity`). Then, copy your chosen example file into this new folder.

3.  **Rename the File:** Inside the new folder, **rename the copied example file to `index.js`**. This is a critical step.

4.  **(Optional) Add Assets:** If your task requires template files or other assets, place them inside the task folder you just created.

5.  **Update `config.json`:** Add a new task object to the `tasks` array. Use the folder name you created as the value for the `action` key, and configure the necessary parameters.

6.  **Run!** The tool will now recognize your new task and include it in the process.