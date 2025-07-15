import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FolderOpen, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parent_category_id?: string;
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export const CategoryManager = ({ isOpen, onClose, onSuccess, categories }: CategoryManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "folder",
    parent_category_id: ""
  });

  const iconOptions = [
    { value: "folder", label: "📁 Folder" },
    { value: "file-text", label: "📄 Document" },
    { value: "briefcase", label: "💼 Business" },
    { value: "settings", label: "⚙️ Settings" },
    { value: "users", label: "👥 People" },
    { value: "chart-bar", label: "📊 Reports" },
    { value: "shield", label: "🛡️ Security" },
    { value: "tool", label: "🔧 Tools" }
  ];

  const colorOptions = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      icon: "folder",
      parent_category_id: ""
    });
    setEditingCategory(null);
    setIsCreating(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
      icon: category.icon,
      parent_category_id: category.parent_category_id || ""
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      setLoading(true);

      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) throw new Error("Business context not found");

      const categoryData = {
        business_id: membership.business_id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        icon: formData.icon,
        parent_category_id: formData.parent_category_id || null,
        created_by: user.id
      };

      if (isCreating) {
        const { error } = await supabase
          .from("document_categories")
          .insert(categoryData);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      } else if (editingCategory) {
        const { error } = await supabase
          .from("document_categories")
          .update(categoryData)
          .eq("id", editingCategory.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      }

      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from("document_categories")
        .update({ is_active: false })
        .eq("id", category.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Document Categories</DialogTitle>
          <DialogDescription>
            Create and organize categories for your documents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Form */}
          {(isCreating || editingCategory) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isCreating ? "Create New Category" : "Edit Category"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter category name"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent">Parent Category (Optional)</Label>
                    <Select
                      value={formData.parent_category_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category_id: value }))}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Parent</SelectItem>
                        {categories
                          .filter(cat => cat.id !== editingCategory?.id)
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this category..."
                    rows={2}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${
                            formData.color === color ? 'border-black' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          disabled={loading}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={!formData.name.trim() || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      isCreating ? "Create Category" : "Save Changes"
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Categories List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Existing Categories</h3>
              {!isCreating && !editingCategory && (
                <Button onClick={handleCreate} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              )}
            </div>

            {categories.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="font-semibold mb-2">No Categories</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first document category to organize your files.
                  </p>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <h4 className="font-semibold">{category.name}</h4>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};