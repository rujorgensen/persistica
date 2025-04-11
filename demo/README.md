Todo Schema with Persistica

Run:
    -   `persistica --configuration=./demo/schema/todo.persistica`
    -   `bun demo`

This project defines a Todo schema using Persistica. The schema leverages SQLite for data storage and includes a Todo model with essential fields to manage tasks. It also demonstrates how to configure generators, datasources, and custom stores in your preferred format.
Overview

    Generator Configuration:
    The generator is configured to create a client named todo and outputs the generated files to the ./dist/persistica directory.

    Datasource Configuration:
    Uses SQLite as the provider, with the database file specified via an environment variable (file:todo.db).

    Store Configuration:
    A Configuration store is included to manage application settings such as the API key, root folder, and an automatically updated timestamp.

    Todo Model:
    The Todo model contains:
        id: Primary identifier.
        title: Title of the task.
        description: Optional task description.
        isCompleted: Boolean flag to mark task completion (defaults to false).
        priority: Task priority using the TodoPriority enum (defaults to MEDIUM).
        dueDate: Optional due date.
        createdAt: Timestamp of when the task was created.
        updatedAt: Timestamp that automatically updates on modifications.

    Enum Definition:
    TodoPriority enum defines three levels: LOW, MEDIUM, and HIGH.

Getting Started
Prerequisites

    Ensure you have Persistica installed.
    Node.js (if applicable to your workflow).
    SQLite installed or available as part of your environment.

Installation

    Clone the Repository:

git clone https://github.com/yourusername/todo-schema.git
cd todo-schema

Configure Environment Variables:

Make sure to set the environment variable for your SQLite database. For example, create a .env file with:

file:todo.db=./path/to/todo.db

Install Dependencies:

If your project uses any Node.js dependencies or Persistica-specific packages, install them via:

    bun install

Generating the Client

Run the Persistica generator to create the client based on the schema:

persistica generate

The generated client files will be located in the ./dist/persistica directory.
Usage

    CRUD Operations:
    Use the generated client to interact with the Todo model in your application. The client will expose methods for creating, reading, updating, and deleting Todo entries.

    Configuration:
    Adjust the schema or environment settings as needed. For further customization, refer to the Persistica documentation.

Schema Details
Todo Model

    id:             Unique identifier for each todo.
    title:          A brief title for the todo.
    description:    An optional detailed description.
    isCompleted:    A flag indicating whether the todo has been completed (default: false).
    priority:       The task's priority, set to MEDIUM by default.
    dueAt:          Optional due date for the task.
    createdAt:      Automatically set timestamp when a task is created.
    updatedAt:      Automatically updates on task modifications.

TodoPriority Enum

    LOW: Low priority tasks.
    MEDIUM: Medium priority tasks.
    HIGH: High priority tasks.

Contributing

Contributions are welcome! If you have suggestions or improvements, please fork the repository and submit a pull request. For major changes, open an issue first to discuss what you would like to change.
License

This project is licensed under the MIT License. See the LICENSE file for more details.
