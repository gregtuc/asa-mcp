import jwt from "jsonwebtoken";
import fs from "fs";

const TOKEN_ENDPOINT = "https://appleid.apple.com/auth/oauth2/token";

export interface AuthConfig {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKeyPath: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/**
 * Generate a client secret JWT for Apple Search Ads OAuth
 */
function generateClientSecret(config: AuthConfig): string {
  const privateKey = fs.readFileSync(config.privateKeyPath, "utf8");
  
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 86400; // 24 hours (maximum allowed)
  
  const payload = {
    iss: config.teamId,
    iat: now,
    exp: now + expiresIn,
    aud: "https://appleid.apple.com",
    sub: config.clientId,
  };
  
  const header = {
    alg: "ES256" as const,
    kid: config.keyId,
  };
  
  return jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    header,
  });
}

/**
 * Exchange client secret for access token
 */
async function fetchAccessToken(config: AuthConfig): Promise<TokenResponse> {
  const clientSecret = generateClientSecret(config);
  
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: clientSecret,
    scope: "searchadsorg",
  });
  
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch access token: ${response.status} ${errorText}`);
  }
  
  return response.json() as Promise<TokenResponse>;
}

/**
 * Get a valid access token, using cached token if still valid
 */
export async function getAccessToken(config: AuthConfig): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }
  
  // Fetch new token
  const tokenResponse = await fetchAccessToken(config);
  
  cachedToken = {
    accessToken: tokenResponse.access_token,
    expiresAt: now + tokenResponse.expires_in * 1000,
  };
  
  return cachedToken.accessToken;
}

/**
 * Clear the cached token (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}

/**
 * Load auth config from environment variables
 */
export function loadAuthConfigFromEnv(): AuthConfig {
  const clientId = process.env.APPLE_ADS_CLIENT_ID;
  const teamId = process.env.APPLE_ADS_TEAM_ID;
  const keyId = process.env.APPLE_ADS_KEY_ID;
  const privateKeyPath = process.env.APPLE_ADS_PRIVATE_KEY_PATH;
  
  if (!clientId) {
    throw new Error("APPLE_ADS_CLIENT_ID environment variable is required");
  }
  if (!teamId) {
    throw new Error("APPLE_ADS_TEAM_ID environment variable is required");
  }
  if (!keyId) {
    throw new Error("APPLE_ADS_KEY_ID environment variable is required");
  }
  if (!privateKeyPath) {
    throw new Error("APPLE_ADS_PRIVATE_KEY_PATH environment variable is required");
  }
  
  return { clientId, teamId, keyId, privateKeyPath };
}
