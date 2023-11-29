import { createKysely } from "@vercel/postgres-kysely";
import { type GeneratedAlways, type Generated } from "kysely";

interface CommentTable {
  id: Generated<number>;
  threadId?: number;
  page?: string;
  author: string;
  content: object;
  timestamp: Generated<Date>;
}

interface RateTable {
  userId: string;
  commentId: number;
  like: boolean;
}

interface UserTable {
  id: GeneratedAlways<string>;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
}

interface AccountTable {
  id: GeneratedAlways<string>;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

interface SessionTable {
  id: GeneratedAlways<string>;
  userId: string;
  sessionToken: string;
  expires: Date;
}

interface Database {
  comments: CommentTable;
  rates: RateTable;
  User: UserTable;
  Account: AccountTable;
  Session: SessionTable;
  VerificationToken: {
    identifier: string;
    token: string;
    expires: Date;
  };
}

export const db = createKysely<Database>();
