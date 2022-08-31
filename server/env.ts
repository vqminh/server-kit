import path from "path";
import fs from "fs";
import { DEV } from "../settings";

interface Environment {
  error(...args: any[]): void;

  info(...args: any[]): void;
}

let _env: Environment = {
  error: console.error,
  info: console.info,
};

export function initEnvironment(env: Environment) {
  _env = env;
}

/** load env variables first **/
// const isDev = process.env.NODE_ENV !== "production";
const envFile = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envFile)) {
  require("dotenv").config({ path: envFile });
} else {
  throw new Error(`Could not find: ${envFile}`);
}

export function logError(...args: any[]) {
  _env.error(args);
}

export function info(...msg: any[]) {
  _env.info(msg);
}

export function debug(o: any) {
  if (DEV) {
    info(o);
  }
}
