import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.LOCAL_API_PORT ?? 3001);

app.use(express.json());

function callHandler(
  handler: (req: unknown, res: unknown) => unknown,
  req: express.Request,
  res: express.Response
) {
  return Promise.resolve(handler(req as unknown, res as unknown)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unexpected local API error.';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    }
  });
}

async function start() {
  const [{ default: healthHandler }, { default: syncUserHandler }, { default: submissionsHandler }, { default: mySubmissionsHandler }, { default: submissionByIdHandler }, { default: adminUsersHandler }, { default: adminRolesHandler }, { default: refreshGithubHandler }] = await Promise.all([
    import('../api/health'),
    import('../api/users/sync'),
    import('../api/submissions/index'),
    import('../api/submissions/mine'),
    import('../api/submissions/[id]'),
    import('../api/admin/users'),
    import('../api/admin/roles'),
    import('../api/admin/refresh-github')
  ]);

  app.all('/api/health', (req, res) => callHandler(healthHandler, req, res));
  app.all('/api/users/sync', (req, res) => callHandler(syncUserHandler, req, res));
  app.all('/api/submissions', (req, res) => callHandler(submissionsHandler, req, res));
  app.all('/api/submissions/mine', (req, res) => callHandler(mySubmissionsHandler, req, res));
  app.all('/api/submissions/:id', (req, res) => {
    const reqWithIdQuery = Object.create(req) as express.Request;
    Object.defineProperty(reqWithIdQuery, 'query', {
      value: {
        ...(req.query as Record<string, unknown>),
        id: req.params.id
      },
      configurable: true
    });
    return callHandler(submissionByIdHandler, reqWithIdQuery, res);
  });
  app.all('/api/admin/users', (req, res) => callHandler(adminUsersHandler, req, res));
  app.all('/api/admin/roles', (req, res) => callHandler(adminRolesHandler, req, res));
  app.all('/api/admin/refresh-github', (req, res) => callHandler(refreshGithubHandler, req, res));

  app.listen(port, () => {
    console.log(`Local API server running at http://127.0.0.1:${port}`);
  });
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Local API server failed to start.';
  console.error(message);
  process.exit(1);
});
