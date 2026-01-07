import type { Route } from "./+types/projects.$slug.changelogs.$id";
import { Form, Link, redirect, useNavigation } from "react-router";
import { requireUser } from "../lib/session.server";
import { db } from "../lib/db.server";
import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.changelog ? `Edit v${data.changelog.version} — ${data.project.name}` : "Edit Changelog — Changelogs.cc" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { slug, id } = params;

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

  const changelog = await db.changelog.findUnique({
    where: { id },
  });

  if (!changelog || changelog.projectId !== project.id) {
    throw new Response("Changelog not found", { status: 404 });
  }

  return { project, changelog, canEdit: isOwner || isEditor };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireUser(request);
  const { slug, id } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

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

  const changelog = await db.changelog.findUnique({
    where: { id },
  });

  if (!changelog || changelog.projectId !== project.id) {
    throw new Response("Changelog not found", { status: 404 });
  }

  if (intent === "delete") {
    await db.changelog.delete({ where: { id } });
    return redirect(`/projects/${slug}`);
  }

  if (intent === "publish") {
    await db.changelog.update({
      where: { id },
      data: { isDraft: false, publishedAt: new Date() },
    });
    return redirect(`/projects/${slug}/changelogs/${id}`);
  }

  if (intent === "unpublish") {
    await db.changelog.update({
      where: { id },
      data: { isDraft: true, publishedAt: null },
    });
    return redirect(`/projects/${slug}/changelogs/${id}`);
  }

  // Update changelog
  const version = formData.get("version") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

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

  // Check if version already exists (for different changelog)
  if (version.trim() !== changelog.version) {
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
  }

  await db.changelog.update({
    where: { id },
    data: {
      version: version.trim(),
      title: title.trim(),
      content: content || "",
    },
  });

  return { success: true };
}

export default function EditChangelog({ loaderData, actionData }: Route.ComponentProps) {
  const { project, changelog, canEdit } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;

  const [content, setContent] = useState(changelog.content);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="border-b-2 border-surface-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/projects/${project.slug}`} className="btn btn-ghost p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-surface-900">v{changelog.version}</h1>
                <span className={`badge ${changelog.isDraft ? "badge-draft" : "badge-success"}`}>
                  {changelog.isDraft ? "Draft" : "Published"}
                </span>
              </div>
              <p className="text-sm text-surface-500">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/${project.slug}/${changelog.version}`}
              target="_blank"
              className="btn btn-ghost text-sm"
            >
              <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Preview
            </Link>
            {canEdit && (
              <Form method="post">
                {changelog.isDraft ? (
                  <button type="submit" name="intent" value="publish" className="btn btn-primary text-sm">
                    Publish
                  </button>
                ) : (
                  <button type="submit" name="intent" value="unpublish" className="btn btn-secondary text-sm">
                    Unpublish
                  </button>
                )}
              </Form>
            )}
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Form method="post">
          <input type="hidden" name="content" value={content} />
          
          <div className="space-y-8">
            {/* Success message */}
            {actionData?.success && (
              <div className="bg-success-100 text-success-700 px-4 py-3 rounded-lg">
                Changelog saved successfully!
              </div>
            )}

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
                    defaultValue={changelog.version}
                    required
                    disabled={!canEdit}
                    className={`input ${errors?.version ? "input-error" : ""}`}
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
                    defaultValue={changelog.title}
                    required
                    disabled={!canEdit}
                    className={`input ${errors?.title ? "input-error" : ""}`}
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
            {canEdit && (
              <div className="flex items-center justify-between">
                <Form method="post" onSubmit={(e) => {
                  if (!confirm("Are you sure you want to delete this changelog?")) {
                    e.preventDefault();
                  }
                }}>
                  <button type="submit" name="intent" value="delete" className="btn btn-ghost text-accent-600">
                    Delete Changelog
                  </button>
                </Form>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </Form>
      </main>
    </div>
  );
}

