import { z } from "zod";
import { AppleAdsClient } from "../client.js";

// ============================================
// Targeting Keywords Schemas
// ============================================

export const createTargetingKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  keywords: z.array(z.object({
    text: z.string().describe("Keyword text"),
    matchType: z.enum(["BROAD", "EXACT"]).describe("Match type"),
    bidAmount: z.string().optional().describe("Optional bid amount (uses ad group default if not set)"),
    currency: z.string().optional().describe("Currency code"),
    status: z.enum(["ACTIVE", "PAUSED"]).optional().default("ACTIVE"),
  })).describe("Keywords to add"),
});

export const getTargetingKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  keywordId: z.number().optional().describe("Optional keyword ID for specific keyword"),
});

export const findTargetingKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["EQUALS", "IN", "STARTSWITH"]),
    values: z.array(z.string()),
  })).optional(),
  orderBy: z.object({
    field: z.string(),
    sortOrder: z.enum(["ASCENDING", "DESCENDING"]),
  }).optional(),
  limit: z.number().optional().default(1000),
  offset: z.number().optional().default(0),
});

export const updateTargetingKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  keywords: z.array(z.object({
    id: z.number().describe("Keyword ID"),
    bidAmount: z.string().optional(),
    currency: z.string().optional(),
    status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  })).describe("Keywords to update"),
});

// ============================================
// Campaign Negative Keywords Schemas
// ============================================

export const createCampaignNegativeKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  keywords: z.array(z.object({
    text: z.string().describe("Negative keyword text"),
    matchType: z.enum(["BROAD", "EXACT"]).describe("Match type"),
  })).describe("Negative keywords to add"),
});

export const getCampaignNegativeKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  keywordId: z.number().optional().describe("Optional keyword ID"),
});

export const updateCampaignNegativeKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  keywords: z.array(z.object({
    id: z.number().describe("Keyword ID"),
    status: z.enum(["ACTIVE", "PAUSED"]),
  })).describe("Keywords to update"),
});

export const deleteCampaignNegativeKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  keywordIds: z.array(z.number()).describe("Keyword IDs to delete"),
});

// ============================================
// Ad Group Negative Keywords Schemas
// ============================================

export const createAdGroupNegativeKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  keywords: z.array(z.object({
    text: z.string().describe("Negative keyword text"),
    matchType: z.enum(["BROAD", "EXACT"]).describe("Match type"),
  })).describe("Negative keywords to add"),
});

export const getAdGroupNegativeKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  keywordId: z.number().optional().describe("Optional keyword ID"),
});

export const updateAdGroupNegativeKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  keywords: z.array(z.object({
    id: z.number().describe("Keyword ID"),
    status: z.enum(["ACTIVE", "PAUSED"]),
  })).describe("Keywords to update"),
});

export const deleteAdGroupNegativeKeywordsSchema = z.object({
  campaignId: z.number().describe("Campaign ID"),
  adGroupId: z.number().describe("Ad group ID"),
  keywordIds: z.array(z.number()).describe("Keyword IDs to delete"),
});

// ============================================
// Tool Definitions
// ============================================

export const keywordToolDefinitions = [
  // Targeting Keywords
  {
    name: "create_targeting_keywords",
    description: "Add targeting keywords to an ad group. Keywords are used to match your ads to user searches.",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        keywords: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string", description: "Keyword text" },
              matchType: { type: "string", enum: ["BROAD", "EXACT"], description: "Match type" },
              bidAmount: { type: "string", description: "Optional bid amount" },
              currency: { type: "string", description: "Currency code" },
              status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
            },
            required: ["text", "matchType"],
          },
        },
      },
      required: ["campaignId", "adGroupId", "keywords"],
    },
  },
  {
    name: "get_targeting_keywords",
    description: "Get targeting keywords for an ad group",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        keywordId: { type: "number", description: "Optional keyword ID" },
      },
      required: ["campaignId", "adGroupId"],
    },
  },
  {
    name: "find_targeting_keywords",
    description: "Search for targeting keywords across ad groups in a campaign",
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
              operator: { type: "string", enum: ["EQUALS", "IN", "STARTSWITH"] },
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
    name: "update_targeting_keywords",
    description: "Update targeting keyword bids and status",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        keywords: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number", description: "Keyword ID" },
              bidAmount: { type: "string", description: "New bid amount" },
              currency: { type: "string", description: "Currency code" },
              status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
            },
            required: ["id"],
          },
        },
      },
      required: ["campaignId", "adGroupId", "keywords"],
    },
  },
  // Campaign Negative Keywords
  {
    name: "create_campaign_negative_keywords",
    description: "Add negative keywords at the campaign level to prevent ads from showing for certain searches",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        keywords: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string", description: "Negative keyword text" },
              matchType: { type: "string", enum: ["BROAD", "EXACT"] },
            },
            required: ["text", "matchType"],
          },
        },
      },
      required: ["campaignId", "keywords"],
    },
  },
  {
    name: "get_campaign_negative_keywords",
    description: "Get campaign-level negative keywords",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        keywordId: { type: "number", description: "Optional keyword ID" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "update_campaign_negative_keywords",
    description: "Update campaign-level negative keyword status",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        keywords: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number", description: "Keyword ID" },
              status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
            },
            required: ["id", "status"],
          },
        },
      },
      required: ["campaignId", "keywords"],
    },
  },
  {
    name: "delete_campaign_negative_keywords",
    description: "Delete campaign-level negative keywords",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        keywordIds: { type: "array", items: { type: "number" }, description: "Keyword IDs to delete" },
      },
      required: ["campaignId", "keywordIds"],
    },
  },
  // Ad Group Negative Keywords
  {
    name: "create_adgroup_negative_keywords",
    description: "Add negative keywords at the ad group level",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        keywords: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string", description: "Negative keyword text" },
              matchType: { type: "string", enum: ["BROAD", "EXACT"] },
            },
            required: ["text", "matchType"],
          },
        },
      },
      required: ["campaignId", "adGroupId", "keywords"],
    },
  },
  {
    name: "get_adgroup_negative_keywords",
    description: "Get ad group-level negative keywords",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        keywordId: { type: "number", description: "Optional keyword ID" },
      },
      required: ["campaignId", "adGroupId"],
    },
  },
  {
    name: "update_adgroup_negative_keywords",
    description: "Update ad group-level negative keyword status",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        keywords: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number", description: "Keyword ID" },
              status: { type: "string", enum: ["ACTIVE", "PAUSED"] },
            },
            required: ["id", "status"],
          },
        },
      },
      required: ["campaignId", "adGroupId", "keywords"],
    },
  },
  {
    name: "delete_adgroup_negative_keywords",
    description: "Delete ad group-level negative keywords",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaignId: { type: "number", description: "Campaign ID" },
        adGroupId: { type: "number", description: "Ad group ID" },
        keywordIds: { type: "array", items: { type: "number" }, description: "Keyword IDs to delete" },
      },
      required: ["campaignId", "adGroupId", "keywordIds"],
    },
  },
];

// ============================================
// Tool Handlers
// ============================================

// Targeting Keywords Handlers
export async function handleCreateTargetingKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof createTargetingKeywordsSchema>
): Promise<string> {
  const keywords = args.keywords.map(kw => ({
    text: kw.text,
    matchType: kw.matchType,
    bidAmount: kw.bidAmount && kw.currency 
      ? { amount: kw.bidAmount, currency: kw.currency }
      : undefined,
    status: kw.status,
  }));
  const result = await client.createTargetingKeywords(args.campaignId, args.adGroupId, keywords);
  return JSON.stringify(result, null, 2);
}

export async function handleGetTargetingKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof getTargetingKeywordsSchema>
): Promise<string> {
  const result = await client.getTargetingKeywords(args.campaignId, args.adGroupId, args.keywordId);
  return JSON.stringify(result, null, 2);
}

export async function handleFindTargetingKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof findTargetingKeywordsSchema>
): Promise<string> {
  const selector = {
    conditions: args.conditions,
    orderBy: args.orderBy ? [args.orderBy] : undefined,
    pagination: { offset: args.offset ?? 0, limit: args.limit ?? 1000 },
  };
  const result = await client.findTargetingKeywords(args.campaignId, selector);
  return JSON.stringify(result, null, 2);
}

export async function handleUpdateTargetingKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof updateTargetingKeywordsSchema>
): Promise<string> {
  const keywords = args.keywords.map(kw => ({
    id: kw.id,
    bidAmount: kw.bidAmount && kw.currency 
      ? { amount: kw.bidAmount, currency: kw.currency }
      : undefined,
    status: kw.status,
  }));
  const result = await client.updateTargetingKeywords(args.campaignId, args.adGroupId, keywords);
  return JSON.stringify(result, null, 2);
}

// Campaign Negative Keywords Handlers
export async function handleCreateCampaignNegativeKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof createCampaignNegativeKeywordsSchema>
): Promise<string> {
  const result = await client.createCampaignNegativeKeywords(args.campaignId, args.keywords);
  return JSON.stringify(result, null, 2);
}

export async function handleGetCampaignNegativeKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof getCampaignNegativeKeywordsSchema>
): Promise<string> {
  const result = await client.getCampaignNegativeKeywords(args.campaignId, args.keywordId);
  return JSON.stringify(result, null, 2);
}

export async function handleUpdateCampaignNegativeKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof updateCampaignNegativeKeywordsSchema>
): Promise<string> {
  const result = await client.updateCampaignNegativeKeywords(args.campaignId, args.keywords);
  return JSON.stringify(result, null, 2);
}

export async function handleDeleteCampaignNegativeKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof deleteCampaignNegativeKeywordsSchema>
): Promise<string> {
  const result = await client.deleteCampaignNegativeKeywords(args.campaignId, args.keywordIds);
  return JSON.stringify({ success: true, ...result }, null, 2);
}

// Ad Group Negative Keywords Handlers
export async function handleCreateAdGroupNegativeKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof createAdGroupNegativeKeywordsSchema>
): Promise<string> {
  const result = await client.createAdGroupNegativeKeywords(args.campaignId, args.adGroupId, args.keywords);
  return JSON.stringify(result, null, 2);
}

export async function handleGetAdGroupNegativeKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof getAdGroupNegativeKeywordsSchema>
): Promise<string> {
  const result = await client.getAdGroupNegativeKeywords(args.campaignId, args.adGroupId, args.keywordId);
  return JSON.stringify(result, null, 2);
}

export async function handleUpdateAdGroupNegativeKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof updateAdGroupNegativeKeywordsSchema>
): Promise<string> {
  const result = await client.updateAdGroupNegativeKeywords(args.campaignId, args.adGroupId, args.keywords);
  return JSON.stringify(result, null, 2);
}

export async function handleDeleteAdGroupNegativeKeywords(
  client: AppleAdsClient,
  args: z.infer<typeof deleteAdGroupNegativeKeywordsSchema>
): Promise<string> {
  const result = await client.deleteAdGroupNegativeKeywords(args.campaignId, args.adGroupId, args.keywordIds);
  return JSON.stringify({ success: true, ...result }, null, 2);
}
