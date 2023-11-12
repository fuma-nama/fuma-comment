export interface Comment {
  id: number;
  author: string;
  content: string;
  timestamp: string;
}

export interface StorageAdapter {
  getComments: (threadId: string) => Comment[] | Promise<Comment[]>;
  addComment: (comment: Comment) => void | Promise<void>;
}
