#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourcesResultSchema,
  ListToolsRequestSchema,
  ResourceSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: "anki-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

type AnkiRequestResult<T> = {
  result: T;
  error: string;
};
/**
 * Make a request to the AnkiConnect API
 */
async function ankiRequest<T>(action: string, params: any = {}): Promise<T> {
  const response = await fetch("http://localhost:8765", {
    method: "POST",
    body: JSON.stringify({
      action,
      version: 6,
      params,
    }),
  });
  const { result } = (await response.json()) as AnkiRequestResult<T>;
  return result;
}

type DeckNamesToIds = Record<string, number>;

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const decks = await ankiRequest<DeckNamesToIds>("deckNamesAndIds");

  const deckResources = Object.entries(decks).map(([name, id]) => ({
    uri: `anki://decks/${id}`,
    name,
  }));

  return {
    resources: deckResources,
  };
});

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_decks",
        description: "List the decks available in the collection",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_models",
        description: "List the note model types available in the collection",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_note",
        description: "Create a note in a deck",
        inputSchema: {
          type: "object",
          properties: {
            deckName: {
              type: "string",
              description: "Name of the deck to add note to",
            },
            modelName: {
              type: "string",
              description: "Name of the note model/type to use",
            },
            fields: {
              type: "object",
              description: "Field values for the note model being used",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Tags to apply to the note",
            },
          },
          required: ["deckName", "modelName", "fields"],
        },
      },
    ],
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
