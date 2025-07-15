import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Search, 
  FileText, 
  Receipt, 
  Loader2,
  Sparkles,
  Tags,
  FileSearch,
  Bot
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  tags: string[];
  metadata?: any;
}

interface AIDocumentFeaturesProps {
  document?: Document;
  onDocumentUpdate?: () => void;
}

export const AIDocumentFeatures = ({ document, onDocumentUpdate }: AIDocumentFeaturesProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [summary, setSummary] = useState("");
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const handleAIProcess = async (action: string, documentId?: string) => {
    if (!documentId && action !== 'search') return;

    try {
      setLoading(prev => ({ ...prev, [action]: true }));

      let content = "";
      if (documentId && document) {
        // For simplicity, we'll use filename and description as content
        // In a real implementation, you'd extract text from the actual file
        content = `${document.title}\n${document.description || ''}\n${document.file_name}`;
      }

      const { data, error } = await supabase.functions.invoke('ai-document-processor', {
        body: {
          action,
          documentId,
          content: action === 'search' ? searchQuery : content,
          fileName: document?.file_name,
          mimeType: document?.mime_type
        }
      });

      if (error) throw error;

      switch (action) {
        case 'categorize':
          toast({
            title: "Success",
            description: "Document categorized and tagged automatically",
          });
          onDocumentUpdate?.();
          break;

        case 'search':
          setSearchResults(data.results || []);
          break;

        case 'summarize':
          setSummary(data.summary);
          toast({
            title: "Summary Generated",
            description: "AI summary has been created for this document",
          });
          break;

        case 'extract_invoice':
          setInvoiceData(data);
          toast({
            title: "Invoice Processed",
            description: "Invoice data has been extracted successfully",
          });
          break;
      }
    } catch (error: any) {
      console.error(`Error in AI ${action}:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} document`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium">Search Results</h4>
        {searchResults.map((result: any) => (
          <Card key={result.id} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline">{(result.relevance * 100).toFixed(0)}% match</Badge>
                <p className="text-sm mt-1">{result.reason}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderInvoiceData = () => {
    if (!invoiceData) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Extracted Invoice Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Invoice Number</label>
              <p className="text-sm text-muted-foreground">{invoiceData.invoice_number || 'Not found'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <p className="text-sm text-muted-foreground">{invoiceData.date || 'Not found'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Vendor</label>
              <p className="text-sm text-muted-foreground">{invoiceData.vendor || 'Not found'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Total Amount</label>
              <p className="text-sm text-muted-foreground">
                {invoiceData.total_amount ? `$${invoiceData.total_amount}` : 'Not found'}
              </p>
            </div>
          </div>
          {invoiceData.line_items && invoiceData.line_items.length > 0 && (
            <div>
              <label className="text-sm font-medium">Line Items</label>
              <div className="mt-2 space-y-1">
                {invoiceData.line_items.map((item: any, index: number) => (
                  <div key={index} className="text-xs p-2 bg-muted rounded">
                    {item.description} - {item.quantity}x ${item.unit_price} = ${item.total}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Document Processing for single document */}
      {document && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Document Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => handleAIProcess('categorize', document.id)}
                disabled={loading.categorize}
                className="flex items-center gap-2"
              >
                {loading.categorize ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Tags className="h-4 w-4" />
                )}
                Auto Categorize
              </Button>

              <Button
                variant="outline"
                onClick={() => handleAIProcess('summarize', document.id)}
                disabled={loading.summarize}
                className="flex items-center gap-2"
              >
                {loading.summarize ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Summarize
              </Button>

              {document.mime_type.includes('pdf') && (
                <Button
                  variant="outline"
                  onClick={() => handleAIProcess('extract_invoice', document.id)}
                  disabled={loading.extract_invoice}
                  className="flex items-center gap-2"
                >
                  {loading.extract_invoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4" />
                  )}
                  Extract Invoice
                </Button>
              )}
            </div>
            
            {summary && (
              <div className="mt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Summary
                </h4>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {summary}
                </div>
              </div>
            )}

            {renderInvoiceData()}
          </CardContent>
        </Card>
      )}

      {/* AI-Powered Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            AI-Powered Document Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Describe what you're looking for..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAIProcess('search')}
            />
            <Button
              onClick={() => handleAIProcess('search')}
              disabled={loading.search || !searchQuery.trim()}
            >
              {loading.search ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use natural language to search documents by content, purpose, or context
          </p>
          {renderSearchResults()}
        </CardContent>
      </Card>
    </div>
  );
};