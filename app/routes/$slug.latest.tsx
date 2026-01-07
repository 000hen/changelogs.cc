import type { Route } from "./+types/$slug.latest";
import { redirect } from "react-router";
import { db } from "../lib/db.server";

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      changelogs: {
        where: { isDraft: false },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: { version: true },
      },
    },
  });

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  const latestChangelog = project.changelogs[0];

  if (!latestChangelog) {
    // No published changelogs, redirect to project page
    return redirect(`/${slug}`);
  }

  // Redirect to the latest changelog
  return redirect(`/${slug}/${latestChangelog.version}`);
}

