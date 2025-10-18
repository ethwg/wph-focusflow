import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock3 } from "lucide-react";

const PROJECT_TIME_ALLOCATIONS = [
  {
    name: "CRM - Business Ltd.",
    time: "0h 0mins",
    color: "bg-primary",
  },
  {
    name: "Marketing Campaign",
    time: "2h 30mins",
    color: "bg-green-500",
  },
  {
    name: "Product Development",
    time: "4h 15mins",
    color: "bg-blue-500",
  },
];

export function MainProjectTimeAllocationCard() {
  return (
    <Card className="pb-3">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <Clock3 className="h-5 w-5 mr-2" /> Project Time Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {PROJECT_TIME_ALLOCATIONS.map((project, index) => (
            <div key={index} className="flex gap-3 items-center">
              <div className={`h-3 w-3 ${project.color} rounded-full`} />
              <div>
                <div className="text-sm text-muted-foreground">
                  {project.name}
                </div>
                <span className="text-xs text-muted-foreground/80">
                  {project.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
