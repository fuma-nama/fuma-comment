import { z } from "zod";
import type { AuthInfo, RouteResponse } from "./types";

const postBodySchema = z.strictObject({
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
  setRate: (options: SetRateOptions) => RouteResponse<void>;
  deleteRate: (options: DeleteRateOptions) => RouteResponse<void>;
}
