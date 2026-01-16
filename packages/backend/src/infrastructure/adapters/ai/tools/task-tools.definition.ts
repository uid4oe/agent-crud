import { SchemaType, Tool } from "@google/generative-ai";

export const taskToolsDefinition: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "listTasks",
        description: "List all tasks in the system, optionally filtered by status",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            status: {
              type: SchemaType.STRING,
              description: "Optional filter by status: pending, in_progress, or completed",
            },
          },
        },
      },
      {
        name: "getTaskById",
        description: "Get a specific task by its ID to view full details",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id: {
              type: SchemaType.STRING,
              description: "The UUID of the task to retrieve",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "searchTasks",
        description: "Search tasks by keyword in title or description",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: "Search term to find in task title or description",
            },
            status: {
              type: SchemaType.STRING,
              description: "Optional filter by status: pending, in_progress, or completed",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "getTaskStatistics",
        description: "Get statistics about tasks: total count, counts by status, recent activity",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: "createTask",
        description: "Create a new task",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            title: {
              type: SchemaType.STRING,
              description: "The title of the task",
            },
            description: {
              type: SchemaType.STRING,
              description: "Optional description of the task",
            },
            status: {
              type: SchemaType.STRING,
              description: "Status of the task: pending, in_progress, or completed",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "updateTask",
        description: "Update an existing task",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id: {
              type: SchemaType.STRING,
              description: "The UUID of the task to update",
            },
            title: {
              type: SchemaType.STRING,
              description: "New title for the task",
            },
            description: {
              type: SchemaType.STRING,
              description: "New description for the task",
            },
            status: {
              type: SchemaType.STRING,
              description: "New status: pending, in_progress, or completed",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "deleteTask",
        description: "Delete a task by ID",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            id: {
              type: SchemaType.STRING,
              description: "The UUID of the task to delete",
            },
          },
          required: ["id"],
        },
      },
    ],
  },
];
