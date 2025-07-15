import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  RefreshCw,
  Zap,
  FileSpreadsheet,
  FileJson,
  Settings,
  Info
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const DataMigrationTool = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSystem, setSelectedSystem] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [migrationJobs, setMigrationJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [mappingConfig, setMappingConfig] = useState({});

  const supportedSystems = [
    {
      id: "masterpos",
      name: "MasterPOS",
      description: "Import sales data from MasterPOS system",
      fields: ["TransactionID", "Total", "Tax", "Subtotal", "PaymentMethod", "DateTime", "CustomerName", "Employee"],
      sampleFormat: {
        "TransactionID": "TXN001",
        "Total": "150.00",
        "Tax": "12.00",
        "Subtotal": "138.00",
        "PaymentMethod": "Credit Card",
        "DateTime": "2023-01-15 14:30:00",
        "CustomerName": "John Doe",
        "Employee": "Jane Smith"
      }
    },
    {
      id: "novapos",
      name: "NovaPOS",
      description: "Import sales data from NovaPOS system",
      fields: ["receipt_number", "total_amount", "tax_amount", "sub_total", "payment_type", "sale_date", "customer", "cashier"],
      sampleFormat: {
        "receipt_number": "RCP001",
        "total_amount": "150.00",
        "tax_amount": "12.00",
        "sub_total": "138.00",
        "payment_type": "card",
        "sale_date": "2023-01-15 14:30:00",
        "customer": "John Doe",
        "cashier": "Jane Smith"
      }
    },
    {
      id: "csv",
      name: "Generic CSV",
      description: "Import from any CSV file with custom mapping",
      fields: ["Configurable"],
      sampleFormat: {
        "Note": "You can map any CSV columns to our system fields"
      }
    }
  ];

  useEffect(() => {
    if (user) {
      fetchMigrationJobs();
    }
  }, [user]);

  const fetchMigrationJobs = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data: jobs } = await supabase
        .from("data_migration_jobs")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .order("created_at", { ascending: false });

      setMigrationJobs(jobs || []);
    } catch (error) {
      console.error("Error fetching migration jobs:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // Preview file data
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',');
          const preview = lines.slice(1, 6).map(line => {
            const values = line.split(',');
            const row = {};
            headers.forEach((header, index) => {
              row[header.trim()] = values[index]?.trim() || '';
            });
            return row;
          });
          setPreviewData(preview);
        };
        reader.readAsText(file);
      } else if (file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string);
            const preview = Array.isArray(json) ? json.slice(0, 5) : [json];
            setPreviewData(preview);
          } catch (error) {
            toast({
              title: "Invalid JSON",
              description: "The uploaded file is not valid JSON",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const startMigration = async () => {
    if (!uploadedFile || !selectedSystem || !user) return;

    try {
      setLoading(true);

      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Upload file to storage
      const fileName = `migration-${Date.now()}-${uploadedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('migration-files')
        .upload(fileName, uploadedFile);

      if (uploadError) throw uploadError;

      // Create migration job
      const { data: jobData, error: jobError } = await supabase
        .from("data_migration_jobs")
        .insert({
          business_id: membershipData.business_id,
          source_system: selectedSystem,
          job_type: 'full_import',
          file_path: uploadData.path,
          mapping_config: mappingConfig,
          created_by: user.id
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Process the file (simplified for demo)
      await processFile(jobData.id, uploadedFile);

      toast({
        title: "Migration Started",
        description: "Your data migration has been queued for processing",
      });

      fetchMigrationJobs();
      setUploadedFile(null);
      setPreviewData([]);

    } catch (error) {
      console.error("Error starting migration:", error);
      toast({
        title: "Migration Failed",
        description: "Failed to start data migration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (jobId: string, file: File) => {
    // This would typically be handled by a background job
    // For demo purposes, we'll simulate processing
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let records = [];
        
        if (file.type === "text/csv" || file.name.endsWith('.csv')) {
          const csv = e.target?.result as string;
          const lines = csv.split('\n');
          const headers = lines[0].split(',');
          
          records = lines.slice(1).map(line => {
            const values = line.split(',');
            const record = {};
            headers.forEach((header, index) => {
              record[header.trim()] = values[index]?.trim() || '';
            });
            return record;
          }).filter(record => Object.values(record).some(value => value !== ''));
          
        } else if (file.type === "application/json") {
          const json = JSON.parse(e.target?.result as string);
          records = Array.isArray(json) ? json : [json];
        }

        // Stage the data
        for (const record of records) {
          await supabase
            .from("external_data_staging")
            .insert({
              migration_job_id: jobId,
              source_system: selectedSystem,
              record_type: 'order',
              raw_data: record,
              mapped_data: await mapRecord(record, selectedSystem)
            });
        }

        // Update job status
        await supabase
          .from("data_migration_jobs")
          .update({
            status: 'completed',
            total_records: records.length,
            processed_records: records.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);

      } catch (error) {
        console.error("Error processing file:", error);
        
        await supabase
          .from("data_migration_jobs")
          .update({
            status: 'failed',
            errors: [{ error: error.message }]
          })
          .eq('id', jobId);
      }
    };
    
    reader.readAsText(file);
  };

  const mapRecord = async (record: any, sourceSystem: string) => {
    // Use the database function to map the record
    const { data } = await supabase.rpc('map_external_data', {
      p_raw_data: record,
      p_source_system: sourceSystem,
      p_record_type: 'order'
    });
    
    return data;
  };

  const downloadTemplate = (systemId: string) => {
    const system = supportedSystems.find(s => s.id === systemId);
    if (!system) return;

    const template = [system.fields, ...Array(3).fill(null).map(() => 
      system.fields.map(() => 'Sample Data')
    )];

    const csvContent = template.map(row => 
      Array.isArray(row) ? row.join(',') : system.fields.join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${system.name.toLowerCase()}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: `${system.name} template downloaded successfully`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'failed':
        return 'text-destructive';
      case 'processing':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Migration Tool</h2>
          <p className="text-muted-foreground">
            Import your historical sales data from other POS systems
          </p>
        </div>
        <Badge variant="outline" className="bg-info/10 text-info border-info/20">
          <Database className="h-3 w-3 mr-1" />
          Enterprise Feature
        </Badge>
      </div>

      <Tabs defaultValue="migrate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="migrate">New Migration</TabsTrigger>
          <TabsTrigger value="jobs">Migration History</TabsTrigger>
          <TabsTrigger value="templates">Templates & Help</TabsTrigger>
        </TabsList>

        <TabsContent value="migrate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Historical Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Selection */}
              <div className="space-y-2">
                <Label>Select Source System</Label>
                <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your current POS system" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedSystems.map(system => (
                      <SelectItem key={system.id} value={system.id}>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          {system.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSystem && (
                  <p className="text-sm text-muted-foreground">
                    {supportedSystems.find(s => s.id === selectedSystem)?.description}
                  </p>
                )}
              </div>

              {/* File Upload */}
              {selectedSystem && (
                <div className="space-y-2">
                  <Label>Upload Data File</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">CSV or JSON files up to 10MB</p>
                    </label>
                  </div>
                  {uploadedFile && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        File uploaded: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="space-y-2">
                  <Label>Data Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            {Object.keys(previewData[0] || {}).map(key => (
                              <th key={key} className="text-left p-2 border-b">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 3).map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value: any, cellIndex) => (
                                <td key={cellIndex} className="p-2 border-b">
                                  {String(value).substring(0, 20)}
                                  {String(value).length > 20 ? '...' : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing first 3 rows of {previewData.length} total records
                    </p>
                  </div>
                </div>
              )}

              {/* Start Migration */}
              {uploadedFile && selectedSystem && (
                <Button 
                  onClick={startMigration} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing Migration...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Start Data Migration
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migration History</CardTitle>
            </CardHeader>
            <CardContent>
              {migrationJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No migration jobs found</p>
                  <p className="text-sm text-muted-foreground">Start your first migration to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {migrationJobs.map((job: any) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <p className="font-medium">{job.source_system.toUpperCase()} Import</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(job.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      {job.total_records > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.processed_records}/{job.total_records} records</span>
                          </div>
                          <Progress 
                            value={(job.processed_records / job.total_records) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                      
                      {job.error_records > 0 && (
                        <Alert className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {job.error_records} records failed to import
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {supportedSystems.map(system => (
              <Card key={system.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {system.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {system.description}
                  </p>
                  
                  <div className="space-y-2">
                    <Label>Expected Fields:</Label>
                    <div className="flex flex-wrap gap-1">
                      {system.fields.map(field => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sample Format:</Label>
                    <div className="bg-muted p-3 rounded text-xs font-mono">
                      <pre>{JSON.stringify(system.sampleFormat, null, 2)}</pre>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadTemplate(system.id)}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Migration Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Before starting:</strong> Backup your existing data and test with a small sample first.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">✅ Supported Data Types</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Sales transactions</li>
                      <li>• Customer information</li>
                      <li>• Product data</li>
                      <li>• Payment records</li>
                      <li>• Historical reports</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">📋 Requirements</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• CSV or JSON format</li>
                      <li>• UTF-8 encoding</li>
                      <li>• Max file size: 10MB</li>
                      <li>• Valid date formats</li>
                      <li>• Numerical amounts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};