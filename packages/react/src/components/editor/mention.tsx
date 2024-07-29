import { type SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useImperativeHandle, useState } from "react";
import { cn } from "../../utils/cn";

export interface MentionListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface MentionItem {
  id: string;
  label: string;
}

export const MentionList = forwardRef<
  MentionListRef,
  SuggestionProps<MentionItem, { id: string }>
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevItems, setPrevItems] = useState(props.items);

  const selectItem = (index: number): void => {
    const item = props.items.at(index);

    if (item) {
      props.command({ id: item.id });
    }
  };

  if (props.items !== prevItems) {
    setSelectedIndex(0);
    setPrevItems(props.items);
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (prev) => (prev + props.items.length - 1) % props.items.length,
        );
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % props.items.length);
        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-fc-border bg-fc-popover text-sm text-fc-popover-foreground shadow-lg">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 text-left font-medium",
              index === selectedIndex &&
                "bg-fc-primary text-fc-primary-foreground",
            )}
            key={item.id}
            onClick={() => {
              selectItem(index);
            }}
          >
            {item.label}
          </button>
        ))
      ) : (
        <div className="text-fc-muted-foreground">No result</div>
      )}
    </div>
  );
});

MentionList.displayName = "MentionList";
