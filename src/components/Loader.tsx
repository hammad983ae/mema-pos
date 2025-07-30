import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";

export default function Loader() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </CardContent>
    </Card>
  );
}
