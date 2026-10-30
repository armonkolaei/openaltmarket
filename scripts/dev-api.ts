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
  const [{ default: healthHandler }, { default: syncUserHandler }, { default: submissionsHandler }, { default: submissionByIdHandler }, { default: adminUsersHandler }, { default: adminRolesHandler }] = await Promise.all([
    import('../api/health'),
    import('../api/users/sync'),
    import('../api/submissions/index'),
    import('../api/submissions/[id]'),
    import('../api/admin/users'),
    import('../api/admin/roles')
  ]);

  app.all('/api/health', (req, res) => callHandler(healthHandler, req, res));
  app.all('/api/users/sync', (req, res) => callHandler(syncUserHandler, req, res));
  app.all('/api/submissions', (req, res) => callHandler(submissionsHandler, req, res));
  app.all('/api/submissions/:id', (req, res) => {
    req.query = {
      ...req.query,
      id: req.params.id
    };
    return callHandler(submissionByIdHandler, req, res);
  });
  app.all('/api/admin/users', (req, res) => callHandler(adminUsersHandler, req, res));
  app.all('/api/admin/roles', (req, res) => callHandler(adminRolesHandler, req, res));

  app.listen(port, () => {
    console.log(`Local API server running at http://127.0.0.1:${port}`);
  });
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Local API server failed to start.';
  console.error(message);
  process.exit(1);
});
