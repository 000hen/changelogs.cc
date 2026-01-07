import * as client from "openid-client";

let oidcConfig: client.Configuration | null = null;

export async function getOIDCConfig(): Promise<client.Configuration> {
  if (oidcConfig) return oidcConfig;

  const issuer = process.env.OIDC_ISSUER!;
  const clientId = process.env.OIDC_CLIENT_ID!;
  const clientSecret = process.env.OIDC_CLIENT_SECRET!;

  oidcConfig = await client.discovery(
    new URL(issuer),
    clientId,
    clientSecret
  );

  return oidcConfig;
}

export function getRedirectUri(): string {
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
  return `${baseUrl}/auth/callback`;
}

export async function generateAuthUrl(state: string, nonce: string): Promise<string> {
  const config = await getOIDCConfig();
  const redirectUri = getRedirectUri();

  const parameters: Record<string, string> = {
    redirect_uri: redirectUri,
    scope: "openid email profile",
    state,
    nonce,
  };

  const url = client.buildAuthorizationUrl(config, parameters);
  return url.href;
}

export async function handleCallback(
  callbackUrl: URL,
  expectedState: string,
  expectedNonce: string
): Promise<client.TokenEndpointResponse> {
  const config = await getOIDCConfig();
  const redirectUri = getRedirectUri();

  const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
    expectedState,
    expectedNonce,
    idTokenExpected: true,
  });

  return tokens;
}

export async function getUserInfo(accessToken: string): Promise<client.UserInfoResponse> {
  const config = await getOIDCConfig();
  return await client.fetchUserInfo(config, accessToken, "");
}

export interface OIDCUser {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export function parseIdToken(tokens: client.TokenEndpointResponse): OIDCUser | null {
  // Access claims from the ID token
  const idToken = tokens.id_token;
  if (!idToken) return null;

  // Decode the JWT payload (middle part)
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

