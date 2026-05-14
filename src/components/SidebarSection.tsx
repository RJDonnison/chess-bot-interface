import { ChevronDown } from "lucide-react";
import { ReactNode, useState } from "react";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export function SidebarSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="pb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-1 group cursor-pointer border-b pb-1"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-left">
          {title}
        </p>
        <div
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-8 cursor-pointer",
          )}
        >
          <ChevronDown className="h-3 w-3 text-muted-foreground  transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </button>
      {open && (
        <div
          className="pt-2 pb-4 border-b"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}
