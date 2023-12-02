import { vi } from "vitest";
import type { Content, StorageAdapter } from "../src";

export const mockAdapter: StorageAdapter = {
  deleteComment: vi.fn(),
  deleteRate: vi.fn(),
  getComments: vi.fn().mockReturnValue([]),
  postComment: vi.fn(),
  setRate: vi.fn(),
  updateComment: vi.fn(),
};

export function createContent(raw: string): Content {
  return {
    type: "docs",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: raw,
          },
        ],
      },
    ],
  };
}
