import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { isPublishableKey } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

function clerkKeysReady(): boolean {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY ?? "";
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";
  return (
    isPublishableKey(publishableKey) &&
    /^sk_(test|live)_/.test(secretKey) &&
    !publishableKey.includes("REPLACE") &&
    !secretKey.includes("REPLACE")
  );
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (clerkKeysReady()) {
  app.use(
    clerkMiddleware(() => ({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    })),
  );
} else {
  logger.warn("Clerk keys missing or placeholder — public API will run without auth");
}

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  req.log?.error({ err }, "Unhandled API error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
};

app.use(errorHandler);

export default app;
