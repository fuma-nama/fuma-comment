import type { RichContentSchema } from "./custom/schemas";

export interface AuthInfo {
  /** User ID, must be unique */
  id: string;
}

export interface AuthInfoWithRole extends AuthInfo {
  role: Role | null;
}

export type Awaitable<T> = T | Promise<T>;

export type SerializedComment = Serialize<Comment>;

type JsonPrimitive = boolean | number | string | null;

// biome-ignore lint: For internal use only
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
  id: string;

  /**
   * the ID of comment it replies to
   */
  threadId?: string;

  /**
   * Comment page, used for filtering
   */
  page: string;

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

export interface Role {
  name: string;
  canDelete: boolean;
}

export type Content = RichContentSchema;
