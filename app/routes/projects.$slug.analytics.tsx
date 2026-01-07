import type { Route } from "./+types/projects.$slug.analytics";
import { Link } from "react-router";
import { requireUser } from "../lib/session.server";
import { db } from "../lib/db.server";

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data?.project ? `Analytics — ${data.project.name}` : "Analytics — Changelogs.cc" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { slug } = params;

  const project = await db.project.findUnique({
    where: { slug },
    include: {
      changelogs: {
        where: { isDraft: false },
        orderBy: { publishedAt: "desc" },
        select: { id: true, version: true, title: true },
      },
    },
  });

  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  if (project.ownerId !== user.id) {
    throw new Response("Only the owner can view analytics", { status: 403 });
  }

  // Get date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  // Total views
  const totalViews = await db.pageView.count({
    where: { projectId: project.id },
  });

  // Views in last 30 days
  const recentViews = await db.pageView.count({
    where: {
      projectId: project.id,
      timestamp: { gte: startDate },
    },
  });

  // Unique visitors (by ipHash) in last 30 days
  const uniqueVisitors = await db.pageView.groupBy({
    by: ["ipHash"],
    where: {
      projectId: project.id,
      timestamp: { gte: startDate },
      ipHash: { not: null },
    },
  });

  // Views per day for chart
  const viewsPerDay = await db.pageView.groupBy({
    by: ["timestamp"],
    where: {
      projectId: project.id,
      timestamp: { gte: startDate },
    },
    _count: true,
    orderBy: { timestamp: "asc" },
  });

  // Process views per day into date buckets
  const dailyViews: Record<string, number> = {};
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dailyViews[d.toISOString().split("T")[0]] = 0;
  }
  
  for (const view of viewsPerDay) {
    const dateKey = new Date(view.timestamp).toISOString().split("T")[0];
    if (dailyViews[dateKey] !== undefined) {
      dailyViews[dateKey]++;
    }
  }

  // Top referrers
  const referrers = await db.pageView.groupBy({
    by: ["referer"],
    where: {
      projectId: project.id,
      timestamp: { gte: startDate },
      referer: { not: null },
    },
    _count: true,
    orderBy: { _count: { referer: "desc" } },
    take: 10,
  });

  // Views per changelog
  const changelogViews = await db.pageView.groupBy({
    by: ["changelogId"],
    where: {
      projectId: project.id,
      changelogId: { not: null },
    },
    _count: true,
    orderBy: { _count: { changelogId: "desc" } },
    take: 10,
  });

  // Map changelog IDs to info
  const changelogViewsWithInfo = changelogViews
    .map((cv) => {
      const changelog = project.changelogs.find((c) => c.id === cv.changelogId);
      return changelog ? { ...changelog, views: cv._count } : null;
    })
    .filter(Boolean);

  return {
    project,
    stats: {
      totalViews,
      recentViews,
      uniqueVisitors: uniqueVisitors.length,
      dailyViews: Object.entries(dailyViews).map(([date, count]) => ({ date, count })),
      referrers: referrers.map((r) => ({
        url: r.referer || "Direct",
        count: r._count,
      })),
      changelogViews: changelogViewsWithInfo,
    },
  };
}

export default function Analytics({ loaderData }: Route.ComponentProps) {
  const { project, stats } = loaderData;

  // Calculate max for chart scaling
  const maxDailyViews = Math.max(...stats.dailyViews.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="border-b-2 border-surface-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to={`/projects/${project.slug}`} className="btn btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-surface-900">Analytics</h1>
            <p className="text-sm text-surface-500">{project.name}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="card p-6 animate-fade-in" style={{ opacity: 0 }}>
            <p className="text-sm font-medium text-surface-500 mb-1">Total Views</p>
            <p className="text-4xl font-bold text-surface-900">{stats.totalViews.toLocaleString()}</p>
            <p className="text-sm text-surface-500 mt-1">All time</p>
          </div>
          <div className="card p-6 animate-fade-in delay-1" style={{ opacity: 0 }}>
            <p className="text-sm font-medium text-surface-500 mb-1">Recent Views</p>
            <p className="text-4xl font-bold text-primary-600">{stats.recentViews.toLocaleString()}</p>
            <p className="text-sm text-surface-500 mt-1">Last 30 days</p>
          </div>
          <div className="card p-6 animate-fade-in delay-2" style={{ opacity: 0 }}>
            <p className="text-sm font-medium text-surface-500 mb-1">Unique Visitors</p>
            <p className="text-4xl font-bold text-success-600">{stats.uniqueVisitors.toLocaleString()}</p>
            <p className="text-sm text-surface-500 mt-1">Last 30 days</p>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-6 mb-10 animate-fade-in delay-3" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold text-surface-900 mb-6">Views Over Time</h2>
          <div className="h-64 flex items-end gap-1">
            {stats.dailyViews.map((day, index) => (
              <div
                key={day.date}
                className="flex-1 group relative"
              >
                <div
                  className="bg-primary-400 hover:bg-primary-500 transition-colors rounded-t"
                  style={{
                    height: `${Math.max((day.count / maxDailyViews) * 100, 2)}%`,
                    minHeight: "2px",
                  }}
                />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block">
                  <div className="bg-surface-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {day.count} views
                    <br />
                    {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-surface-500">
            <span>
              {new Date(stats.dailyViews[0]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span>
              {new Date(stats.dailyViews[stats.dailyViews.length - 1]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Referrers */}
          <div className="card p-6 animate-fade-in delay-4" style={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold text-surface-900 mb-6">Top Referrers</h2>
            {stats.referrers.length === 0 ? (
              <p className="text-surface-500 text-center py-8">No referrer data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.referrers.map((ref, index) => {
                  const maxCount = stats.referrers[0]?.count || 1;
                  const hostname = ref.url !== "Direct" ? new URL(ref.url).hostname : "Direct";
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-surface-700 truncate max-w-[200px]" title={ref.url}>
                            {hostname}
                          </span>
                          <span className="text-sm font-medium text-surface-900">{ref.count}</span>
                        </div>
                        <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-400 rounded-full"
                            style={{ width: `${(ref.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Changelogs */}
          <div className="card p-6 animate-fade-in delay-5" style={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold text-surface-900 mb-6">Most Viewed Changelogs</h2>
            {stats.changelogViews.length === 0 ? (
              <p className="text-surface-500 text-center py-8">No changelog views yet</p>
            ) : (
              <div className="space-y-3">
                {stats.changelogViews.map((changelog: any, index: number) => {
                  const maxCount = (stats.changelogViews[0] as any)?.views || 1;
                  return (
                    <div key={changelog.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-surface-700">
                            <span className="font-medium">v{changelog.version}</span> — {changelog.title}
                          </span>
                          <span className="text-sm font-medium text-surface-900">{changelog.views}</span>
                        </div>
                        <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success-400 rounded-full"
                            style={{ width: `${(changelog.views / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

