import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Shared Schemas
// ============================================

const targetingDimensionsSchema = z.object({
  age: z.object({
    included: z.array(z.object({
      minAge: z.number().min(18),
      maxAge: z.number().optional(),
    })),
  }).optional().describe("Age targeting (min 18)"),
  gender: z.object({
    included: z.array(z.enum(["M", "F"])),
  }).optional().describe("Gender targeting"),
  deviceClass: z.object({
    included: z.array(z.enum(["IPHONE", "IPAD"])),
  }).optional().describe("Device type targeting"),
  daypart: z.object({
    userTime: z.object({
      included: z.array(z.number().min(0).max(167)),
    }),
  }).optional().describe("Time-of-day targeting (0-167 representing hours of the week)"),
  adminArea: z.object({
    included: z.array(z.string()),
  }).optional().describe("State/region targeting (e.g., 'US|CA')"),
  locality: z.object({
    included: z.array(z.string()),
  }).optional().describe("City targeting (e.g., 'US|CA|Cupertino')"),
  appDownloaders: z.object({
    included: z.array(z.number()),
    excluded: z.array(z.number()),
  }).optional().describe("Target users who have/haven't downloaded specific apps"),
}).optional();

// ============================================
// Tool Schemas
// ============================================

export const createAdGroupSchema = z.object({
  campaignId: z.number().describe("Campaign ID to create ad group in"),
  name: z.string().describe("Ad group name"),
  defaultCpcBid: z.string().describe("Default cost-per-click bid amount"),
  currency: z.string().describe("Currency code (e.g., 'USD')"),
  startTime: z.string().describe("Start time in ISO format (e.g., '2024-01-01T00:00:00.000')"),
  endTime: z.string().optional().describe("Optional end time"),
  cpaGoal: z.string().optional().describe("Optional cost-per-acquisition goal"),
  automatedKeywordsOptIn: z.boolean().optional().default(false)
    .describe("Enable Search Match for automatic keyword matching"),
  targetingDimensions: targetingDimensionsSchema,
  status: z.enum(["ENABLED", "PAUSED"]).optional().default("ENABLED"),
});

export const getAdGroupsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().optional().describe("Optional ad group ID for specific ad group"),
});

export const findAdGroupsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  conditions: z.array(z.object({
    field: z.string().describe("Field to filter on"),
    operator: z.enum(["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH"]),
    values: z.array(z.string()),
  })).optional(),
  orderBy: z.object({
    field: z.string(),
    sortOrder: z.enum(["ASCENDING", "DESCENDING"]),
  }).optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

export const updateAdGroupSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID to update"),
  name: z.string().optional(),
  defaultCpcBid: z.string().optional(),
  currency: z.string().optional(),
  cpaGoal: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional().nullable(),
  automatedKeywordsOptIn: z.boolean().optional(),
  targetingDimensions: targetingDimensionsSchema,
  status: z.enum(["ENABLED", "PAUSED"]).optional(),
});

export const deleteAdGroupSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID to delete"),
});

// ============================================
// Tool Definitions
// ============================================

export const adGroupToolDefinitions = [
  {
    name: "create_adgroup",
    description: "Create a new ad group within a campaign. Ad groups contain targeting settings, bid amounts, and can have keywords assigned.",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID to create ad group in" },
        name: { type: "string", description: "Ad group name" },
        defaultCpcBid: { type: "string", description: "Default cost-per-click bid amount" },
        currency: { type: "string", description: "Currency code (e.g., 'USD')" },
        startTime: { type: "string", description: "Start time in ISO format" },
        endTime: { type: "string", description: "Optional end time" },
        cpaGoal: { type: "string", description: "Optional CPA goal amount" },
        automatedKeywordsOptIn: { 
          type: "boolean", 
          description: "Enable Search Match for automatic keyword matching" 
        },
        targetingDimensions: {
          type: "object",
          description: "Targeting settings (age, gender, device, daypart, geo, app downloaders)",
          properties: {
            age: { 
              type: "object",
              properties: {
                included: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      minAge: { type: "number" },
                      maxAge: { type: "number" },
                    },
                  },
                },
              },
            },
            gender: {
              type: "object",
              properties: {
                included: { type: "array", items: { type: "string", enum: ["M", "F"] } },
              },
            },
            deviceClass: {
              type: "object",
              properties: {
                included: { type: "array", items: { type: "string", enum: ["IPHONE", "IPAD"] } },
              },
            },
            daypart: {
              type: "object",
              properties: {
                userTime: {
                  type: "object",
                  properties: {
                    included: { type: "array", items: { type: "number" } },
                  },
                },
              },
            },
            adminArea: {
              type: "object",
              properties: {
                included: { type: "array", items: { type: "string" } },
              },
            },
            locality: {
              type: "object",
              properties: {
                included: { type: "array", items: { type: "string" } },
              },
            },
            appDownloaders: {
              type: "object",
              properties: {
                included: { type: "array", items: { type: "number" } },
                excluded: { type: "array", items: { type: "number" } },
              },
            },
          },
        },
        status: { type: "string", enum: ["ENABLED", "PAUSED"] },
      },
      required: ["campaignId", "name", "defaultCpcBid", "currency", "startTime"],
    },
  },
  {
    name: "get_adgroups",
    description: "Get all ad groups in a campaign or a specific ad group by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Optional ad group ID" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "find_adgroups",
    description: "Search for ad groups using filter conditions",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        conditions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              operator: { type: "string", enum: ["EQUALS", "IN", "LESS_THAN", "GREATER_THAN", "STARTSWITH"] },
              values: { type: "array", items: { type: "string" } },
            },
            required: ["field", "operator", "values"],
          },
        },
        orderBy: {
          type: "object",
          properties: {
            field: { type: "string" },
            sortOrder: { type: "string", enum: ["ASCENDING", "DESCENDING"] },
          },
        },
        limit: { type: "number" },
        offset: { type: "number" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "update_adgroup",
    description: "Update an ad group's settings (name, bids, targeting, status). When updating targeting dimensions, all dimensions must be specified.",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID to update" },
        name: { type: "string" },
        defaultCpcBid: { type: "string" },
        currency: { type: "string" },
        cpaGoal: { type: "string" },
        startTime: { type: "string" },
        endTime: { type: "string", nullable: true },
        automatedKeywordsOptIn: { type: "boolean" },
        targetingDimensions: {
          type: "object",
          description: "Full targeting settings (all dimensions must be specified when updating)",
        },
        status: { type: "string", enum: ["ENABLED", "PAUSED"] },
      },
      required: ["campaignId", "adGroupId"],
    },
  },
  {
    name: "delete_adgroup",
    description: "Delete an ad group",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID to delete" },
      },
      required: ["campaignId", "adGroupId"],
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

export async function handleCreateAdGroup(
  client: AppleAdsClient,
  args: z.infer<typeof createAdGroupSchema>
): Promise<string> {
  const result = await client.createAdGroup(args.campaignId, {
    name: args.name,
    defaultCpcBid: { amount: args.defaultCpcBid, currency: args.currency },
    startTime: args.startTime,
    endTime: args.endTime,
    cpaGoal: args.cpaGoal ? { amount: args.cpaGoal, currency: args.currency } : undefined,
    automatedKeywordsOptIn: args.automatedKeywordsOptIn,
    targetingDimensions: args.targetingDimensions,
    status: args.status,
  });
  return JSON.stringify(result, null, 2);
}

export async function handleGetAdGroups(
  client: AppleAdsClient,
  args: z.infer<typeof getAdGroupsSchema>
): Promise<string> {
  const result = await client.getAdGroups(args.campaignId, args.adGroupId);
  return JSON.stringify(result, null, 2);
}

export async function handleFindAdGroups(
  client: AppleAdsClient,
  args: z.infer<typeof findAdGroupsSchema>
): Promise<string> {
  const selector = {
    conditions: args.conditions,
    orderBy: args.orderBy ? [args.orderBy] : undefined,
    pagination: { offset: args.offset ?? 0, limit: args.limit ?? 20 },
  };
  const result = await client.findAdGroups(args.campaignId, selector);
  return JSON.stringify(result, null, 2);
}

export async function handleUpdateAdGroup(
  client: AppleAdsClient,
  args: z.infer<typeof updateAdGroupSchema>
): Promise<string> {
  const updates: Parameters<typeof client.updateAdGroup>[2] = {};
  
  if (args.name) updates.name = args.name;
  if (args.status) updates.status = args.status;
  if (args.startTime) updates.startTime = args.startTime;
  if (args.endTime !== undefined) updates.endTime = args.endTime ?? undefined;
  if (args.automatedKeywordsOptIn !== undefined) {
    updates.automatedKeywordsOptIn = args.automatedKeywordsOptIn;
  }
  if (args.defaultCpcBid && args.currency) {
    updates.defaultCpcBid = { amount: args.defaultCpcBid, currency: args.currency };
  }
  if (args.cpaGoal && args.currency) {
    updates.cpaGoal = { amount: args.cpaGoal, currency: args.currency };
  }
  if (args.targetingDimensions) {
    updates.targetingDimensions = args.targetingDimensions;
  }
  
  const result = await client.updateAdGroup(args.campaignId, args.adGroupId, updates);
  return JSON.stringify(result, null, 2);
}

export async function handleDeleteAdGroup(
  client: AppleAdsClient,
  args: z.infer<typeof deleteAdGroupSchema>
): Promise<string> {
  const result = await client.deleteAdGroup(args.campaignId, args.adGroupId);
  return JSON.stringify({ success: true, ...result }, null, 2);
}
