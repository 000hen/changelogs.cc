import type { Route } from "./+types/projects.$slug.collaborators";
import { Form, Link, useNavigation } from "react-router";
import { requireUser } from "../lib/session.server";
import { db } from "../lib/db.server";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.project ? `Collaborators — ${data.project.name}` : "Collaborators — Changelogs.cc" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { slug } = params;

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, email: true, picture: true } },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, email: true, picture: true } },
        },
      },
    },
  });

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  if (project.ownerId !== user.id) {
    throw new Response("Only the owner can manage collaborators", { status: 403 });
  }

  // Get pending invitations
  const pendingInvitations = await db.pendingInvitation.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });

  return { project, pendingInvitations };
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

  if (intent === "invite") {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const role = formData.get("role") as "EDITOR" | "VIEWER";

    if (!email || !email.includes("@")) {
      return { error: "Please enter a valid email address" };
    }

    // Check if already owner
    if (email === user.email) {
      return { error: "You cannot invite yourself" };
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Check if already a collaborator
      const existingCollab = await db.collaborator.findUnique({
        where: {
          userId_projectId: {
            userId: existingUser.id,
            projectId: project.id,
          },
        },
      });

      if (existingCollab) {
        return { error: "This user is already a collaborator" };
      }

      // Add as collaborator directly
      await db.collaborator.create({
        data: {
          userId: existingUser.id,
          projectId: project.id,
          role,
        },
      });

      return { success: `${email} has been added as a collaborator` };
    }

    // User doesn't exist, create pending invitation
    const existingInvite = await db.pendingInvitation.findUnique({
      where: {
        email_projectId: {
          email,
          projectId: project.id,
        },
      },
    });

    if (existingInvite) {
      return { error: "An invitation has already been sent to this email" };
    }

    // Create invitation that expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.pendingInvitation.create({
      data: {
        email,
        projectId: project.id,
        role,
        expiresAt,
      },
    });

    return { success: `Invitation sent to ${email}. They will be added when they sign up.` };
  }

  if (intent === "remove-collaborator") {
    const collaboratorId = formData.get("collaboratorId") as string;
    await db.collaborator.delete({
      where: { id: collaboratorId },
    });
    return { success: "Collaborator removed" };
  }

  if (intent === "cancel-invitation") {
    const invitationId = formData.get("invitationId") as string;
    await db.pendingInvitation.delete({
      where: { id: invitationId },
    });
    return { success: "Invitation cancelled" };
  }

  if (intent === "update-role") {
    const collaboratorId = formData.get("collaboratorId") as string;
    const newRole = formData.get("newRole") as "EDITOR" | "VIEWER";
    await db.collaborator.update({
      where: { id: collaboratorId },
      data: { role: newRole },
    });
    return { success: "Role updated" };
  }

  return {};
}

export default function Collaborators({ loaderData, actionData }: Route.ComponentProps) {
  const { project, pendingInvitations } = loaderData;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
          <div>
            <h1 className="text-xl font-semibold text-surface-900">Collaborators</h1>
            <p className="text-sm text-surface-500">{project.name}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Messages */}
        {actionData?.error && (
          <div className="bg-accent-100 text-accent-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}
        {actionData?.success && (
          <div className="bg-success-100 text-success-700 px-4 py-3 rounded-lg">
            {actionData.success}
          </div>
        )}

        {/* Invite Form */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-surface-900 mb-2">Invite People</h2>
          <p className="text-surface-600 mb-6 text-sm sm:text-base">
            Share this project with others by inviting them via email. They'll be able to edit changelogs when they sign in.
          </p>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="invite" />
            
            {/* Email Input - Full Width */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="input text-lg py-4"
                placeholder="colleague@company.com"
              />
            </div>
            
            {/* Role & Button Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="role" className="block text-sm font-medium text-surface-700 mb-2">
                  Permission
                </label>
                <select id="role" name="role" className="input py-4">
                  <option value="EDITOR">Editor — Can edit changelogs</option>
                  <option value="VIEWER">Viewer — Read only access</option>
                </select>
              </div>
              <div className="sm:self-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn btn-primary w-full sm:w-auto py-4 px-8 text-base"
                >
                  {isSubmitting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </div>
          </Form>
        </div>

        {/* Current Members */}
        <div className="card">
          <div className="p-6 border-b-2 border-surface-100">
            <h2 className="text-lg font-semibold text-surface-900">Team Members</h2>
          </div>

          {/* Owner */}
          <div className="p-4 flex items-center justify-between border-b-2 border-surface-100">
            <div className="flex items-center gap-3">
              {project.owner.picture ? (
                <img src={project.owner.picture} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {project.owner.name?.[0] || project.owner.email[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-surface-900">
                  {project.owner.name || project.owner.email}
                </p>
                <p className="text-sm text-surface-500">{project.owner.email}</p>
              </div>
            </div>
            <span className="badge badge-primary">Owner</span>
          </div>

          {/* Collaborators */}
          {project.collaborators.map((collab) => (
            <div key={collab.id} className="p-4 flex items-center justify-between border-b-2 border-surface-100 last:border-b-0">
              <div className="flex items-center gap-3">
                {collab.user.picture ? (
                  <img src={collab.user.picture} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                    <span className="text-success-600 font-medium">
                      {collab.user.name?.[0] || collab.user.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-surface-900">
                    {collab.user.name || collab.user.email}
                  </p>
                  <p className="text-sm text-surface-500">{collab.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Form method="post" className="flex items-center gap-2">
                  <input type="hidden" name="intent" value="update-role" />
                  <input type="hidden" name="collaboratorId" value={collab.id} />
                  <select
                    name="newRole"
                    defaultValue={collab.role}
                    onChange={(e) => e.target.form?.requestSubmit()}
                    className="input py-1.5 px-3 text-sm w-auto"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </Form>
                <Form method="post">
                  <input type="hidden" name="intent" value="remove-collaborator" />
                  <input type="hidden" name="collaboratorId" value={collab.id} />
                  <button
                    type="submit"
                    className="btn btn-ghost p-2 text-accent-600 hover:bg-accent-50"
                    title="Remove collaborator"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </Form>
              </div>
            </div>
          ))}

          {project.collaborators.length === 0 && pendingInvitations.length === 0 && (
            <div className="p-8 text-center text-surface-500">
              No collaborators yet. Invite someone to get started!
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="card">
            <div className="p-6 border-b-2 border-surface-100">
              <h2 className="text-lg font-semibold text-surface-900">Pending Invitations</h2>
              <p className="text-sm text-surface-500 mt-1">
                These people will be added when they sign up
              </p>
            </div>

            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="p-4 flex items-center justify-between border-b-2 border-surface-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{invitation.email}</p>
                    <p className="text-sm text-surface-500">
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge badge-warning">{invitation.role}</span>
                  <Form method="post">
                    <input type="hidden" name="intent" value="cancel-invitation" />
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost p-2 text-accent-600 hover:bg-accent-50"
                      title="Cancel invitation"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

