import { z } from "zod";
import type { AuthInfo, Awaitable } from "../types";

export const postBodySchema = z.strictObject({
  like: z.boolean(),
});

interface SetRateOptions {
  /** Comment ID */
  id: string;
  auth: AuthInfo;
  body: z.infer<typeof postBodySchema>;
}

interface DeleteRateOptions {
  /** Comment ID */
  id: string;
  auth: AuthInfo;
}

export interface RatesRoute {
  setRate: (options: SetRateOptions) => Awaitable<void>;
  deleteRate: (options: DeleteRateOptions) => Awaitable<void>;
}
