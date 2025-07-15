import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "All Products", count: 0 }
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Fetch categories with product counts
      const { data: categoriesData, error } = await supabase
        .from("product_categories")
        .select(`
          id,
          name,
          products(count)
        `)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Get total product count
      const { count: totalCount } = await supabase
        .from("products")
        .select("*", { count: 'exact', head: true })
        .eq("is_active", true);

      const transformedCategories = [
        { id: "all", name: "All Products", count: totalCount || 0 },
        ...(categoriesData?.map(cat => ({
          id: cat.name.toLowerCase().replace(/\s+/g, ''),
          name: cat.name,
          count: cat.products?.[0]?.count || 0
        })) || [])
      ];

      setCategories(transformedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback to default categories
      setCategories([
        { id: "all", name: "All Products", count: 45 },
        { id: "cleansers", name: "Cleansers", count: 12 },
        { id: "serums", name: "Serums & Treatments", count: 8 },
        { id: "moisturizers", name: "Moisturizers", count: 10 },
        { id: "sunscreen", name: "Sun Protection", count: 6 },
        { id: "tools", name: "Tools & Devices", count: 5 },
        { id: "packages", name: "Treatment Packages", count: 4 }
      ]);
    }
  };

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
                  : "bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground hover:scale-105"
              )}
              onClick={() => onCategoryChange(category.id)}
            >
              <div className="text-center">
                <div className="text-sm">{category.name}</div>
                <div className={cn(
                  "text-xs",
                  activeCategory === category.id
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                )}>({category.count})</div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};