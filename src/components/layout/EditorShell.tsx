import { cn } from "@/lib/utils";

interface EditorShellProps {
  sidebar: React.ReactNode;
  player: React.ReactNode;
  playback: React.ReactNode;
}

export function EditorShell({ sidebar, player, playback }: EditorShellProps) {
  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside
          className={cn(
            "order-3 flex min-h-0 w-full flex-1 flex-col overflow-hidden border-t border-border bg-card",
            "lg:order-1 lg:h-full lg:min-h-0 lg:w-[420px] lg:flex-none lg:border-r lg:border-t-0"
          )}
        >
          {sidebar}
        </aside>

        <main className="order-1 flex shrink-0 flex-col lg:order-2 lg:min-h-0 lg:min-w-0 lg:flex-1">
          <div className="flex h-[34dvh] min-h-[220px] flex-col overflow-hidden bg-muted/40 sm:h-[40dvh] lg:h-auto lg:min-h-0 lg:flex-1">
            {player}
          </div>
          {playback}
        </main>
      </div>
    </div>
  );
}
