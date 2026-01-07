import type { Route } from "./+types/dashboard";
import { Link } from "react-router";
import { requireUser } from "../lib/session.server";
import { db } from "../lib/db.server";
import { DashboardHeader } from "../components/Header";

export function meta() {
  return [{ title: "Dashboard — Changelogs.cc" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);

  // Get user's owned projects
  const ownedProjects = await db.project.findMany({
    where: { ownerId: user.id },
    include: {
      _count: { select: { changelogs: true, pageViews: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get projects where user is a collaborator
  const collaborations = await db.collaborator.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          _count: { select: { changelogs: true } },
          owner: { select: { name: true, email: true } },
        },
      },
    },
  });

  return { user, ownedProjects, collaborations };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, ownedProjects, collaborations } = loaderData;

  return (
    <div className="min-h-screen bg-surface-50">
      <DashboardHeader user={user} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 mb-2">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-surface-600">
            Manage your projects and changelogs from here.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-surface-900">Your Projects</h2>
          <Link to="/projects/new" className="btn btn-primary text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {/* Projects Grid */}
        {ownedProjects.length === 0 && collaborations.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-surface-900 mb-2">No projects yet</h3>
            <p className="text-surface-600 mb-6">Create your first project to start tracking changelogs.</p>
            <Link to="/projects/new" className="btn btn-primary">
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Owned Projects */}
            {ownedProjects.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedProjects.map((project: typeof ownedProjects[number], index: number) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.slug}`}
                    className="card card-hover p-6 animate-fade-in"
                    style={{ opacity: 0, animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        {project.logoUrl ? (
                          <img src={project.logoUrl} alt="" className="w-8 h-8 rounded" />
                        ) : (
                          <span className="text-primary-600 font-bold text-lg">
                            {project.name[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="badge badge-primary">Owner</span>
                    </div>
                    <h3 className="text-lg font-semibold text-surface-900 mb-1">{project.name}</h3>
                    <p className="text-sm text-surface-500 mb-4 line-clamp-2">
                      {project.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-surface-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {project._count.changelogs} changelogs
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {project._count.pageViews} views
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Collaborations */}
            {collaborations.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-surface-900 mb-6">Shared with you</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collaborations.map((collab: typeof collaborations[number], index: number) => (
                    <Link
                      key={collab.id}
                      to={`/projects/${collab.project.slug}`}
                      className="card card-hover p-6 animate-fade-in"
                      style={{ opacity: 0, animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                          {collab.project.logoUrl ? (
                            <img src={collab.project.logoUrl} alt="" className="w-8 h-8 rounded" />
                          ) : (
                            <span className="text-success-600 font-bold text-lg">
                              {collab.project.name[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="badge badge-success">{collab.role}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-surface-900 mb-1">{collab.project.name}</h3>
                      <p className="text-sm text-surface-500 mb-4">
                        Owned by {collab.project.owner.name || collab.project.owner.email}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-surface-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {collab.project._count.changelogs} changelogs
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

