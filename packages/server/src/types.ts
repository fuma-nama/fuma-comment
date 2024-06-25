import type { CommentRoute } from "./routes/comment";
import type { CommentsRoute } from "./routes/comments";
import type { RatesRoute } from "./routes/rates";
import type { RichContentSchema } from "./routes/content";

export interface AuthInfo {
  /** User ID, must be unique */
  id: string;
}

export type Awaitable<T> = T | Promise<T>;

export type SerializedComment = Serialize<Comment>;

type JsonPrimitive = boolean | number | string | null;

// eslint-disable-next-line @typescript-eslint/ban-types -- For internal use only
type NonJsonPrimitive = Function | symbol | undefined;

type SerializeTupleOrObject<T extends [unknown, ...unknown[]] | object> = {
  [k in keyof T]: Serialize<T[k]>;
};

export type Serialize<T> = // JSON Primitives
  T extends JsonPrimitive | undefined
    ? T
    : // Tuples
      T extends [unknown, ...unknown[]]
      ? SerializeTupleOrObject<T>
      : // Arrays
        T extends (infer U)[]
        ? Serialize<U>[]
        : // Map & Set
          T extends Map<never, never> | Set<never>
          ? object
          : // Not supported
            T extends NonJsonPrimitive
            ? never
            : // with `toJson`
              T extends { toJSON: () => infer U }
              ? U
              : // Without `toJson`
                T extends object
                ? SerializeTupleOrObject<T>
                : never;

export interface Comment {
  /**
   * Unique ID for comment
   */
  id: number;

  /**
   * the ID of comment it replies to
   */
  threadId?: number;

  /**
   * Comment page, used for filtering
   */
  page?: string;

  author: UserProfile;

  /**
   * The JSON content object (From rich editor)
   */
  content: object;

  /**
   * Amount of likes
   */
  likes: number;

  /**
   * Amount of dislikes
   */
  dislikes: number;

  /**
   * Amount of replies
   */
  replies: number;

  /**
   * When the comment is sent
   */
  timestamp: Date;

  /**
   * Whether the user had liked the comment. True if like, false if dislike, undefined if not rated
   */
  liked?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  image?: string;
}

export type StorageAdapter = CommentsRoute & CommentRoute & RatesRoute;

export type Content = RichContentSchema;
