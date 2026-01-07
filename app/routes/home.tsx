import type { Route } from "./+types/home";
import { Link } from "react-router";
import { getCurrentUser } from "../lib/session.server";
import { Header } from "../components/Header";

export function meta() {
  return [
    { title: "Changelogs.cc — Beautiful Changelogs for Your Projects" },
    { name: "description", content: "Create and share beautiful changelogs for your projects. Track versions, collaborate with your team, and keep your users informed." },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request);
  return { user };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-surface-50">
      <Header user={user} />

      {/* Hero Section */}
      <section className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-in">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            Built for developers
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-surface-900 mb-4 sm:mb-6 animate-fade-in delay-1" style={{ opacity: 0 }}>
            Beautiful changelogs<br />
            <span className="text-primary-500">for your projects</span>
          </h1>
          
          <p className="text-base sm:text-xl text-surface-600 mb-8 sm:mb-10 max-w-2xl mx-auto animate-fade-in delay-2" style={{ opacity: 0 }}>
            Create, manage, and share changelogs effortlessly. Keep your users informed about every update with a clean, professional changelog page.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in delay-3" style={{ opacity: 0 }}>
            <Link to={user ? "/dashboard" : "/auth/login"} className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto">
              Get Started Free
            </Link>
            <Link to="/explore" className="btn btn-outline text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto">
              Browse Examples
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-white border-y-2 border-surface-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-surface-900 mb-3 sm:mb-4">
            Everything you need
          </h2>
          <p className="text-center text-surface-600 mb-10 sm:mb-16 max-w-xl mx-auto text-sm sm:text-base">
            A complete solution for managing your project's changelog history
          </p>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="card p-8 animate-fade-in delay-1" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-3">Markdown Editor</h3>
              <p className="text-surface-600">
                Write your changelogs in Markdown with a live preview. Support for code blocks, lists, and more.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 animate-fade-in delay-2" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-3">Team Collaboration</h3>
              <p className="text-surface-600">
                Invite team members by email to edit changelogs together. Real-time collaboration like Google Docs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 animate-fade-in delay-3" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-3">Analytics Dashboard</h3>
              <p className="text-surface-600">
                Track page views and visitor engagement. Understand how users interact with your changelogs.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-8 animate-fade-in delay-4" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-3">Public Pages</h3>
              <p className="text-surface-600">
                All changelogs are public and easily shareable. Perfect for keeping your users in the loop.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card p-8 animate-fade-in delay-5" style={{ opacity: 0 }}>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-3">Version Tracking</h3>
              <p className="text-surface-600">
                Organize releases by version numbers. Support for semantic versioning and custom formats.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card p-8 animate-fade-in" style={{ opacity: 0, animationDelay: "0.3s" }}>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-surface-900 mb-3">SSO Authentication</h3>
              <p className="text-surface-600">
                Secure sign-in with your existing identity provider. No passwords to manage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-surface-900 mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-surface-600 mb-10">
            Join thousands of developers who use Changelogs.cc to keep their users informed.
          </p>
          <Link to={user ? "/dashboard" : "/auth/login"} className="btn btn-primary text-lg px-10 py-4">
            Create Your First Changelog
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-surface-200 bg-white py-12 px-6">
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
