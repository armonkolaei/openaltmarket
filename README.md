# OpenAltMarket

OpenAltMarket is a production-oriented starter for an open marketplace of free and open-source alternatives to paid software.

Tagline: Discover. Fork. Customize.

Domain: https://openaltmarket.com

## Tech Stack

- Vue 3 + Composition API + script setup + TypeScript
- Vite
- Vue Router
- Pinia
- Tailwind CSS
- Firebase Authentication (client)
- Firebase Admin SDK (server)
- MongoDB Atlas using official MongoDB Node.js driver
- Vercel Functions under api/*
- Vitest for baseline automated tests

## Project Structure

```
api/                    # Vercel serverless API routes
backend/                # Shared backend modules (auth, db, utils, types)
src/                    # Vue application source
tests/                  # Vitest tests for auth/api helpers
vercel.json             # Vercel routing and SPA rewrite rules
```

## Features Included

- Responsive homepage with:
	- Navigation
	- Hero with search field
	- Featured alternatives
	- Category cards
	- How it works section
	- CTA and footer
- Authentication flows:
	- Email/password registration
	- Email/password login
	- Google sign-in
	- Password reset
	- Logout
	- Persistent auth state
	- Protected route for dashboard
- Secure profile synchronization to MongoDB via protected API endpoint
- Server-side Firebase token verification
- MongoDB connection caching for serverless environments

## Environment Variables

Copy .env.example to .env and fill values.

### Client-side (Vite)

- VITE_APP_NAME
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

### Server-side (Vercel Functions)

- MONGODB_URI
- MONGODB_DB_NAME (optional, defaults to openaltmarket)
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY

Important:
- Never commit real secrets.
- FIREBASE_PRIVATE_KEY must preserve newlines. In Vercel, paste with escaped newlines or multiline support.

## Local Development

Install dependencies:

```bash
npm install
```

Run frontend dev server:

```bash
npm run dev
```

Run local Vercel environment (frontend + api routes):

```bash
npm run dev:vercel
```

## Scripts

- npm run dev: run Vite frontend
- npm run build: typecheck and production build
- npm run typecheck: strict type checks for frontend/backend
- npm run test: run Vitest test suite
- npm run preview: preview built app

## Deployment to Vercel

1. Push this repository to GitHub.
2. Create a single Vercel project connected to this repository.
3. Add all required environment variables in Vercel Project Settings.
4. Deploy.

The vercel.json configuration:
- Serves frontend from dist output.
- Keeps api/* routes for functions.
- Rewrites non-API routes to index.html for Vue Router deep-link refresh support.

## Security Notes

- Client-provided role and uid are never trusted.
- Backend verifies Firebase ID token on protected routes.
- Profile sync endpoint derives uid/email from verified token.

## Initial API Endpoints

- GET /api/health
	- Basic health check.
- POST /api/users/sync
	- Requires Bearer Firebase ID token.
	- Upserts authenticated user profile in MongoDB.

## Tests Included

- Authorization header parsing and auth error cases
- HTTP method guard behavior
- User profile payload validation and mapping behavior

## Next Features Prepared (Not Implemented Yet)

- Submit open-source alternative
- Browse/search from MongoDB
- Link GitHub repositories
- Fork and deploy applications
- AI-assisted customization
- Public/private application instances