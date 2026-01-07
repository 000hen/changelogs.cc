import type { Route } from "./+types/projects.$slug.changelogs.new";
import { Form, Link, redirect, useNavigation } from "react-router";
import { requireUser } from "../lib/session.server";
import { db } from "../lib/db.server";
import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.project ? `New Changelog — ${data.project.name}` : "New Changelog — Changelogs.cc" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { slug } = params;

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      collaborators: { where: { userId: user.id } },
    },
  });

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  const isOwner = project.ownerId === user.id;
  const isEditor = project.collaborators.some((c: { role: string }) => c.role === "EDITOR");

  if (!isOwner && !isEditor) {
    throw new Response("Access denied", { status: 403 });
  }

  return { project };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireUser(request);
  const { slug } = params;
  const formData = await request.formData();

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      collaborators: { where: { userId: user.id } },
    },
  });

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  const isOwner = project.ownerId === user.id;
  const isEditor = project.collaborators.some((c: { role: string }) => c.role === "EDITOR");

  if (!isOwner && !isEditor) {
    throw new Response("Access denied", { status: 403 });
  }

  const version = formData.get("version") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const isDraft = formData.get("isDraft") === "true";

  const errors: Record<string, string> = {};
  if (!version || version.trim().length === 0) {
    errors.version = "Version is required";
  }
  if (!title || title.trim().length === 0) {
    errors.title = "Title is required";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Check if version already exists
  const existingVersion = await db.changelog.findUnique({
    where: {
      projectId_version: {
        projectId: project.id,
        version: version.trim(),
      },
    },
  });

  if (existingVersion) {
    return { errors: { version: "This version already exists" } };
  }

  const changelog = await db.changelog.create({
    data: {
      projectId: project.id,
      version: version.trim(),
      title: title.trim(),
      content: content || "",
      isDraft,
      publishedAt: isDraft ? null : new Date(),
    },
  });

  return redirect(`/projects/${slug}/changelogs/${changelog.id}`);
}

export default function NewChangelog({ loaderData, actionData }: Route.ComponentProps) {
  const { project } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;

  const [content, setContent] = useState("## What's New\n\n- Feature 1\n- Feature 2\n\n## Bug Fixes\n\n- Fixed issue with...\n");

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="border-b-2 border-surface-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to={`/projects/${project.slug}`} className="btn btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-surface-900">New Changelog</h1>
            <p className="text-sm text-surface-500">{project.name}</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Form method="post">
          <input type="hidden" name="content" value={content} />
          
          <div className="space-y-8">
            {/* Version & Title */}
            <div className="card p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="version" className="block text-sm font-medium text-surface-700 mb-2">
                    Version <span className="text-accent-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="version"
                    name="version"
                    required
                    className={`input ${errors?.version ? "input-error" : ""}`}
                    placeholder="1.0.0"
                  />
                  {errors?.version && <p className="mt-2 text-sm text-accent-500">{errors.version}</p>}
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-surface-700 mb-2">
                    Title <span className="text-accent-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className={`input ${errors?.title ? "input-error" : ""}`}
                    placeholder="Initial Release"
                  />
                  {errors?.title && <p className="mt-2 text-sm text-accent-500">{errors.title}</p>}
                </div>
              </div>
            </div>

            {/* Markdown Editor */}
            <div className="card p-8">
              <label className="block text-sm font-medium text-surface-700 mb-4">
                Content
              </label>
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || "")}
                  height={400}
                  preview="live"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Link to={`/projects/${project.slug}`} className="btn btn-ghost">
                Cancel
              </Link>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  name="isDraft"
                  value="true"
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  name="isDraft"
                  value="false"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </Form>
      </main>
    </div>
  );
}

