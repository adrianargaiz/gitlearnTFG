# GitLearn — Project Intelligence

## What is this project
GitLearn is a full-stack interactive web platform for learning Git and GitHub, with Duolingo-style gamification mechanics. Users progress through structured lesson levels, complete interactive exercises, earn XP, maintain daily streaks, and unlock achievement badges.

- **Student:** Adrián Argaiz Martínez
- **Academic context:** TFG — Ciclo Formativo Grado Superior DAW, IES Comercio, 2025–2026
- **Tutor:** Rafael

---

## Stack — Non-negotiable
- **Frontend:** Angular 21 + Angular Material + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Auth:** Passport.js + JWT + GitHub OAuth 2.0
- **Database:** MongoDB + Mongoose
- **Deployment:** Docker + docker-compose
- **Language:** TypeScript everywhere (frontend and backend)

Never suggest replacing any part of this stack. Never use React, Vue, SQL databases, or any alternative framework.

---

## Repository structure
```
gitlearn/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Guards, interceptors, auth service
│   │   │   ├── shared/         # Reusable components, pipes, directives
│   │   │   ├── features/
│   │   │   │   ├── auth/       # Login, register, OAuth callback
│   │   │   │   ├── lessons/    # Lesson map, lesson view, exercise
│   │   │   │   ├── progress/   # Progress page, badges, stats
│   │   │   │   ├── teacher/    # Teacher dashboard, lesson editor
│   │   │   │   └── admin/      # Admin dashboard, user management
│   │   │   └── app.routes.ts
│   │   ├── environments/
│   │   └── styles/             # Global Tailwind + theme variables
├── backend/
│   ├── src/
│   │   ├── controllers/        # Auth, lessons, progress, admin
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express routers
│   │   ├── middlewares/        # JWT auth, role guard, error handler
│   │   ├── services/           # Business logic layer
│   │   └── app.ts              # Express app setup
├── docker-compose.yml
├── README.md
└── CLAUDE.md
```

---

## User roles
| Role | Permissions |
|---|---|
| `estudiante` | Access lessons, complete exercises, view own progress and badges |
| `profesor` | All student permissions + create/edit/delete own lessons and exercises |
| `administrador` | Full access: manage all users, roles, and content |

Role is stored in the JWT payload and validated server-side on every protected route via middleware.

---

## Data models — MongoDB collections

### usuarios
```typescript
{
  _id: ObjectId,
  nombre: string,
  email: string,
  passwordHash: string,        // bcrypt
  githubId: string,            // nullable, for OAuth users
  rol: 'estudiante' | 'profesor' | 'administrador',
  fechaRegistro: Date,
  racha: number,               // current daily streak
  xpTotal: number,
  insignias: ObjectId[],       // refs to insignias
  activo: boolean
}
```

### lecciones
```typescript
{
  _id: ObjectId,
  titulo: string,
  descripcion: string,
  nivel: 'básico' | 'intermedio' | 'avanzado' | 'experto',
  estado: 'borrador' | 'publicada' | 'archivada',
  autorId: ObjectId,           // ref to usuarios
  fechaCreacion: Date,
  xpRecompensa: number,
  orden: number                // position within its level
}
```

### ejercicios
```typescript
{
  _id: ObjectId,
  leccionId: ObjectId,         // ref to lecciones
  tipo: 'opcionMultiple' | 'rellenarHuecos' | 'arrastrarSoltar',
  enunciado: string,
  opciones: string[],          // for opcionMultiple and arrastrarSoltar
  respuestaCorrecta: string,   // or array for arrastrarSoltar
  explicacion: string,         // shown after answering
  orden: number
}
```

### progresos
```typescript
{
  _id: ObjectId,
  usuarioId: ObjectId,
  leccionId: ObjectId,
  completada: boolean,
  fechaCompletado: Date,
  xpObtenido: number,
  intentos: number
}
```

### insignias
```typescript
{
  _id: ObjectId,
  nombre: string,
  descripcion: string,
  icono: string,               // emoji or icon identifier
  condicion: string            // e.g. 'primera_leccion', 'racha_7'
}
```

---

## API REST — Defined endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/github
GET    /api/auth/github/callback
POST   /api/auth/logout

GET    /api/lecciones                     → public, only 'publicada'
GET    /api/lecciones/:id
POST   /api/lecciones                     → requires 'profesor' role
PUT    /api/lecciones/:id                 → requires 'profesor' role, own lesson only
DELETE /api/lecciones/:id                 → requires 'profesor' role

GET    /api/ejercicios/:leccionId
POST   /api/ejercicios                    → requires 'profesor' role
PUT    /api/ejercicios/:id
DELETE /api/ejercicios/:id

GET    /api/progreso/:usuarioId           → own progress or admin
POST   /api/progreso                      → register completed lesson

GET    /api/insignias
GET    /api/insignias/:usuarioId

GET    /api/admin/usuarios                → requires 'administrador' role
PUT    /api/admin/usuarios/:id/rol
PUT    /api/admin/usuarios/:id/estado
GET    /api/admin/lecciones              → all lessons regardless of estado
PUT    /api/admin/lecciones/:id/estado
```

---

## Auth flow
1. **Own auth:** POST /api/auth/login → validates bcrypt → returns JWT
2. **GitHub OAuth:** GET /api/auth/github → Passport redirects to GitHub → callback → creates or finds user → returns JWT
3. **JWT:** stored in localStorage on frontend, sent as `Authorization: Bearer <token>` header on every request
4. **Angular guard:** `AuthGuard` checks token validity and role before activating routes
5. **Express middleware:** `authMiddleware` validates JWT on protected routes, `roleMiddleware('profesor')` checks role

---

## Angular routing structure
```
/                          → landing (public)
/login                     → login page (public)
/register                  → register page (public)
/auth/github/callback      → OAuth callback handler

/app/dashboard             → student dashboard (requires 'estudiante')
/app/lecciones             → lesson map (requires 'estudiante')
/app/lecciones/:id         → lesson view + exercises (requires 'estudiante')
/app/progreso              → progress page (requires 'estudiante')

/profesor/dashboard        → teacher dashboard (requires 'profesor')
/profesor/lecciones        → my lessons list (requires 'profesor')
/profesor/lecciones/nueva  → create lesson (requires 'profesor')
/profesor/lecciones/:id    → edit lesson (requires 'profesor')

/admin/dashboard           → admin dashboard (requires 'administrador')
/admin/usuarios            → user management (requires 'administrador')
/admin/contenido           → content moderation (requires 'administrador')
```

---

## Design system
- **Theme:** dark only

### Paleta base
- **Background (page):** `#0F1115`
- **Surface (cards, panels, inputs raised):** `#181B20`
- **Surface elevated / hover (rows, dropdowns, button bg):** `#22262D`
- **Borders / dividers:** `#2C313A`

### Texto
- **Primary:** `#E6E8EB`
- **Secondary:** `#A1A6B0`
- **Muted (placeholders, captions):** `#6B7280`

### Acentos
- **Primary (success, CTA, focus, brand):** `#2ECC71`
- **Primary hover:** `#27AE60`
- **Primary subtle bg (badges, "earned", "actual"):** `#1F3D2B`
- **Error / destructive:** `#EF4444`
- **Warning (drafts, in-progress states):** `#F59E0B`
- **Info / level "básico":** `#3B82F6`

### Acentos secundarios usados por nivel (landing y badges)
- **Básico:** `#3B82F6`
- **Intermedio:** `#7C3AED`
- **Avanzado:** `#F97316`
- **Experto:** `#D29922`

### Typography
- **Pending** — actualmente cae a system fonts. Al cargar fuentes, usar Inter (UI) + JetBrains Mono (code) o la elección final del alumno.

### Aesthetic
- GitHub + Vercel + Linear — premium developer tool feel. Sin gradientes salvo decisión explícita; bordes finos, espaciado generoso, jerarquía por tipografía.

---

## Coding standards — Always follow these

### TypeScript
- Strict mode enabled everywhere
- No `any` types — always define interfaces or types
- Use `readonly` for properties that should not be mutated
- Prefer `const` over `let`, never `var`

### Angular
- Standalone components (Angular 21, no NgModules)
- Use Angular signals for state management where possible
- Services are injected via `inject()` function, not constructor
- Use `HttpClient` with typed responses: `http.get<Lesson[]>(...)`
- All forms use Reactive Forms (`FormBuilder`, `FormGroup`)
- Lazy load every feature route
- Use `OnPush` change detection on all components

### Express / Node.js
- All controllers are async/await — no callbacks, no raw Promise chains
- Always use try/catch in controllers and pass errors to `next(err)`
- Centralized error handler middleware at the bottom of app.ts
- Input validation with `express-validator` on every POST/PUT route
- Never return stack traces to the client in production
- Use environment variables for all secrets (never hardcode)

### MongoDB / Mongoose
- Define strict schemas with types and required fields
- Use `.lean()` for read-only queries (better performance)
- Use `populate()` for cross-collection references
- Always handle `null` cases when using `findById`

### Security — Always apply
- Passwords hashed with bcrypt (saltRounds: 12)
- JWT secret from environment variable, expiry 24h
- CORS configured to allow only frontend origin
- Rate limiting on auth endpoints (express-rate-limit)
- `helmet` middleware enabled on all routes
- Never expose passwordHash in any API response (use `.select('-passwordHash')`)

---

## Environment variables required

### Backend (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gitlearn
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
FRONTEND_URL=http://localhost:4200
NODE_ENV=development
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

---

## Docker setup
- `frontend` service: Angular dev server on port 4200
- `backend` service: Node.js on port 3000
- `mongo` service: MongoDB on port 27017 with named volume for persistence
- All services on the same Docker network
- Hot reload enabled in development for both frontend and backend

---

## Lesson content by level
- **Básico:** git init, git add, git commit, git push, git pull, what is a repository, .gitignore
- **Intermedio:** branches (branch, checkout, merge), conflict resolution, git log, git diff, git stash
- **Avanzado:** Pull Requests, code review workflow, fork, rebase, collaborative workflows
- **Experto:** GitHub Actions, CI/CD pipelines, workflow YAML, automated testing, deployment automation

---

## Gamification rules
- Completing a lesson awards `xpRecompensa` XP defined on the lesson
- Daily streak: if user completes at least 1 lesson per day, streak increments; if they miss a day, streak resets to 0
- Badges are checked and awarded automatically after lesson completion
- Badge conditions: `primera_leccion`, `racha_7`, `racha_30`, `nivel_basico`, `nivel_intermedio`, `nivel_avanzado`, `nivel_experto`, `todas_lecciones`
- XP does not decrease for wrong answers — the goal is learning, not punishment

---

## What is NOT in scope (do not implement)
- Real GitHub API integration (exercises are simulated, not run against real repos)
- Multiplayer or real-time features
- Certificate generation
- Moodle or LMS integration
- Multilanguage support (Spanish only)
- Mobile native app
