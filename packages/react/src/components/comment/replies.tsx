import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { useCommentContext } from "../../contexts/comment";
import { cn } from "../../utils/cn";
import { buttonVariants } from "../button";
import { CommentList } from "./list";

export function Replies(): React.ReactNode {
  const { comment } = useCommentContext();
  const [open, setOpen] = useState(false);

  if (comment.replies === 0) return null;

  return (
    <Collapsible
      className="border-y border-fc-border bg-fc-card pl-3"
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger
        className={cn(
          buttonVariants({
            variant: "ghost",
            size: "medium",
            className: "gap-3.5",
          }),
        )}
      >
        <ChevronDown
          className={cn(
            "-ml-0.5 size-4 transition-transform",
            open && "rotate-180",
          )}
        />
        {comment.replies} Replies
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-fc-accordion-up data-[state=open]:animate-fc-accordion-down">
        <CommentList threadId={comment.id} isSubThread />
      </CollapsibleContent>
    </Collapsible>
  );
}
