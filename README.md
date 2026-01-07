# Changelogs.cc

> [!NOTE]
> This is built with an AI Agent. I cannot promise the safety of this project. Use it at your own risk.

A modern changelog management platform with OIDC authentication, team collaboration, and analytics.

## Features

- 📝 **Markdown Changelogs** - Write beautiful changelogs with a live preview editor
- 🔐 **SSO Authentication** - Sign in with your existing identity provider (OIDC)
- 👥 **Team Collaboration** - Invite collaborators by email, just like Google Docs
- 📊 **Analytics Dashboard** - Track page views and visitor engagement
- 🌐 **Public Changelog Pages** - Share your changelogs with anyone
- 🏷️ **Version Tracking** - Organize releases by semantic version numbers

## Tech Stack

- **Frontend**: React 19, React Router 7, Tailwind CSS 4
- **Backend**: React Router (SSR)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: OpenID Connect (OIDC)
- **Editor**: @uiw/react-md-editor

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- OIDC Identity Provider (e.g., Auth0, Keycloak, Okta)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/changelogs.cc.git
cd changelogs.cc
```

2. Install dependencies:
```bash
yarn install
```

3. Copy the environment file and configure:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `OIDC_ISSUER` - Your OIDC provider's issuer URL
   - `OIDC_CLIENT_ID` - Your OIDC client ID
   - `OIDC_CLIENT_SECRET` - Your OIDC client secret
   - `BASE_URL` - Your application's URL (for callback)
   - `SESSION_SECRET` - A secure random string for session encryption

5. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma db push
```

6. Start the development server:
```bash
yarn dev
```

Visit `http://localhost:5173` to see the application.

## OIDC Configuration

Configure your identity provider with the following callback URL:
```
{BASE_URL}/auth/callback
```

Required scopes: `openid`, `email`, `profile`

### Example Providers

**Auth0:**
- Issuer: `https://your-tenant.auth0.com/`
- Callback URL: `http://localhost:5173/auth/callback`

**Keycloak:**
- Issuer: `https://your-keycloak.com/realms/your-realm`
- Callback URL: `http://localhost:5173/auth/callback`

## Project Structure

```
app/
├── lib/                  # Server utilities
│   ├── auth.server.ts    # OIDC authentication
│   ├── db.server.ts      # Prisma client
│   └── session.server.ts # Session management
├── routes/               # Route components
│   ├── home.tsx          # Landing page
│   ├── dashboard.tsx     # User dashboard
│   ├── explore.tsx       # Public changelogs
│   ├── projects.*        # Project management
│   ├── auth.*            # Authentication
│   └── $slug.*           # Public changelog pages
├── app.css               # Global styles
├── root.tsx              # Root layout
└── routes.ts             # Route configuration
prisma/
└── schema.prisma         # Database schema
```

## Design Philosophy

This application follows a **flat design** approach:
- Clean, borderless UI elements
- No shadows or gradients
- Consistent spacing and typography
- Color accents for hierarchy

## Deployment

### Docker

```bash
docker build -t changelogs .
docker run -p 3000:3000 --env-file .env changelogs
```

### Environment Variables for Production

Make sure to set:
- `NODE_ENV=production`
- A strong `SESSION_SECRET`
- Your production `BASE_URL`

## License

MIT
