'use server';

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PropertyUnit } from '@/lib/csv-parser';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'properties.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Save imported properties to JSON file - preserve ALL fields
export async function saveImportedProperties(properties: PropertyUnit[]) {
  try {
    await ensureDataDir();
    
    // Log details about the first property
    if (properties.length > 0) {
      console.log("SERVER ACTION: First property fields:", Object.keys(properties[0]).join(", "));
      console.log("SERVER ACTION: Sample values:", JSON.stringify(properties[0], null, 2));
      console.log(`SERVER ACTION: Field count: ${Object.keys(properties[0]).length}`);
    }
    
    // Add unique IDs and timestamps if they don't exist
    const propertiesWithIds = properties.map(property => {
      // Create a new object and copy all properties
      const enhancedProperty = { ...property };
      
      // Add ID and timestamp if needed
      if (!enhancedProperty.id) {
        enhancedProperty.id = uuidv4();
      }
      
      if (!enhancedProperty.createdAt) {
        enhancedProperty.createdAt = new Date().toISOString();
      }
      
      return enhancedProperty;
    });
    
    // Read existing data if file exists
    let existingProperties: PropertyUnit[] = [];
    try {
      const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      existingProperties = JSON.parse(fileContent);
      console.log(`SERVER ACTION: Read ${existingProperties.length} existing properties`);
    } catch (error) {
      console.log("SERVER ACTION: No existing properties found or error reading file:", error);
      existingProperties = [];
    }
    
    // Merge with existing data
    const mergedProperties = [...existingProperties, ...propertiesWithIds];
    
    // Write back to file
    await fs.writeFile(
      DATA_FILE_PATH, 
      JSON.stringify(mergedProperties, null, 2),
      'utf-8'
    );
    
    // Verify what we saved
    try {
      const verificationContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      const savedData = JSON.parse(verificationContent);
      
      if (savedData.length > 0) {
        const lastSavedItem = savedData[savedData.length - 1];
        console.log("SERVER ACTION: Verification - last saved item fields:", Object.keys(lastSavedItem).join(", "));
        console.log(`SERVER ACTION: Verification - field count: ${Object.keys(lastSavedItem).length}`);
      }
    } catch (error) {
      console.error("SERVER ACTION: Error verifying saved data:", error);
    }
    
    return { success: true, count: propertiesWithIds.length };
  } catch (error) {
    console.error('SERVER ACTION: Error saving properties:', error);
    return { success: false, error: String(error) };
  }
}
