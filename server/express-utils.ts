import express from "express";
import cors from "cors";
import { checkAdminToken, ERROR_CODES, verifyToken } from "./request-utils";
import { info, logError } from "./env";

function handleError(req: express.Request, res: express.Response, error: any) {
  const { code } = error;
  logError(req.body, error);
  res.status(500).send(ERROR_CODES[code] || code);
}

const errorMiddleware = (
  error: Error,
  req: express.Request,
  res: express.Response
) => handleError(req, res, error);

export function useDefault() {
  const app = express();
  const options = {
    origin: process.env.NEXT_PUBLIC_SITE_URL,
    optionsSuccessStatus: 200,
  };
  // Click on "Add Member", type in "allUsers" and select the role "Cloud Function Invoker"
  app.use(cors(options));
  app.use(async (req, _res, next) => {
    info("PATH", req.path);
    if (req.path.startsWith("/admin")) {
      await checkAdmin(req);
    }
    next();
  });

  app.post("/error", (req, res) => {
    logError(JSON.stringify(req.body));
    res.json({});
  });

  app.post("/loginfo", (_req, res) => {
    info(process.env);
    res.json({});
  });

  app.use(errorMiddleware);

  return app;
}

export const checkAdmin = (req: express.Request) =>
  checkAdminToken(req.get("token"));

export const checkUser = (req: express.Request) =>
  verifyToken(req.get("token"));
