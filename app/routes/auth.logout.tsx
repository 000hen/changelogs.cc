import type { Route } from "./+types/auth.logout";
import { destroySession } from "../lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  return destroySession();
}

