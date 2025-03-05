/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx';

// Generic data structure to avoid any assumptions
export interface PropertyUnit {
  [key: string]: any;
}

// Result structure for parsed data
export interface ParseResult {
  data: PropertyUnit[];
  fields: string[];
  detectedFields: {
    [key: string]: {
      type: string;
      label: string;
      example: any;
    };
  };
}

/**
 * Simple CSV parser that handles various CSV formats
 */
export async function parseCSV(csvString: string): Promise<ParseResult> {
  console.log("CSV parsing started");
  
  try {
    // Clean the CSV string and split into rows
    const rows = csvString.trim().split(/\r?\n/);
    
    if (rows.length === 0) {
      console.warn("CSV file is empty");
      return { data: [], fields: [], detectedFields: {} };
    }
    
    // Try to detect the delimiter
    const firstRow = rows[0];
    const possibleDelimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxFields = 0;
    
    possibleDelimiters.forEach(delimiter => {
      const count = firstRow.split(delimiter).length;
      if (count > maxFields) {
        maxFields = count;
        bestDelimiter = delimiter;
      }
    });
    
    console.log(`Using delimiter: "${bestDelimiter}"`);
    
    // Extract headers from the first row
    const headers = rows[0].split(bestDelimiter).map(h => {
      // Clean up headers - trim and handle quoted values
      const cleaned = h.trim().replace(/^["'](.+)["']$/, '$1');
      return cleaned || `Column${Math.random().toString(36).substring(2, 7)}`;
    });
    
    console.log("Headers found:", headers);
    
    // Parse the data rows
    const data: PropertyUnit[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue; // Skip empty rows
      
      const values = row.split(bestDelimiter);
      const item: PropertyUnit = {};
      
      headers.forEach((header, index) => {
        let value = index < values.length ? values[index].trim() : '';
        
        // Remove quotes if present
        value = value.replace(/^["'](.+)["']$/, '$1');
        
        // Store the value as-is, without transformation
        item[header] = value;
      });
      
      // Add the row data
      data.push(item);
    }
    
    console.log(`Parsed ${data.length} data rows`);
    
    // Detect field types
    const detectedFields: Record<string, { type: string; label: string; example: any }> = {};
    
    headers.forEach(header => {
      // Find a non-empty example
      let example = null;
      let type = 'string';
      
      for (const item of data) {
        const value = item[header];
        if (value !== undefined && value !== null && value !== '') {
          example = value;
          
          // Simple type detection
          if (!isNaN(Number(value)) && value !== '') {
            type = 'number';
            example = Number(value);
          }
          break;
        }
      }
      
      detectedFields[header] = {
        type,
        label: header,
        example
      };
    });
    
    return {
      data,
      fields: headers,
      detectedFields
    };
    
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Simple Excel parser that makes minimal assumptions
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  console.log("Excel parsing started");
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        console.log(`Reading sheet: ${firstSheetName}`);
        
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        console.log(`Found ${rawData.length} rows in Excel`);
        
        if (rawData.length === 0) {
          return resolve({ data: [], fields: [], detectedFields: {} });
        }
        
        // Extract fields from the first row
        const firstRow = rawData[0] as any;
        const fields = Object.keys(firstRow);
        
        console.log("Excel headers:", fields);
        
        // Extract all data rows
        const parsedData: PropertyUnit[] = rawData.map(row => {
          const typedRow = row as any;
          // Make a clean copy of the data
          const cleanRow: PropertyUnit = {};
          
          fields.forEach(field => {
            cleanRow[field] = typedRow[field];
          });
          
          return cleanRow;
        });
        
        // Detect field types
        const detectedFields: Record<string, { type: string; label: string; example: any }> = {};
        
        fields.forEach(field => {
          let example = null;
          let type = 'string';
          
          // Find the first non-empty value
          for (const row of parsedData) {
            const value = row[field];
            if (value !== undefined && value !== null && value !== '') {
              example = value;
              
              if (typeof value === 'number') {
                type = 'number';
              } else if (!isNaN(Number(value)) && String(value).trim() !== '') {
                type = 'number';
                example = Number(value);
              }
              
              break;
            }
          }
          
          detectedFields[field] = {
            type,
            label: field,
            example
          };
        });
        
        console.log(`Processed ${parsedData.length} Excel rows`);
        
        resolve({
          data: parsedData,
          fields,
          detectedFields
        });
        
      } catch (error) {
        console.error("Error parsing Excel:", error);
        reject(new Error(`Failed to parse Excel: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse any supported file format
 */
export async function parseFile(file: File): Promise<ParseResult> {
  console.log(`Parsing file: ${file.name} (${file.size} bytes, type: ${file.type})`);
  
  const fileName = file.name.toLowerCase();
  
  try {
    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      console.log(`CSV content length: ${text.length} characters`);
      return parseCSV(text);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return parseExcel(file);
    } else {
      throw new Error(`Unsupported file format: ${fileName}. Please upload a CSV or Excel file.`);
    }
  } catch (error) {
    console.error("File parsing error:", error);
    throw error;
  }
}