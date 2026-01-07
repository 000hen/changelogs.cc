import { Link } from "react-router";
import { useState } from "react";

interface HeaderProps {
  user?: {
    id: string;
    name?: string | null;
    email: string;
    picture?: string | null;
  } | null;
  variant?: "default" | "minimal";
}

export function Header({ user, variant = "default" }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b-2 border-surface-200 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-surface-900 hidden sm:inline">Changelogs.cc</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
              <Link to="/auth/logout" className="btn btn-secondary">Sign Out</Link>
            </>
          ) : (
            <Link to="/auth/login" className="btn btn-primary">Sign In</Link>
          )}
        </nav>

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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-surface-200 bg-white absolute top-full left-0 right-0 z-50">
          <nav className="flex flex-col p-4 gap-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-3 rounded-lg hover:bg-surface-100 text-surface-700 font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/auth/logout"
                  className="px-4 py-3 rounded-lg hover:bg-surface-100 text-surface-700 font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Out
                </Link>
              </>
            ) : (
              <Link
                to="/auth/login"
                className="px-4 py-3 rounded-lg bg-primary-500 text-white font-medium text-center transition-colors hover:bg-primary-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

interface DashboardHeaderProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    picture?: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b-2 border-surface-200 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-surface-900 hidden sm:inline">Changelogs.cc</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-surface-700 hidden lg:inline">{user.name || user.email}</span>
          </div>
          <Link to="/auth/logout" className="btn btn-ghost text-sm">Sign Out</Link>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-surface-200 bg-white absolute top-full left-0 right-0 z-50">
          <div className="p-4 border-b-2 border-surface-100">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-surface-900">{user.name || "User"}</p>
                <p className="text-sm text-surface-500">{user.email}</p>
              </div>
            </div>
          </div>
          <nav className="flex flex-col p-4 gap-2">
            <Link
              to="/dashboard"
              className="px-4 py-3 rounded-lg hover:bg-surface-100 text-surface-700 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/auth/logout"
              className="px-4 py-3 rounded-lg hover:bg-surface-100 text-surface-700 font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Out
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

