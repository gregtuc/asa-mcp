import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Tool Schemas
// ============================================

export const createCampaignSchema = z.object({
  name: z.string().describe("Campaign name (must be unique within org)"),
  adamId: z.number().describe("App Store app identifier"),
  countriesOrRegions: z.array(z.string()).describe("ISO Alpha-2 country codes (e.g., ['US', 'CA'])"),
  budgetAmount: z.string().describe("Total budget amount"),
  currency: z.string().describe("Currency code (e.g., 'USD')"),
  dailyBudgetAmount: z.string().optional().describe("Optional daily budget cap"),
});

export const getCampaignsSchema = z.object({
  campaignId: z.number().optional().describe("Optional campaign ID to get a specific campaign"),
});

export const findCampaignsSchema = z.object({
  conditions: z.array(z.object({
    field: z.string().describe("Field to filter on (e.g., 'name', 'status', 'countriesOrRegions')"),
    operator: z.enum(["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH", "CONTAINS_ANY", "CONTAINS_ALL"]),
    values: z.array(z.string()).describe("Values to match"),
  })).optional().describe("Filter conditions"),
  orderBy: z.object({
    field: z.string(),
    sortOrder: z.enum(["ASCENDING", "DESCENDING"]),
  }).optional().describe("Sort order"),
  limit: z.number().optional().default(20).describe("Max results to return"),
  offset: z.number().optional().default(0).describe("Offset for pagination"),
});

export const updateCampaignSchema = z.object({
  campaignId: z.number().describe("Campaign ID to update"),
  name: z.string().optional().describe("New campaign name"),
  budgetAmount: z.string().optional().describe("New total budget amount"),
  dailyBudgetAmount: z.string().optional().describe("New daily budget cap"),
  currency: z.string().optional().describe("Currency code"),
  countriesOrRegions: z.array(z.string()).optional().describe("New country/region list"),
  status: z.enum(["ENABLED", "PAUSED"]).optional().describe("Campaign status"),
  clearGeoTargetingOnCountryOrRegionChange: z.boolean().optional().default(false)
    .describe("Clear geo targeting when changing countries"),
});

export const deleteCampaignSchema = z.object({
  campaignId: z.number().describe("Campaign ID to delete"),
});

// ============================================
// Tool Definitions
// ============================================

export const campaignToolDefinitions = [
  {
    name: "create_campaign",
    description: "Create a new Apple Search Ads campaign. Requires app adamId (use search_apps to find it), budget, and target countries/regions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Campaign name (must be unique within org)" },
        adamId: { type: "number", description: "App Store app identifier" },
        countriesOrRegions: { 
          type: "array", 
          items: { type: "string" },
          description: "ISO Alpha-2 country codes (e.g., ['US', 'CA'])" 
        },
        budgetAmount: { type: "string", description: "Total budget amount" },
        currency: { type: "string", description: "Currency code (e.g., 'USD')" },
        dailyBudgetAmount: { type: "string", description: "Optional daily budget cap" },
      },
      required: ["name", "adamId", "countriesOrRegions", "budgetAmount", "currency"],
    },
  },
  {
    name: "get_campaigns",
    description: "Get all campaigns or a specific campaign by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Optional campaign ID to get a specific campaign" },
      },
    },
  },
  {
    name: "find_campaigns",
    description: "Search for campaigns using filter conditions. Supports filtering by name, status, countriesOrRegions, etc.",
    inputSchema: {
      type: "object" as const,
      properties: {
        conditions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "Field to filter on" },
              operator: { 
                type: "string", 
                enum: ["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH", "CONTAINS_ANY", "CONTAINS_ALL"] 
              },
              values: { type: "array", items: { type: "string" } },
            },
            required: ["field", "operator", "values"],
          },
          description: "Filter conditions",
        },
        orderBy: {
          type: "object",
          properties: {
            field: { type: "string" },
            sortOrder: { type: "string", enum: ["ASCENDING", "DESCENDING"] },
          },
        },
        limit: { type: "number", description: "Max results (default 20, max 1000)" },
        offset: { type: "number", description: "Pagination offset" },
      },
    },
  },
  {
    name: "update_campaign",
    description: "Update an existing campaign's settings (name, budget, status, countries/regions)",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID to update" },
        name: { type: "string", description: "New campaign name" },
        budgetAmount: { type: "string", description: "New total budget amount" },
        dailyBudgetAmount: { type: "string", description: "New daily budget cap" },
        currency: { type: "string", description: "Currency code" },
        countriesOrRegions: { 
          type: "array", 
          items: { type: "string" },
          description: "New country/region list" 
        },
        status: { type: "string", enum: ["ENABLED", "PAUSED"], description: "Campaign status" },
        clearGeoTargetingOnCountryOrRegionChange: { 
          type: "boolean", 
          description: "Clear geo targeting when changing countries" 
        },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "delete_campaign",
    description: "Delete a campaign by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID to delete" },
      },
      required: ["campaignId"],
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

export async function handleCreateCampaign(
  client: AppleAdsClient,
  args: z.infer<typeof createCampaignSchema>
): Promise<string> {
  const result = await client.createCampaign({
    name: args.name,
    adamId: args.adamId,
    countriesOrRegions: args.countriesOrRegions,
    budgetAmount: { amount: args.budgetAmount, currency: args.currency },
    dailyBudgetAmount: args.dailyBudgetAmount 
      ? { amount: args.dailyBudgetAmount, currency: args.currency }
      : undefined,
  });
  return JSON.stringify(result, null, 2);
}

export async function handleGetCampaigns(
  client: AppleAdsClient,
  args: z.infer<typeof getCampaignsSchema>
): Promise<string> {
  const result = await client.getCampaigns(args.campaignId);
  return JSON.stringify(result, null, 2);
}

export async function handleFindCampaigns(
  client: AppleAdsClient,
  args: z.infer<typeof findCampaignsSchema>
): Promise<string> {
  const selector = {
    conditions: args.conditions,
    orderBy: args.orderBy ? [args.orderBy] : undefined,
    pagination: { offset: args.offset ?? 0, limit: args.limit ?? 20 },
  };
  const result = await client.findCampaigns(selector);
  return JSON.stringify(result, null, 2);
}

export async function handleUpdateCampaign(
  client: AppleAdsClient,
  args: z.infer<typeof updateCampaignSchema>
): Promise<string> {
  const updates: Parameters<typeof client.updateCampaign>[1] = {
    clearGeoTargetingOnCountryOrRegionChange: args.clearGeoTargetingOnCountryOrRegionChange,
  };
  
  if (args.name) updates.name = args.name;
  if (args.status) updates.status = args.status;
  if (args.countriesOrRegions) updates.countriesOrRegions = args.countriesOrRegions;
  if (args.budgetAmount && args.currency) {
    updates.budgetAmount = { amount: args.budgetAmount, currency: args.currency };
  }
  if (args.dailyBudgetAmount && args.currency) {
    updates.dailyBudgetAmount = { amount: args.dailyBudgetAmount, currency: args.currency };
  }
  
  const result = await client.updateCampaign(args.campaignId, updates);
  return JSON.stringify(result, null, 2);
}

export async function handleDeleteCampaign(
  client: AppleAdsClient,
  args: z.infer<typeof deleteCampaignSchema>
): Promise<string> {
  const result = await client.deleteCampaign(args.campaignId);
  return JSON.stringify({ success: true, ...result }, null, 2);
}
