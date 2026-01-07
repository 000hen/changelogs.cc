import type { Route } from "./+types/auth.callback";
import { handleCallback, parseIdToken } from "../lib/auth.server";
import {
  authStateCookie,
  createUserSession,
  findOrCreateUser,
} from "../lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const cookie = request.headers.get("Cookie");
  const authState = await authStateCookie.parse(cookie);

  if (!authState?.state || !authState?.nonce) {
    return new Response("Invalid auth state", { status: 400 });
  }

  try {
    const tokens = await handleCallback(url, authState.state, authState.nonce);
    const oidcUser = parseIdToken(tokens);

    if (!oidcUser || !oidcUser.email) {
      return new Response("Failed to get user info", { status: 400 });
    }

    const user = await findOrCreateUser(oidcUser);
    
    // Clear auth state cookie and create session
    const response = await createUserSession(user.id, "/dashboard");
    response.headers.append(
      "Set-Cookie",
      await authStateCookie.serialize("", { maxAge: 0 })
    );

    return response;
  } catch (error) {
    console.error("Auth callback error:", error);
    return new Response("Authentication failed", { status: 400 });
  }
}

