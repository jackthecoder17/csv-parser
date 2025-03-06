"use client";

import { useState, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter } from "lucide-react";
import { ParseResult } from "@/lib/csv-parser";

interface FieldSelectorDialogProps {
  parseResult: ParseResult;
  selectedFields: string[];
  onSelectionChange: (selectedFields: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Use memo to prevent unnecessary re-renders
const FieldSelectorDialog = memo(function FieldSelectorDialog({
  parseResult,
  selectedFields,
  onSelectionChange,
  open,
  onOpenChange,
}: FieldSelectorDialogProps) {
  // Use internal state to avoid re-renders of parent component
  const [internalSelectedFields, setInternalSelectedFields] = useState<string[]>(selectedFields);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<{ top: number }>({ top: 0 });

  // Sync internal state with props when they change
  useEffect(() => {
    setInternalSelectedFields(selectedFields);
  }, [selectedFields]);

  // Save scroll position before any state update
  const saveScrollPosition = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollPositionRef.current = { top: scrollContainer.scrollTop };
      }
    }
  };

  // Restore scroll position after rendering
  useEffect(() => {
    const restoreScrollPosition = () => {
      if (scrollAreaRef.current && open) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPositionRef.current.top;
        }
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(restoreScrollPosition);
  }, [internalSelectedFields, open]);

  const toggleField = (field: string) => {
    saveScrollPosition();
    
    setInternalSelectedFields((prev) => {
      const newSelection = prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field];
      
      // Only propagate changes to parent when dialog is closed or explicitly saved
      return newSelection;
    });
  };

  const handleSelectAllFields = () => {
    saveScrollPosition();
    setInternalSelectedFields(parseResult.fields);
  };

  const handleClearFieldSelection = () => {
    saveScrollPosition();
    setInternalSelectedFields([]);
  };

  const handleDone = () => {
    // Propagate changes to parent component
    onSelectionChange(internalSelectedFields);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          <ScrollArea ref={scrollAreaRef} className="h-[300px] pr-4">
            <div className="grid grid-cols-2 gap-3">
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
                      checked={internalSelectedFields.includes(field)}
                      onCheckedChange={() => toggleField(field)}
                    />
                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`field-${field}`}
                        className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {fieldInfo.label || field}
                      </Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {fieldInfo.type || "unknown"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        Ex:{" "}
                        {fieldInfo.example !== null &&
                        fieldInfo.example !== undefined
                          ? String(fieldInfo.example).substring(0, 20)
                          : "-"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={handleDone}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default FieldSelectorDialog;
