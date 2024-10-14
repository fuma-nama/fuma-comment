#!/usr/bin/env node

import { spawn } from "child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const ls = spawn(`./node_modules/next/dist/bin/next`, ["start", "-p", "3001"], {
  cwd: path.join(dir, "../"),
  stdio: "inherit",
  env: process.env,
});

ls.on("error", (e) => {
  console.error(e);
});

ls.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});
