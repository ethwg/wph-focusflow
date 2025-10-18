import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";

export function MainTaskListCard() {
  return (
    <Card className="pb-3">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <ClipboardList className="h-5 w-5 mr-2" /> Task List
        </CardTitle>
        <CardContent className="my-16 ">
          <div className="flex items-center justify-center gap-2">
            <div className="space-y-2 text-muted-foreground text-center">
              <div className="flex justify-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-sm">Big goals start small.</div>
              <div className="text-sm">Add a task to get moving</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="secondary" size="icon" className="cursor-pointer">
            <Plus />
          </Button>
        </CardFooter>
      </CardHeader>
    </Card>
  );
}
