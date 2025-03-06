"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PropertyUnit } from "@/lib/csv-parser";
import { generatePropertiesReport } from "@/lib/pdf-generator";
import { generateReportFilename, savePdf } from "@/lib/utils";
import { FileDown, Loader2 } from "lucide-react";

interface GenerateReportButtonProps {
  properties: PropertyUnit[];
  isGenerating?: boolean;
  onGenerateStart?: () => void;
  onGenerateEnd?: (success: boolean) => void;
}

export default function GenerateReportButton({
  properties,
  isGenerating = false,
  onGenerateStart,
  onGenerateEnd
}: GenerateReportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("Property Listings Report");
  const [generating, setGenerating] = useState(false);
  const [propertiesLimit, setPropertiesLimit] = useState("all");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  // Handle PDF generation
  const handleGenerateReport = async () => {
    if (properties.length === 0) return;
    
    setGenerating(true);
    onGenerateStart?.();
    
    try {
      // Determine how many properties to include in the report
      const limit = propertiesLimit === "all" 
        ? properties.length 
        : parseInt(propertiesLimit, 10);
      
      const propertiesToInclude = properties.slice(0, limit);
      
      // Generate the PDF document
      const doc = await generatePropertiesReport(
        propertiesToInclude,
        reportTitle
      );
      
      // Save the PDF file
      savePdf(doc, generateReportFilename());
      
      onGenerateEnd?.(true);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      onGenerateEnd?.(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={properties.length === 0 || isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Export PDF Report
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Property Report</DialogTitle>
          <DialogDescription>
            Create a professional PDF report for selected properties.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="report-title">Report Title</Label>
            <Input 
              id="report-title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)} 
              placeholder="Enter report title"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="properties-limit">Number of Properties</Label>
            <Select 
              value={propertiesLimit} 
              onValueChange={setPropertiesLimit}
            >
              <SelectTrigger id="properties-limit">
                <SelectValue placeholder="Select limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties ({properties.length})</SelectItem>
                <SelectItem value="1">1 Property</SelectItem>
                <SelectItem value="5">5 Properties</SelectItem>
                <SelectItem value="10">10 Properties</SelectItem>
                <SelectItem value="25">25 Properties</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-images" 
              checked={includeImages} 
              onCheckedChange={(checked) => setIncludeImages(!!checked)} 
            />
            <Label htmlFor="include-images">Include property images</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-summary" 
              checked={includeSummary}
              onCheckedChange={(checked) => setIncludeSummary(!!checked)}
            />
            <Label htmlFor="include-summary">Include summary table</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleGenerateReport} 
            className="flex items-center gap-2"
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
