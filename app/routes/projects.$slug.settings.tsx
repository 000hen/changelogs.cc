import type { Route } from "./+types/projects.$slug.settings";
import { Form, Link, redirect, useNavigation } from "react-router";
import { requireUser } from "../lib/session.server";
import { db } from "../lib/db.server";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.project ? `Settings — ${data.project.name}` : "Settings — Changelogs.cc" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { slug } = params;

  const project = await db.project.findUnique({
    where: { slug },
  });

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  if (project.ownerId !== user.id) {
    throw new Response("Only the owner can access settings", { status: 403 });
  }

  return { project };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireUser(request);
  const { slug } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  const project = await db.project.findUnique({
    where: { slug },
  });

  if (!project || project.ownerId !== user.id) {
    throw new Response("Access denied", { status: 403 });
  }

  if (intent === "delete") {
    await db.project.delete({
      where: { id: project.id },
    });
    return redirect("/dashboard");
  }

  // Update project
  const name = formData.get("name") as string;
  const newSlug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const website = formData.get("website") as string;
  const logoUrl = formData.get("logoUrl") as string;

  const errors: Record<string, string> = {};
  if (!name || name.trim().length < 2) {
    errors.name = "Project name must be at least 2 characters";
  }
  if (!newSlug || !/^[a-z0-9-]+$/.test(newSlug)) {
    errors.slug = "Slug must only contain lowercase letters, numbers, and hyphens";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Check if new slug is taken (by another project)
  if (newSlug !== slug) {
    const existing = await db.project.findUnique({
      where: { slug: newSlug },
    });
    if (existing) {
      return { errors: { slug: "This slug is already taken" } };
    }
  }

  await db.project.update({
    where: { id: project.id },
    data: {
      name: name.trim(),
      slug: newSlug.toLowerCase(),
      description: description?.trim() || null,
      website: website?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
    },
  });

  return redirect(`/projects/${newSlug}/settings`);
}

export default function ProjectSettings({ loaderData, actionData }: Route.ComponentProps) {
  const { project } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="border-b-2 border-surface-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to={`/projects/${project.slug}`} className="btn btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-surface-900">Project Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Update Form */}
        <Form method="post">
          <div className="card p-8">
            <h2 className="text-lg font-semibold text-surface-900 mb-6">General</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-surface-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={project.name}
                  required
                  className={`input ${errors?.name ? "input-error" : ""}`}
                />
                {errors?.name && <p className="mt-2 text-sm text-accent-500">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-surface-700 mb-2">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="px-4 py-3 bg-surface-100 border-2 border-r-0 border-surface-200 rounded-l-lg text-surface-500 text-sm">
                    changelogs.cc/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    defaultValue={project.slug}
                    required
                    className={`input rounded-l-none ${errors?.slug ? "input-error" : ""}`}
                  />
                </div>
                {errors?.slug && <p className="mt-2 text-sm text-accent-500">{errors.slug}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-surface-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={project.description || ""}
                  className="input resize-none"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-surface-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  defaultValue={project.website || ""}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-surface-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  name="logoUrl"
                  defaultValue={project.logoUrl || ""}
                  className="input"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </Form>

        {/* Danger Zone */}
        <div className="card border-accent-300 p-8">
          <h2 className="text-lg font-semibold text-accent-600 mb-2">Danger Zone</h2>
          <p className="text-surface-600 mb-6">
            Once you delete a project, there is no going back. All changelogs and analytics data will be permanently deleted.
          </p>
          <Form method="post" onSubmit={(e) => {
            if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
              e.preventDefault();
            }
          }}>
            <input type="hidden" name="intent" value="delete" />
            <button type="submit" className="btn btn-danger">
              Delete Project
            </button>
          </Form>
        </div>
      </main>
    </div>
  );
}

