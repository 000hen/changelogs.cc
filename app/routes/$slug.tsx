import type { Route } from "./+types/$slug";
import { Link } from "react-router";
import { db } from "../lib/db.server";
import { getCache, setCache, cacheKeys } from "../lib/cache.server";
import { createHash } from "crypto";
import ReactMarkdown from "react-markdown";
import {
  GlobeIcon,
  FileTextIcon,
  RocketIcon,
  CheckCircledIcon,
  StarFilledIcon,
  CalendarIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
} from "../components/Icons";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.project) {
    return [{ title: "Not Found — Changelogs.cc" }];
  }
  return [
    { title: `${data.project.name} Changelog — Changelogs.cc` },
    { name: "description", content: data.project.description || `Changelog for ${data.project.name}` },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { slug } = params;

  // Try cache first
  const cacheKey = cacheKeys.projectChangelogs(slug!);
  
  const projectData = await db.project.findUnique({
    where: { slug },
    include: {
      changelogs: {
        where: { isDraft: false },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  if (!projectData) {
    throw new Response("Project not found", { status: 404 });
  }

  const project = projectData;

  // Track page view asynchronously (don't block response)
  const userAgent = request.headers.get("user-agent");
  const referer = request.headers.get("referer");
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || "unknown";
  const ipHash = createHash("sha256").update(ip + new Date().toDateString()).digest("hex");

  db.pageView.create({
    data: {
      projectId: project.id,
      userAgent,
      referer,
      ipHash,
    },
  }).catch(() => {});

  return { project };
}

export default function PublicChangelog({ loaderData }: Route.ComponentProps) {
  const { project } = loaderData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-6 inline-block">
              {project.logoUrl ? (
                <img 
                  src={project.logoUrl} 
                  alt={project.name} 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white mx-auto"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center border-4 border-white mx-auto">
                  <span className="text-white font-bold text-3xl sm:text-4xl">
                    {project.name[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-surface-900 mb-3">
              {project.name}
            </h1>
            
            {project.description && (
              <p className="text-lg sm:text-xl text-surface-600 max-w-2xl mx-auto mb-6">
                {project.description}
              </p>
            )}

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-surface-500">
              <div className="flex items-center gap-2">
                <FileTextIcon className="w-4 h-4" />
                <span>{project.changelogs.length} releases</span>
              </div>
              {project.changelogs[0] && (
                <div className="flex items-center gap-2">
                  <RocketIcon className="w-4 h-4" />
                  <span>Latest: v{project.changelogs[0].version}</span>
                </div>
              )}
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <GlobeIcon className="w-4 h-4" />
                  <span>Website</span>
                  <ExternalLinkIcon className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Version Navigation Pills */}
      {project.changelogs.length > 0 && (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-surface-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-medium text-surface-500 uppercase tracking-wide flex-shrink-0">
                Versions:
              </span>
              {project.changelogs.slice(0, 8).map((changelog: typeof project.changelogs[number], index: number) => (
                <a
                  key={changelog.id}
                  href={`#v${changelog.version}`}
                  className={`
                    flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${index === 0 
                      ? "bg-primary-500 text-white" 
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                    }
                  `}
                >
                  {index === 0 && <StarFilledIcon className="w-3 h-3 inline mr-1" />}
                  v{changelog.version}
                </a>
              ))}
              {project.changelogs.length > 8 && (
                <span className="flex-shrink-0 text-sm text-surface-400">
                  +{project.changelogs.length - 8} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Changelog Timeline */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {project.changelogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileTextIcon className="w-10 h-10 text-surface-400" />
            </div>
            <h2 className="text-2xl font-semibold text-surface-900 mb-3">No releases yet</h2>
            <p className="text-surface-600 max-w-md mx-auto">
              This project hasn't published any changelogs yet. Check back soon for updates!
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-400 via-surface-200 to-surface-100" />

            {/* Changelog entries */}
            <div className="space-y-8 sm:space-y-12">
              {project.changelogs.map((changelog: typeof project.changelogs[number], index: number) => (
                <article
                  key={changelog.id}
                  id={`v${changelog.version}`}
                  className="relative pl-12 sm:pl-16 animate-fade-in"
                  style={{ opacity: 0, animationDelay: `${index * 0.05}s` }}
                >
                  {/* Timeline dot */}
                  <div className={`
                    absolute left-0 sm:left-2 w-8 h-8 rounded-full flex items-center justify-center
                    ${index === 0 
                      ? "bg-primary-500 text-white ring-4 ring-primary-100" 
                      : "bg-white border-2 border-surface-300 text-surface-400"
                    }
                  `}>
                    {index === 0 ? (
                      <StarFilledIcon className="w-4 h-4" />
                    ) : (
                      <CheckCircledIcon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Version card */}
                  <div className={`
                    bg-white rounded-2xl border-2 overflow-hidden transition-all
                    ${index === 0 
                      ? "border-primary-200 ring-1 ring-primary-100" 
                      : "border-surface-200 hover:border-surface-300"
                    }
                  `}>
                    {/* Card header */}
                    <div className={`
                      px-5 sm:px-6 py-4 border-b
                      ${index === 0 ? "bg-primary-50 border-primary-100" : "bg-surface-50 border-surface-100"}
                    `}>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <span className={`
                          inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold
                          ${index === 0 
                            ? "bg-primary-500 text-white" 
                            : "bg-surface-200 text-surface-700"
                          }
                        `}>
                          v{changelog.version}
                        </span>
                        {index === 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
                            <StarFilledIcon className="w-3 h-3" />
                            Latest
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-sm text-surface-500">
                          <CalendarIcon className="w-4 h-4" />
                          <time>
                            {changelog.publishedAt
                              ? new Date(changelog.publishedAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : ""}
                          </time>
                        </div>
                      </div>
                      <Link
                        to={`/${project.slug}/${changelog.version}`}
                        className="group inline-flex items-center gap-2"
                      >
                        <h2 className="text-xl sm:text-2xl font-bold text-surface-900 group-hover:text-primary-600 transition-colors">
                          {changelog.title}
                        </h2>
                        <ChevronRightIcon className="w-5 h-5 text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </div>

                    {/* Card content */}
                    <div className="px-5 sm:px-6 py-5">
                      <div className="prose-changelog">
                        <ReactMarkdown>{changelog.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-surface-50 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center">
                <FileTextIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-surface-700">Changelogs.cc</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-surface-500">
              <Link to="/" className="hover:text-primary-600 transition-colors">
                Home
              </Link>
              <Link to="/explore" className="hover:text-primary-600 transition-colors">
                Explore
              </Link>
              <a 
                href={`/${project.slug}/latest`}
                className="hover:text-primary-600 transition-colors"
              >
                Latest Release
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-surface-200 text-center">
            <p className="text-sm text-surface-400">
              © {new Date().getFullYear()} {project.name}. Changelog powered by{" "}
              <Link to="/" className="text-primary-600 hover:text-primary-700 transition-colors">
                Changelogs.cc
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
