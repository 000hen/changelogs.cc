import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public routes
  index("routes/home.tsx"),
  route("explore", "routes/explore.tsx"),
  
  // Auth routes
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),
  
  // Dashboard
  route("dashboard", "routes/dashboard.tsx"),
  
  // Project management
  route("projects/new", "routes/projects.new.tsx"),
  route("projects/:slug", "routes/projects.$slug.tsx"),
  route("projects/:slug/settings", "routes/projects.$slug.settings.tsx"),
  route("projects/:slug/analytics", "routes/projects.$slug.analytics.tsx"),
  route("projects/:slug/collaborators", "routes/projects.$slug.collaborators.tsx"),
  route("projects/:slug/changelogs/new", "routes/projects.$slug.changelogs.new.tsx"),
  route("projects/:slug/changelogs/:id", "routes/projects.$slug.changelogs.$id.tsx"),
  
  // Public changelog pages (must be last to avoid conflicts)
  route(":slug/latest", "routes/$slug.latest.tsx"),
  route(":slug/:version", "routes/$slug.$version.tsx"),
  route(":slug", "routes/$slug.tsx"),
] satisfies RouteConfig;
