import type { Route } from "./+types/$slug.$version";
import { Link } from "react-router";
import { db } from "../lib/db.server";
import { getCache, setCache, cacheKeys } from "../lib/cache.server";
import { createHash } from "crypto";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  StarFilledIcon,
  Share1Icon,
  FileTextIcon,
  ExternalLinkIcon,
} from "../components/Icons";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.changelog) {
    return [{ title: "Not Found — Changelogs.cc" }];
  }
  return [
    { title: `${data.changelog.title} (v${data.changelog.version}) — ${data.project.name}` },
    { name: "description", content: `${data.project.name} version ${data.changelog.version} changelog` },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { slug, version } = params;

  const project = await db.project.findUnique({
    where: { slug },
  });

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  const changelog = await db.changelog.findUnique({
    where: {
      projectId_version: {
        projectId: project.id,
        version: version!,
      },
    },
  });

  if (!changelog || changelog.isDraft) {
    throw new Response("Changelog not found", { status: 404 });
  }

  // Get adjacent changelogs for navigation
  const allChangelogs = await db.changelog.findMany({
    where: { projectId: project.id, isDraft: false },
    orderBy: { publishedAt: "desc" },
    select: { version: true, title: true },
  });

  const currentIndex = allChangelogs.findIndex((c: { version: string }) => c.version === version);
  const prevChangelog = currentIndex < allChangelogs.length - 1 ? allChangelogs[currentIndex + 1] : null;
  const nextChangelog = currentIndex > 0 ? allChangelogs[currentIndex - 1] : null;
  const isLatest = currentIndex === 0;

  // Track page view asynchronously
  const userAgent = request.headers.get("user-agent");
  const referer = request.headers.get("referer");
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || "unknown";
  const ipHash = createHash("sha256").update(ip + new Date().toDateString()).digest("hex");

  db.pageView.create({
    data: {
      projectId: project.id,
      changelogId: changelog.id,
      userAgent,
      referer,
      ipHash,
    },
  }).catch(() => {});

  return { project, changelog, prevChangelog, nextChangelog, isLatest };
}

export default function PublicChangelogDetail({ loaderData }: Route.ComponentProps) {
  const { project, changelog, prevChangelog, nextChangelog, isLatest } = loaderData;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link
              to={`/${project.slug}`}
              className="flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors group"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <div className="flex items-center gap-2">
                {project.logoUrl ? (
                  <img src={project.logoUrl} alt="" className="w-6 h-6 rounded-lg" />
                ) : (
                  <div className="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {project.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium hidden sm:inline">{project.name}</span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors"
                  title="Visit website"
                >
                  <ExternalLinkIcon className="w-5 h-5" />
                </a>
              )}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: changelog.title, url: shareUrl });
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }}
                className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors"
                title="Share"
              >
                <Share1Icon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article className="animate-fade-in" style={{ opacity: 0 }}>
          {/* Version Header */}
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
              <span className={`
                inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-semibold
                ${isLatest 
                  ? "bg-primary-500 text-white" 
                  : "bg-surface-200 text-surface-700"
                }
              `}>
                v{changelog.version}
              </span>
              {isLatest && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500 text-white">
                  <StarFilledIcon className="w-3.5 h-3.5" />
                  Latest Release
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-surface-900 mb-4 leading-tight">
              {changelog.title}
            </h1>

            <div className="flex items-center gap-4 text-surface-500">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                <time className="text-base">
                  {changelog.publishedAt
                    ? new Date(changelog.publishedAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </time>
              </div>
            </div>
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-2xl border-2 border-surface-200 overflow-hidden">
            <div className="px-6 sm:px-8 py-8 sm:py-10">
              <div className="prose-changelog max-w-none">
                <ReactMarkdown>{changelog.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </article>

        {/* Navigation */}
        <nav className="mt-10 sm:mt-12 grid grid-cols-2 gap-4">
          {prevChangelog ? (
            <Link
              to={`/${project.slug}/${prevChangelog.version}`}
              className="group p-4 sm:p-5 bg-white rounded-xl border-2 border-surface-200 hover:border-primary-300 transition-all"
            >
              <div className="flex items-center gap-2 text-surface-500 mb-2">
                <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Previous</span>
              </div>
              <p className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors truncate">
                v{prevChangelog.version}
              </p>
              <p className="text-sm text-surface-500 truncate">{prevChangelog.title}</p>
            </Link>
          ) : (
            <div />
          )}
          {nextChangelog ? (
            <Link
              to={`/${project.slug}/${nextChangelog.version}`}
              className="group p-4 sm:p-5 bg-white rounded-xl border-2 border-surface-200 hover:border-primary-300 transition-all text-right"
            >
              <div className="flex items-center justify-end gap-2 text-surface-500 mb-2">
                <span className="text-sm font-medium">Next</span>
                <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors truncate">
                v{nextChangelog.version}
              </p>
              <p className="text-sm text-surface-500 truncate">{nextChangelog.title}</p>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-surface-50 py-10 px-4 sm:px-6 mt-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center">
                <FileTextIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-surface-700">Changelogs.cc</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-surface-500">
              <Link to={`/${project.slug}`} className="hover:text-primary-600 transition-colors">
                All Releases
              </Link>
              <Link to={`/${project.slug}/latest`} className="hover:text-primary-600 transition-colors">
                Latest
              </Link>
              <Link to="/" className="hover:text-primary-600 transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
