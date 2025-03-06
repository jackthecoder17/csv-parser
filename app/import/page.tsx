/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseFile, PropertyUnit, ParseResult } from "@/lib/csv-parser";
import { AlertCircle, Check, Filter } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea , ScrollBar} from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveImportedProperties } from "@/app/actions/property-actions";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [showFieldsDialog, setShowFieldsDialog] = useState(false);

  // Filtered data based on selected fields
  const filteredPreview = useMemo(() => {
    if (!parseResult?.data || !selectedFields.length)
      return parseResult?.data || [];

    return parseResult.data.map((item) => {
      const filtered: Record<string, any> = {};
      selectedFields.forEach((field) => {
        filtered[field] = item[field];
      });
      return filtered as PropertyUnit;
    });
  }, [parseResult?.data, selectedFields]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setImportSuccess(false);
      setParseResult(null);
      setSelectedFields([]);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Starting file parsing for:", file.name);
      const result = await parseFile(file);

      if (!result.data || result.data.length === 0) {
        setError(
          "No data found in the file. Please check that the file contains data rows."
        );
        toast.error("No data found in the file");
        return;
      }

      console.log(
        `Successfully parsed ${result.data.length} rows with ${result.fields.length} fields`
      );
      setParseResult(result);

      // Simply select the first few fields (max 5) for initial display
      const initialFields = result.fields.slice(0, 5);
      setSelectedFields(initialFields);
      console.log(result);
      // Show the fields selection dialog
      setShowFieldsDialog(true);
    } catch (err: any) {
      console.error("Parse error:", err);
      setError(`Error parsing the file: ${err.message || "Unknown error"}`);
      toast.error(`Error parsing the file: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult?.data || parseResult.data.length === 0) {
      setError("No data to import");
      return;
    }
    
    setLoading(true);
    
    try {
      // Check what fields are in the data before sending
      if (parseResult.data.length > 0) {
        console.log("IMPORT: First property fields:", Object.keys(parseResult.data[0]));
        console.log("IMPORT: First property data:", parseResult.data[0]);
        console.log(`IMPORT: Field count: ${Object.keys(parseResult.data[0]).length}`);
      }
      
      // Create a deep copy to ensure no references are maintained
      const dataToImport = JSON.parse(JSON.stringify(parseResult.data));
      
      // Call the server action to save the data
      const result = await saveImportedProperties(dataToImport);
      
      if (result.success) {
        setImportSuccess(true);
        toast.success(`Successfully imported ${result.count} properties`);
      } else {
        setError(`Import failed: ${result.error}`);
        toast.error(`Import failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(`Error during import: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) => {
      if (prev.includes(field)) {
        return prev.filter((f) => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  const handleSelectAllFields = () => {
    if (parseResult?.fields) {
      setSelectedFields(parseResult.fields);
    }
  };

  const handleClearFieldSelection = () => {
    setSelectedFields([]);
  };

  const DialogFieldSelector = () => (
    <Dialog open={showFieldsDialog} onOpenChange={setShowFieldsDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Select Fields ({selectedFields.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Fields to Display</DialogTitle>
          <DialogDescription>
            {parseResult?.fields?.length || 0} fields available. Choose which
            ones to display in the preview.
          </DialogDescription>
        </DialogHeader>

        {parseResult && (
          <div className="py-4">
            <div className="flex justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFields}
              >
                Select All ({parseResult.fields.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFieldSelection}
              >
                Clear Selection
              </Button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="flex flex-wrap gap-3">
                {parseResult.fields.map((field) => {
                  const fieldInfo = parseResult.detectedFields[field] || {
                    type: "unknown",
                    label: field,
                    example: null,
                  };

                  return (
                    <div
                      key={field}
                      className="flex flex-1 items-start space-x-2 p-2 border rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        id={`field-${field}`}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => toggleField(field)}
                      />
                      <div className="grid gap-1.5">
                        <Label
                          htmlFor={`field-${field}`}
                          className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {fieldInfo.label || field}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {fieldInfo.type || "unknown"}
                          </Badge>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            Ex:{" "}
                            {fieldInfo.example !== null &&
                            fieldInfo.example !== undefined
                              ? String(fieldInfo.example).substring(0, 20)
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => setShowFieldsDialog(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 flex flex-col w-full">
        <h1 className="text-3xl font-bold">Import Properties</h1>
        <p className="text-muted-foreground">
          Upload a CSV or Excel file to import property units.
        </p>

        <Card className="max-w-full overflow-x-auto flex flex-col">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Import your property data from a CSV or Excel file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  disabled={loading}
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {importSuccess && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Properties have been imported successfully.
                  </AlertDescription>
                </Alert>
              )}

              {file && !parseResult && !importSuccess && (
                <Button onClick={handlePreview} disabled={loading}>
                  {loading ? "Processing..." : "Preview Data"}
                </Button>
              )}
            </div>
          </CardContent>

          {parseResult && parseResult.data.length > 0 && (
            <>
              <CardHeader className="flex flex-row items-center justify-between border-t pt-6">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Preview of the data to be imported.{" "}
                    {parseResult.data.length} records found.
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <DialogFieldSelector />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col">
                {selectedFields.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No fields selected</AlertTitle>
                    <AlertDescription>
                      Please select at least one field to display in the
                      preview.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Tabs defaultValue="table" className="w-full flex flex-col">
                    <TabsList>
                      <TabsTrigger value="table">Table View</TabsTrigger>
                      <TabsTrigger value="json">JSON View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="table" className="mt-4 w-full">
                      <ScrollArea className="rounded-md border w-full">
                        <Table className="w-full">
                          {parseResult.data.length > 10 && (
                            <TableCaption>
                              Showing 20 of {parseResult.data.length} records
                            </TableCaption>
                          )}
                          <TableHeader>
                            <TableRow>
                              {selectedFields.map((field) => (
                                <TableHead
                                  key={field}
                                  className="whitespace-nowrap"
                                >
                                  {parseResult.detectedFields[field]?.label ||
                                    field}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parseResult.data
                              .slice(0, 20)
                              .map((unit, index) => (
                                <TableRow key={index}>
                                  {selectedFields.map((field) => {
                                    const value = unit[field];
                                    const fieldType =
                                      parseResult.detectedFields[field]?.type;

                                    // Format the value based on its type
                                    let displayValue = value;
                                    if (
                                      fieldType === "number" ||
                                      typeof value === "number"
                                    ) {
                                      displayValue = field
                                        .toLowerCase()
                                        .includes("price")
                                        ? `$${Number(value).toLocaleString()}`
                                        : Number(value).toLocaleString();
                                    } else if (
                                      value === null ||
                                      value === undefined
                                    ) {
                                      displayValue = "N/A";
                                    } else if (typeof value === "object") {
                                      displayValue = JSON.stringify(value);
                                    }

                                    return (
                                      <TableCell
                                        key={`${index}-${field}`}
                                        className="max-w-[200px] truncate"
                                      >
                                        {displayValue}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="json" className="mt-4">
                      <pre className="bg-muted p-4 rounded-md overflow-auto text-sm max-h-[550px]">
                        {JSON.stringify(
                          selectedFields.length === parseResult.fields.length
                            ? parseResult.data.slice(0, 10)
                            : filteredPreview.slice(0, 10),
                          null,
                          2
                        )}
                        {parseResult.data.length > 10 && "\n..."}
                      </pre>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleImport}
                  disabled={loading || selectedFields.length === 0}
                >
                  {loading ? "Importing..." : "Import Data"}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
