import { MousePointerClick } from "lucide-react";

export function SideUsefulActionsLoggedCard() {
  return (
    <div className="flex w-full gap-6 border p-3 bg-primary/20 rounded-xl">
      <div className="w-14 h-14 rounded-xl bg-primary/40 text-primary flex items-center justify-center">
        <MousePointerClick className="h-8 w-8" />
      </div>
      <div className="text-primary">
        <span className="font-medium">Useful Actions Logged</span>
        <div className="font-semibold text-2xl">32</div>
      </div>
    </div>
  );
}
