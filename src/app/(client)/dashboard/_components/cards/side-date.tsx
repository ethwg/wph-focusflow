import { useMemo } from "react";

export function SideDate() {
  // Use useMemo to format the date only when the component renders
  const formattedDate = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  return (
    <div>
      <span className="font-semibold">{formattedDate}</span>
    </div>
  );
}
