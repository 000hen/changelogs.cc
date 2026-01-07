import { createCookie } from "react-router";
import { db } from "./db.server";
import type { User } from "../../generated/prisma/client";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";

// Session cookie for user ID
export const sessionCookie = createCookie("__session", {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
  sameSite: "lax",
  secrets: [SESSION_SECRET],
  secure: process.env.NODE_ENV === "production",
});

// Auth state cookie for OIDC flow
export const authStateCookie = createCookie("__auth_state", {
  httpOnly: true,
  maxAge: 60 * 10, // 10 minutes
  path: "/",
  sameSite: "lax",
  secrets: [SESSION_SECRET],
  secure: process.env.NODE_ENV === "production",
});

export async function createUserSession(userId: string, redirectTo: string): Promise<Response> {
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await sessionCookie.serialize({ userId }),
    },
  });
}

export async function getUserIdFromSession(request: Request): Promise<string | null> {
  const cookie = request.headers.get("Cookie");
  const session = await sessionCookie.parse(cookie);
  return session?.userId ?? null;
}

export async function getCurrentUser(request: Request): Promise<User | null> {
  const userId = await getUserIdFromSession(request);
  if (!userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(request: Request): Promise<User> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Response(null, {
      status: 302,
      headers: { Location: "/auth/login" },
    });
  }
  return user;
}

export async function destroySession(): Promise<Response> {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }),
    },
  });
}

export async function findOrCreateUser(oidcUser: {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}): Promise<User> {
  // First try to find by sub (OIDC subject identifier)
  let user = await db.user.findUnique({
    where: { sub: oidcUser.sub },
  });

  if (user) {
    // Update user info if changed
    user = await db.user.update({
      where: { id: user.id },
      data: {
        email: oidcUser.email,
        name: oidcUser.name,
        picture: oidcUser.picture,
      },
    });
  } else {
    // Check if user exists with same email (migration case)
    const existingByEmail = await db.user.findUnique({
      where: { email: oidcUser.email },
    });

    if (existingByEmail) {
      // Update existing user with OIDC sub
      user = await db.user.update({
        where: { id: existingByEmail.id },
        data: {
          sub: oidcUser.sub,
          name: oidcUser.name,
          picture: oidcUser.picture,
        },
      });
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          sub: oidcUser.sub,
          email: oidcUser.email,
          name: oidcUser.name,
          picture: oidcUser.picture,
        },
      });

      // Check for pending invitations
      const pendingInvitations = await db.pendingInvitation.findMany({
        where: { email: oidcUser.email },
      });

      // Convert pending invitations to collaborations
      for (const invitation of pendingInvitations) {
        await db.collaborator.create({
          data: {
            userId: user.id,
            projectId: invitation.projectId,
            role: invitation.role,
          },
        });
      }

      // Delete processed invitations
      await db.pendingInvitation.deleteMany({
        where: { email: oidcUser.email },
      });
    }
  }

  return user;
}

export function generateRandomString(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

