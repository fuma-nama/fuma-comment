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
  id: number;
  replyCommentId?: number;
  author: UserProfile;
  content: string;
  likes: number;
  dislikes: number;
  timestamp: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  image?: string;
}

export interface StorageAdapter {
  getComments: (threadId: string) => Comment[] | Promise<Comment[]>;
  addComment: (comment: Comment) => void | Promise<void>;
}
