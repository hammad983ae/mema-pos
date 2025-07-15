import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  User,
  FolderOpen,
  Tag,
  Shield,
  Brain,
  Receipt,
  Sparkles
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  metadata?: any;
  document_categories?: {
    name: string;
    color: string;
    icon: string;
  } | null;
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

interface DocumentListProps {
  documents: Document[];
  categories: Category[];
  loading: boolean;
  userRole: string;
  onDocumentUpdate: () => void;
}

export const DocumentList = ({ 
  documents, 
  categories, 
  loading, 
  userRole, 
  onDocumentUpdate 
}: DocumentListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const isManager = userRole === "business_owner" || userRole === "manager";

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('text')) return '📄';
    return '📄';
  };

  const getAccessLevelBadge = (level: string) => {
    const variants = {
      public: "default",
      business: "secondary", 
      managers_only: "destructive",
      private: "outline"
    } as const;

    const labels = {
      public: "Public",
      business: "Business",
      managers_only: "Managers Only", 
      private: "Private"
    };

    return (
      <Badge variant={variants[level as keyof typeof variants] || "default"}>
        <Shield className="h-3 w-3 mr-1" />
        {labels[level as keyof typeof labels] || level}
      </Badge>
    );
  };

  const handleDownload = async (document: Document) => {
    if (!user) return;

    try {
      setDownloadingIds(prev => new Set([...prev, document.id]));

      // Track document activity
      await supabase
        .from("document_activity")
        .insert({
          document_id: document.id,
          user_id: user.id,
          activity_type: "download"
        });

      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from("business-documents")
        .createSignedUrl(document.file_path, 3600); // 1 hour expiry

      if (error) throw error;

      // Create download link
      const link = window.document.createElement('a');
      link.href = data.signedUrl;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: `Downloading ${document.file_name}`,
      });
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const handleView = async (document: Document) => {
    if (!user) return;

    try {
      // Track document activity
      await supabase
        .from("document_activity")
        .insert({
          document_id: document.id,
          user_id: user.id,
          activity_type: "view"
        });

      // Get signed URL for viewing
      const { data, error } = await supabase.storage
        .from("business-documents")
        .createSignedUrl(document.file_path, 3600);

      if (error) throw error;

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      console.error("Error viewing document:", error);
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (document: Document) => {
    if (!user) return;

    const canDelete = document.uploaded_by === user.id || isManager;
    if (!canDelete) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete this document",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${document.title}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("business-documents")
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      onDocumentUpdate();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading documents...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold mb-2">No Documents Found</h4>
            <p className="text-sm text-muted-foreground">
              No documents match your current search and filter criteria.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card key={document.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="text-2xl">
                  {getFileIcon(document.mime_type)}
                </div>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold">{document.title}</h4>
                    <p className="text-sm text-muted-foreground">{document.file_name}</p>
                  </div>
                  
                  {document.description && (
                    <p className="text-sm text-muted-foreground">{document.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {document.profiles?.full_name || 'Unknown User'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                    </div>
                    <div>{formatFileSize(document.file_size)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getAccessLevelBadge(document.access_level)}
                    
                    {document.document_categories && (
                      <Badge variant="outline" style={{ color: document.document_categories.color }}>
                        <FolderOpen className="h-3 w-3 mr-1" />
                        {document.document_categories.name}
                      </Badge>
                    )}

                  {document.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  
                  {/* AI Processing Indicators */}
                  {document.metadata?.ai_categorized && (
                    <Badge variant="outline" className="text-blue-600">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Categorized
                    </Badge>
                  )}
                  
                  {document.metadata?.ai_summary && (
                    <Badge variant="outline" className="text-green-600">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Summary
                    </Badge>
                  )}
                  
                  {document.metadata?.invoice_data && (
                    <Badge variant="outline" className="text-purple-600">
                      <Receipt className="h-3 w-3 mr-1" />
                      Invoice Processed
                    </Badge>
                   )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedDoc(expandedDoc === document.id ? null : document.id)}
              >
                <Brain className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(document)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(document)}
                disabled={downloadingIds.has(document.id)}
              >
                <Download className="h-4 w-4" />
              </Button>

              {(document.uploaded_by === user?.id || isManager) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(document)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              </div>
            </div>
          </CardContent>
          
          {/* Expandable AI Features */}
          {expandedDoc === document.id && (
            <div className="border-t p-4">
              <AIDocumentFeatures 
                document={document} 
                onDocumentUpdate={onDocumentUpdate}
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};