import type { Route } from "./+types/explore";
import { Link } from "react-router";
import { db } from "../lib/db.server";
import { getCurrentUser } from "../lib/session.server";
import { Header } from "../components/Header";

export function meta() {
  return [
    { title: "Explore Changelogs — Changelogs.cc" },
    { name: "description", content: "Discover public changelogs from various projects" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request);

  // Get projects with published changelogs
  const projects = await db.project.findMany({
    where: {
      changelogs: {
        some: { isDraft: false },
      },
    },
    include: {
      _count: {
        select: {
          changelogs: { where: { isDraft: false } },
          pageViews: true,
        },
      },
      changelogs: {
        where: { isDraft: false },
        orderBy: { publishedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return { user, projects };
}

export default function Explore({ loaderData }: Route.ComponentProps) {
  const { user, projects } = loaderData;

  return (
    <div className="min-h-screen bg-surface-50">
      <Header user={user} />

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Explore Changelogs</h1>
          <p className="text-surface-600">
            Discover public changelogs from various projects
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-surface-900 mb-2">No public changelogs yet</h2>
            <p className="text-surface-600 mb-6">Be the first to create and publish a changelog!</p>
            <Link to={user ? "/projects/new" : "/auth/login"} className="btn btn-primary">
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                to={`/${project.slug}`}
                className="card card-hover p-6 animate-fade-in"
                style={{ opacity: 0, animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  {project.logoUrl ? (
                    <img src={project.logoUrl} alt="" className="w-12 h-12 rounded-xl" />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-xl">
                        {project.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-surface-900 truncate">{project.name}</h2>
                    <p className="text-sm text-surface-500">/{project.slug}</p>
                  </div>
                </div>
                
                {project.description && (
                  <p className="text-surface-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {project.changelogs[0] && (
                  <div className="bg-surface-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-surface-500 mb-1">Latest release</p>
                    <p className="text-sm font-medium text-surface-900">
                      v{project.changelogs[0].version} — {project.changelogs[0].title}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-surface-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {project._count.changelogs} releases
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
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-surface-200 bg-white py-12 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-surface-700">Changelogs.cc</span>
          </div>
          <p className="text-surface-500 text-sm">
            © {new Date().getFullYear()} Changelogs.cc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

