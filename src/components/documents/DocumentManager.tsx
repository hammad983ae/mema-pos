import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  FileText, 
  FolderOpen,
  Upload,
  Download,
  Eye,
  Trash2,
  Settings,
  Filter
} from "lucide-react";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";
import { CategoryManager } from "./CategoryManager";
import { AIDocumentFeatures } from "./AIDocumentFeatures";

interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  version: number;
  access_level: string;
  tags: string[];
  category_id?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  document_categories?: {
    name: string;
    color: string;
    icon: string;
  };
  profiles?: {
    full_name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parent_category_id?: string;
}

interface DocumentManagerProps {
  userRole: string;
}

export const DocumentManager = ({ userRole }: DocumentManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [accessFilter, setAccessFilter] = useState<string>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const isManager = userRole === "business_owner" || userRole === "manager" || userRole === "office";

  useEffect(() => {
    if (user) {
      fetchDocuments();
      fetchCategories();
    }
  }, [user, selectedCategory, accessFilter]);

  const fetchDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let query = supabase
        .from("documents")
        .select(`
          *,
          document_categories (
            name,
            color,
            icon
          ),
          profiles (
            full_name
          )
        `)
        .eq("is_current_version", true)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      if (accessFilter !== "all") {
        query = query.eq("access_level", accessFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
    setIsUploadOpen(false);
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    });
  };

  const handleCategoryUpdate = () => {
    fetchCategories();
    setIsCategoryManagerOpen(false);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === "" || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const documentStats = {
    total: documents.length,
    categories: new Set(documents.map(d => d.category_id).filter(Boolean)).size,
    totalSize: documents.reduce((sum, doc) => sum + doc.file_size, 0),
    recentUploads: documents.filter(d => 
      new Date(d.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Document Management</h2>
          <p className="text-muted-foreground">
            Organize and manage your business documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsCategoryManagerOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Categories
              </Button>
              <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.categories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(documentStats.totalSize)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentStats.recentUploads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">All Access Levels</option>
                <option value="public">Public</option>
                <option value="business">Business</option>
                <option value="managers_only">Managers Only</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Features */}
      <AIDocumentFeatures onDocumentUpdate={fetchDocuments} />

      {/* Document List */}
      <DocumentList 
        documents={filteredDocuments}
        categories={categories}
        loading={loading}
        userRole={userRole}
        onDocumentUpdate={fetchDocuments}
      />

      {/* Upload Modal */}
      {isUploadOpen && (
        <DocumentUpload
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleUploadSuccess}
          categories={categories}
        />
      )}

      {/* Category Manager Modal */}
      {isCategoryManagerOpen && (
        <CategoryManager
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          onSuccess={handleCategoryUpdate}
          categories={categories}
        />
      )}
    </div>
  );
};