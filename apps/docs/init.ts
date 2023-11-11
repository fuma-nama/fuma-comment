/* eslint-disable import/order -- preload order matters */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(".env.local") });

void import("./utils/database")
  .then((res) => res.init())
  .then(() => {
    console.log("Init Done");
  });
