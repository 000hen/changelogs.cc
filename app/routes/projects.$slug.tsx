import type { Route } from "./+types/projects.$slug";
import { Link } from "react-router";
import { requireUser } from "../lib/session.server";
import { db } from "../lib/db.server";
import { useState } from "react";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.project ? `${data.project.name} — Changelogs.cc` : "Project — Changelogs.cc" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { slug } = params;

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      changelogs: {
        orderBy: { createdAt: "desc" },
      },
      collaborators: {
        include: {
          user: { select: { id: true, name: true, email: true, picture: true } },
        },
      },
      _count: { select: { pageViews: true } },
    },
  });

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  // Check if user has access
  const isOwner = project.ownerId === user.id;
  const collaboration = project.collaborators.find((c) => c.userId === user.id);
  const hasAccess = isOwner || !!collaboration;

  if (!hasAccess) {
    throw new Response("Access denied", { status: 403 });
  }

  return { project, user, isOwner, role: isOwner ? "OWNER" : collaboration?.role };
}

export default function ProjectDetail({ loaderData }: Route.ComponentProps) {
  const { project, isOwner, role } = loaderData;
  const canEdit = isOwner || role === "EDITOR";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publishedChangelogs = project.changelogs.filter((c) => !c.isDraft);
  const draftChangelogs = project.changelogs.filter((c) => c.isDraft);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="border-b-2 border-surface-200 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to="/dashboard" className="btn btn-ghost p-2 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {project.logoUrl ? (
                    <img src={project.logoUrl} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded" />
                  ) : (
                    <span className="text-primary-600 font-bold text-sm sm:text-base">
                      {project.name[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-semibold text-surface-900 truncate">{project.name}</h1>
                  <p className="text-xs sm:text-sm text-surface-500 truncate">/{project.slug}</p>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to={`/${project.slug}`}
                target="_blank"
                className="btn btn-ghost text-sm"
              >
                <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Public
              </Link>
              {isOwner && (
                <>
                  <Link to={`/projects/${project.slug}/analytics`} className="btn btn-secondary text-sm">
                    <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </Link>
                  <Link to={`/projects/${project.slug}/settings`} className="btn btn-secondary text-sm">
                    <svg className="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-surface-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-surface-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-surface-200 bg-white absolute top-full left-0 right-0 z-50">
            <nav className="flex flex-col p-4 gap-2">
              <Link
                to={`/${project.slug}`}
                target="_blank"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-100 text-surface-700 font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Public Page
              </Link>
              {isOwner && (
                <>
                  <Link
                    to={`/projects/${project.slug}/analytics`}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-100 text-surface-700 font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </Link>
                  <Link
                    to={`/projects/${project.slug}/settings`}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-100 text-surface-700 font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Project Info */}
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              {project.description && (
                <p className="text-surface-600 mb-3 sm:mb-4 text-sm sm:text-base">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Website
                  </a>
                )}
                <span className="text-surface-500">
                  {project._count.pageViews} views
                </span>
                <span className="text-surface-500">
                  {project.changelogs.length} changelogs
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`badge ${isOwner ? "badge-primary" : "badge-success"}`}>
                {isOwner ? "Owner" : role}
              </span>
            </div>
          </div>
        </div>

        {/* Changelogs Section */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-surface-900">Changelogs</h2>
          {canEdit && (
            <Link to={`/projects/${project.slug}/changelogs/new`} className="btn btn-primary text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Changelog</span>
              <span className="sm:hidden">New</span>
            </Link>
          )}
        </div>

        {/* Drafts */}
        {draftChangelogs.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-xs sm:text-sm font-medium text-surface-500 uppercase tracking-wide mb-3 sm:mb-4">Drafts</h3>
            <div className="space-y-3">
              {draftChangelogs.map((changelog) => (
                <Link
                  key={changelog.id}
                  to={`/projects/${project.slug}/changelogs/${changelog.id}`}
                  className="card card-hover p-4 sm:p-5 flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <span className="badge badge-draft w-fit">Draft</span>
                    <div className="min-w-0">
                      <h4 className="font-medium text-surface-900 text-sm sm:text-base truncate">
                        v{changelog.version} — {changelog.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-surface-500">
                        Updated {new Date(changelog.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Published */}
        {publishedChangelogs.length > 0 ? (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-surface-500 uppercase tracking-wide mb-3 sm:mb-4">Published</h3>
            <div className="space-y-3">
              {publishedChangelogs.map((changelog, index) => (
                <Link
                  key={changelog.id}
                  to={`/projects/${project.slug}/changelogs/${changelog.id}`}
                  className="card card-hover p-4 sm:p-5 flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="badge badge-success text-xs">Published</span>
                      {index === 0 && (
                        <span className="badge bg-emerald-500 text-white text-xs">Latest</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-surface-900 text-sm sm:text-base truncate">
                        v{changelog.version} — {changelog.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-surface-500">
                        {changelog.publishedAt ? new Date(changelog.publishedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ) : draftChangelogs.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-surface-900 mb-2">No changelogs yet</h3>
            <p className="text-surface-600 mb-6">Create your first changelog to get started.</p>
            {canEdit && (
              <Link to={`/projects/${project.slug}/changelogs/new`} className="btn btn-primary">
                Create First Changelog
              </Link>
            )}
          </div>
        ) : null}

        {/* Collaborators Section */}
        {isOwner && (
          <div className="mt-8 sm:mt-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-surface-900">Team</h2>
              <Link to={`/projects/${project.slug}/collaborators`} className="btn btn-secondary text-sm">
                <svg className="w-4 h-4 mr-1 sm:mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Invite People</span>
                <span className="sm:hidden">Invite</span>
              </Link>
            </div>
            
            <div className="card divide-y-2 divide-surface-100">
              {/* Owner */}
              <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-medium text-sm sm:text-base">
                      {project.owner.name?.[0] || project.owner.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-surface-900 text-sm sm:text-base truncate">{project.owner.name || project.owner.email}</p>
                    <p className="text-xs sm:text-sm text-surface-500 truncate">{project.owner.email}</p>
                  </div>
                </div>
                <span className="badge badge-primary flex-shrink-0">Owner</span>
              </div>
              
              {/* Collaborators */}
              {project.collaborators.map((collab) => (
                <div key={collab.id} className="p-3 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {collab.user.picture ? (
                      <img src={collab.user.picture} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-success-600 font-medium text-sm sm:text-base">
                          {collab.user.name?.[0] || collab.user.email[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-surface-900 text-sm sm:text-base truncate">{collab.user.name || collab.user.email}</p>
                      <p className="text-xs sm:text-sm text-surface-500 truncate">{collab.user.email}</p>
                    </div>
                  </div>
                  <span className="badge badge-success flex-shrink-0">{collab.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

