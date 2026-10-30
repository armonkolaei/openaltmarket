import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.LOCAL_API_PORT ?? 3001);

app.use(express.json());

function callHandler(handler, req, res) {
  return Promise.resolve(handler(req, res)).catch((error) => {
    const message = error instanceof Error ? error.message : 'Unexpected local API error.';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  });
}

async function start() {
  const [
    { default: healthHandler },
    { default: syncUserHandler },
    { default: submissionsHandler },
    { default: mySubmissionsHandler },
    { default: submissionByIdHandler },
    { default: adminUsersHandler },
    { default: adminRolesHandler }
  ] = await Promise.all([
    import('../api/health.ts'),
    import('../api/users/sync.ts'),
    import('../api/submissions/index.ts'),
    import('../api/submissions/mine.ts'),
    import('../api/submissions/[id].ts'),
    import('../api/admin/users.ts'),
    import('../api/admin/roles.ts')
  ]);

  app.all('/api/health', (req, res) => callHandler(healthHandler, req, res));
  app.all('/api/users/sync', (req, res) => callHandler(syncUserHandler, req, res));
  app.all('/api/submissions', (req, res) => callHandler(submissionsHandler, req, res));
  app.all('/api/submissions/mine', (req, res) => callHandler(mySubmissionsHandler, req, res));
  app.all('/api/submissions/:id', (req, res) => {
    const reqWithIdQuery = Object.create(req);
    Object.defineProperty(reqWithIdQuery, 'query', {
      value: {
        ...req.query,
        id: req.params.id
      },
      configurable: true
    });
    return callHandler(submissionByIdHandler, reqWithIdQuery, res);
  });
  app.all('/api/admin/users', (req, res) => callHandler(adminUsersHandler, req, res));
  app.all('/api/admin/roles', (req, res) => callHandler(adminRolesHandler, req, res));

  app.listen(port, () => {
    console.log(`Local API server running at http://127.0.0.1:${port}`);
  });
}

start().catch((error) => {
  const message = error instanceof Error ? error.message : 'Local API server failed to start.';
  console.error(message);
  process.exit(1);
});
