import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@apollo/client";
import { GET_CATEGORIES, Query } from "@/graphql";

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs = ({
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "All Products", count: 0 },
  ]);
  const { data: categoryData } = useQuery<Query>(GET_CATEGORIES);

  useEffect(() => {
    if (categoryData?.getCategories) {
      const transformedCategories = [
        {
          id: "all",
          name: "All Products",
          count:
            categoryData.getCategories.reduce(
              (acc, curr) => acc + curr.productsCount,
              0,
            ) || 0,
        },
        ...(categoryData.getCategories?.map((cat) => ({
          id: cat.id,
          name: cat.name,
          count: cat.productsCount,
        })) || []),
      ];

      setCategories(transformedCategories);
    }
  }, [categoryData]);

  return (
    <div className="bg-card/50 backdrop-blur-sm border-b border-border">
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-border">
        <div className="flex space-x-2 p-4 min-w-max">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "ghost"}
              className={cn(
                "h-11 px-5 rounded-xl whitespace-nowrap transition-all duration-200 font-medium",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground hover:scale-105",
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              <div className="text-center">
                <div className="text-sm">{category.name}</div>
                <div
                  className={cn(
                    "text-xs",
                    activeCategory === category.id
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  ({category.count})
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
