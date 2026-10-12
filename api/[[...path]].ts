// Vercel serverless entry: catches every /api/* request (via the optional
// catch-all route api/[[...path]].ts) and hands it to the Express app.
// The original request path is preserved, so Express routing under /api works
// exactly as it does in the standalone server.
import app from "../artifacts/api-server/src/app";

export default app;
