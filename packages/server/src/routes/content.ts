import { z } from "zod";
import { getTextFromContent } from "../utils";

export interface RichContentSchema
  extends z.infer<typeof richContentSchemaLeaf> {
  content?: RichContentSchema[];
}

const richContentSchemaLeaf = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough();

const richContentSchema: z.ZodType<RichContentSchema> = z.lazy(() =>
  richContentSchemaLeaf.extend({
    content: z.array(richContentSchema).optional(),
  })
);

export const contentSchema = richContentSchema.superRefine(
  (obj, { addIssue }) => {
    const objString = JSON.stringify(obj);
    const text = getTextFromContent(obj).trim();

    if (text.length === 0) {
      addIssue({ code: "custom", message: "Content can't be empty" });
      return;
    }

    if (text.length > 2000) {
      addIssue({
        code: "custom",
        message: "Content can't be longer than 2000 characters",
      });
    }

    if (objString.length > 2000 * 10) {
      addIssue({
        code: "custom",
        message: "Content is too large",
      });
    }
  }
);
