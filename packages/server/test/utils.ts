import { vi } from "vitest";
import type { StorageAdapter } from "../src";

export const mockAdapter: StorageAdapter = {
  deleteComment: vi.fn(),
  deleteRate: vi.fn(),
  getComments: vi.fn().mockReturnValue([]),
  postComment: vi.fn(),
  setRate: vi.fn(),
  updateComment: vi.fn(),
};
