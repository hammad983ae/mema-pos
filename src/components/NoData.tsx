import { Package2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";

type Props = {
  title?: string;
  text: string;
};

export default function NoData({ title, text }: Props) {
  return (
    <Card>
      <CardContent className="py-10 px-4 text-center">
        <Package2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {title && <h3 className="font-medium mb-2">{title}</h3>}
        <p className="text-muted-foreground">{text ?? "No datas found"}</p>
      </CardContent>
    </Card>
  );
}
