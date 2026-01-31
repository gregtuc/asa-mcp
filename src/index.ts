#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { AppleAdsClient, createClientFromEnv } from "./client.js";

// Import tool definitions and handlers
import {
  campaignToolDefinitions,
  handleCreateCampaign,
  handleGetCampaigns,
  handleFindCampaigns,
  handleUpdateCampaign,
  handleDeleteCampaign,
  createCampaignSchema,
  getCampaignsSchema,
  findCampaignsSchema,
  updateCampaignSchema,
  deleteCampaignSchema,
} from "./tools/campaigns.js";

import {
  adGroupToolDefinitions,
  handleCreateAdGroup,
  handleGetAdGroups,
  handleFindAdGroups,
  handleUpdateAdGroup,
  handleDeleteAdGroup,
  createAdGroupSchema,
  getAdGroupsSchema,
  findAdGroupsSchema,
  updateAdGroupSchema,
  deleteAdGroupSchema,
} from "./tools/adgroups.js";

import {
  keywordToolDefinitions,
  handleCreateTargetingKeywords,
  handleGetTargetingKeywords,
  handleFindTargetingKeywords,
  handleUpdateTargetingKeywords,
  handleCreateCampaignNegativeKeywords,
  handleGetCampaignNegativeKeywords,
  handleUpdateCampaignNegativeKeywords,
  handleDeleteCampaignNegativeKeywords,
  handleCreateAdGroupNegativeKeywords,
  handleGetAdGroupNegativeKeywords,
  handleUpdateAdGroupNegativeKeywords,
  handleDeleteAdGroupNegativeKeywords,
  createTargetingKeywordsSchema,
  getTargetingKeywordsSchema,
  findTargetingKeywordsSchema,
  updateTargetingKeywordsSchema,
  createCampaignNegativeKeywordsSchema,
  getCampaignNegativeKeywordsSchema,
  updateCampaignNegativeKeywordsSchema,
  deleteCampaignNegativeKeywordsSchema,
  createAdGroupNegativeKeywordsSchema,
  getAdGroupNegativeKeywordsSchema,
  updateAdGroupNegativeKeywordsSchema,
  deleteAdGroupNegativeKeywordsSchema,
} from "./tools/keywords.js";

import {
  reportToolDefinitions,
  handleGetCampaignReports,
  handleGetAdGroupReports,
  handleGetKeywordReports,
  handleGetSearchTermReports,
  getCampaignReportsSchema,
  getAdGroupReportsSchema,
  getKeywordReportsSchema,
  getSearchTermReportsSchema,
} from "./tools/reports.js";

// ============================================
// Account & Discovery Tool Definitions
// ============================================

const accountToolDefinitions = [
  {
    name: "get_user_acl",
    description: "Get organizations and roles the API has access to. Use this to find your orgId and verify permissions.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "search_apps",
    description: "Search for iOS apps to promote. Returns adamId needed for creating campaigns.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "App name or part of name to search" },
        limit: { type: "number", description: "Max results to return" },
        returnOwnedApps: { type: "boolean", description: "Only return apps owned by your account" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_geo",
    description: "Search for targetable geographic locations (countries, states/regions, cities) for ad group targeting.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Location name to search" },
        entity: { 
          type: "string", 
          enum: ["Country", "AdminArea", "Locality"],
          description: "Type of location (Country, AdminArea=state, Locality=city)" 
        },
        countryCode: { type: "string", description: "Filter by country code (e.g., 'US')" },
        limit: { type: "number", description: "Max results" },
      },
      required: ["query"],
    },
  },
];

// ============================================
// All Tool Definitions
// ============================================

const allToolDefinitions = [
  ...accountToolDefinitions,
  ...campaignToolDefinitions,
  ...adGroupToolDefinitions,
  ...keywordToolDefinitions,
  ...reportToolDefinitions,
];

// ============================================
// Main Server
// ============================================

async function main() {
  let client: AppleAdsClient | null = null;
  
  // Try to create client from environment variables
  // If config is missing, tools will return helpful error messages
  try {
    client = createClientFromEnv();
  } catch (error) {
    // Client will be created lazily when tools are called
    console.error("Note: Apple Ads credentials not fully configured. Set environment variables to use tools.");
  }
  
  const server = new Server(
    {
      name: "apple-search-ads-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allToolDefinitions,
    };
  });
  
  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    // Ensure client is available
    if (!client) {
      try {
        client = createClientFromEnv();
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Apple Ads credentials not configured. Please set the following environment variables:\n` +
                `- APPLE_ADS_CLIENT_ID\n` +
                `- APPLE_ADS_TEAM_ID\n` +
                `- APPLE_ADS_KEY_ID\n` +
                `- APPLE_ADS_PRIVATE_KEY_PATH\n` +
                `- APPLE_ADS_ORG_ID`,
            },
          ],
        };
      }
    }
    
    try {
      let result: string;
      
      switch (name) {
        // Account & Discovery
        case "get_user_acl":
          result = JSON.stringify(await client.getUserAcl(), null, 2);
          break;
        case "search_apps":
          result = JSON.stringify(
            await client.searchApps(
              (args as { query: string }).query,
              args as { limit?: number; returnOwnedApps?: boolean }
            ),
            null,
            2
          );
          break;
        case "search_geo":
          result = JSON.stringify(
            await client.searchGeo(
              (args as { query: string }).query,
              args as { entity?: "Country" | "AdminArea" | "Locality"; countryCode?: string; limit?: number }
            ),
            null,
            2
          );
          break;
          
        // Campaigns
        case "create_campaign":
          result = await handleCreateCampaign(client, createCampaignSchema.parse(args));
          break;
        case "get_campaigns":
          result = await handleGetCampaigns(client, getCampaignsSchema.parse(args));
          break;
        case "find_campaigns":
          result = await handleFindCampaigns(client, findCampaignsSchema.parse(args));
          break;
        case "update_campaign":
          result = await handleUpdateCampaign(client, updateCampaignSchema.parse(args));
          break;
        case "delete_campaign":
          result = await handleDeleteCampaign(client, deleteCampaignSchema.parse(args));
          break;
          
        // Ad Groups
        case "create_adgroup":
          result = await handleCreateAdGroup(client, createAdGroupSchema.parse(args));
          break;
        case "get_adgroups":
          result = await handleGetAdGroups(client, getAdGroupsSchema.parse(args));
          break;
        case "find_adgroups":
          result = await handleFindAdGroups(client, findAdGroupsSchema.parse(args));
          break;
        case "update_adgroup":
          result = await handleUpdateAdGroup(client, updateAdGroupSchema.parse(args));
          break;
        case "delete_adgroup":
          result = await handleDeleteAdGroup(client, deleteAdGroupSchema.parse(args));
          break;
          
        // Targeting Keywords
        case "create_targeting_keywords":
          result = await handleCreateTargetingKeywords(client, createTargetingKeywordsSchema.parse(args));
          break;
        case "get_targeting_keywords":
          result = await handleGetTargetingKeywords(client, getTargetingKeywordsSchema.parse(args));
          break;
        case "find_targeting_keywords":
          result = await handleFindTargetingKeywords(client, findTargetingKeywordsSchema.parse(args));
          break;
        case "update_targeting_keywords":
          result = await handleUpdateTargetingKeywords(client, updateTargetingKeywordsSchema.parse(args));
          break;
          
        // Campaign Negative Keywords
        case "create_campaign_negative_keywords":
          result = await handleCreateCampaignNegativeKeywords(client, createCampaignNegativeKeywordsSchema.parse(args));
          break;
        case "get_campaign_negative_keywords":
          result = await handleGetCampaignNegativeKeywords(client, getCampaignNegativeKeywordsSchema.parse(args));
          break;
        case "update_campaign_negative_keywords":
          result = await handleUpdateCampaignNegativeKeywords(client, updateCampaignNegativeKeywordsSchema.parse(args));
          break;
        case "delete_campaign_negative_keywords":
          result = await handleDeleteCampaignNegativeKeywords(client, deleteCampaignNegativeKeywordsSchema.parse(args));
          break;
          
        // Ad Group Negative Keywords
        case "create_adgroup_negative_keywords":
          result = await handleCreateAdGroupNegativeKeywords(client, createAdGroupNegativeKeywordsSchema.parse(args));
          break;
        case "get_adgroup_negative_keywords":
          result = await handleGetAdGroupNegativeKeywords(client, getAdGroupNegativeKeywordsSchema.parse(args));
          break;
        case "update_adgroup_negative_keywords":
          result = await handleUpdateAdGroupNegativeKeywords(client, updateAdGroupNegativeKeywordsSchema.parse(args));
          break;
        case "delete_adgroup_negative_keywords":
          result = await handleDeleteAdGroupNegativeKeywords(client, deleteAdGroupNegativeKeywordsSchema.parse(args));
          break;
          
        // Reports
        case "get_campaign_reports":
          result = await handleGetCampaignReports(client, getCampaignReportsSchema.parse(args));
          break;
        case "get_adgroup_reports":
          result = await handleGetAdGroupReports(client, getAdGroupReportsSchema.parse(args));
          break;
        case "get_keyword_reports":
          result = await handleGetKeywordReports(client, getKeywordReportsSchema.parse(args));
          break;
        case "get_searchterm_reports":
          result = await handleGetSearchTermReports(client, getSearchTermReportsSchema.parse(args));
          break;
          
        default:
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
  
  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Apple Search Ads MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
