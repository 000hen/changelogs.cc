import type { Route } from "./+types/auth.login";
import { generateAuthUrl } from "../lib/auth.server";
import { authStateCookie, generateRandomString } from "../lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const state = generateRandomString(32);
  const nonce = generateRandomString(32);

  const authUrl = await generateAuthUrl(state, nonce);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      "Set-Cookie": await authStateCookie.serialize({ state, nonce }),
    },
  });
}

