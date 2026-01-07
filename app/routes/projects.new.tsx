import type { Route } from "./+types/projects.new";
import { Form, Link, redirect, useNavigation } from "react-router";
import { requireUser } from "../lib/session.server";
import { db } from "../lib/db.server";

export function meta() {
  return [{ title: "Create Project — Changelogs.cc" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const website = formData.get("website") as string;
  const logoUrl = formData.get("logoUrl") as string;

  // Validation
  const errors: Record<string, string> = {};
  if (!name || name.trim().length < 2) {
    errors.name = "Project name must be at least 2 characters";
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = "Slug must only contain lowercase letters, numbers, and hyphens";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Check if slug is already taken
  const existingProject = await db.project.findUnique({
    where: { slug },
  });

  if (existingProject) {
    return { errors: { slug: "This slug is already taken" } };
  }

  // Create project
  const project = await db.project.create({
    data: {
      name: name.trim(),
      slug: slug.toLowerCase(),
      description: description?.trim() || null,
      website: website?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
      ownerId: user.id,
    },
  });

  return redirect(`/projects/${project.slug}`);
}

export default function NewProject({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const errors = actionData?.errors;

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slugInput = document.getElementById("slug") as HTMLInputElement;
    if (slugInput && !slugInput.dataset.modified) {
      slugInput.value = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="border-b-2 border-surface-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="btn btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-surface-900">Create New Project</h1>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Form method="post" className="space-y-8">
          <div className="card p-8">
            <h2 className="text-lg font-semibold text-surface-900 mb-6">Project Details</h2>
            
            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-surface-700 mb-2">
                  Project Name <span className="text-accent-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  onChange={handleNameChange}
                  className={`input ${errors?.name ? "input-error" : ""}`}
                  placeholder="My Awesome Project"
                />
                {errors?.name && (
                  <p className="mt-2 text-sm text-accent-500">{errors.name}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-surface-700 mb-2">
                  URL Slug <span className="text-accent-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-4 py-3 bg-surface-100 border-2 border-r-0 border-surface-200 rounded-l-lg text-surface-500 text-sm">
                    changelogs.cc/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    required
                    pattern="[a-z0-9-]+"
                    onChange={(e) => { e.target.dataset.modified = "true"; }}
                    className={`input rounded-l-none ${errors?.slug ? "input-error" : ""}`}
                    placeholder="my-awesome-project"
                  />
                </div>
                {errors?.slug && (
                  <p className="mt-2 text-sm text-accent-500">{errors.slug}</p>
                )}
                <p className="mt-2 text-sm text-surface-500">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-surface-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="input resize-none"
                  placeholder="A brief description of your project..."
                />
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-surface-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  className="input"
                  placeholder="https://example.com"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-surface-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  name="logoUrl"
                  className="input"
                  placeholder="https://example.com/logo.png"
                />
                <p className="mt-2 text-sm text-surface-500">
                  Direct link to your project's logo image
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link to="/dashboard" className="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </Form>
      </main>
    </div>
  );
}

