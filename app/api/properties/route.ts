import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { PropertyUnit } from '@/lib/csv-parser';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'properties.json');

export async function GET(request: NextRequest) {
  try {
    // Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const minPrice = Number(searchParams.get('minPrice')) || 0;
    const maxPrice = Number(searchParams.get('maxPrice')) || Infinity;
    const location = searchParams.get('location') || '';
    const rooms = searchParams.get('rooms') || '';
    const unitType = searchParams.get('unitType') || '';
    const unitStatus = searchParams.get('unitStatus') || '';
    const minArea = Number(searchParams.get('minArea')) || 0;
    const maxArea = Number(searchParams.get('maxArea')) || Infinity;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    
    // Read data file
    let properties: PropertyUnit[] = [];
    try {
      const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      properties = JSON.parse(fileContent);
      
      if (properties.length > 0) {
        const firstProp = properties[0];
        console.log("API: First property from file fields:", Object.keys(firstProp).join(", "));
        console.log(`API: Field count: ${Object.keys(firstProp).length}`);
      }
      
    } catch (error) {
      console.error('API: Error reading properties file:', error);
      return NextResponse.json({ 
        data: [], 
        total: 0, 
        page, 
        limit,
        error: 'Could not read properties data file' 
      });
    }
    
    // Apply filters but carefully maintain all fields
    let filteredProperties = [...properties]; // Make a shallow copy
    
    // Text search (case insensitive)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProperties = filteredProperties.filter(property => {
        return (
          (property['Unit Name'] && String(property['Unit Name']).toLowerCase().includes(searchLower)) ||
          (property['Phase: Phase Name'] && String(property['Phase: Phase Name']).toLowerCase().includes(searchLower)) ||
          (property['Unit Type'] && String(property['Unit Type']).toLowerCase().includes(searchLower)) ||
          (property['Building Name'] && String(property['Building Name']).toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Price range filter
    if (minPrice > 0 || maxPrice < Infinity) {
      filteredProperties = filteredProperties.filter(property => {
        const price = Number(property['Unit Price'] || property['Final Total Unit Price']) || 0;
        return price >= minPrice && price <= maxPrice;
      });
    }
    
    // Location filter
    if (location && location !== 'any_location') {
      filteredProperties = filteredProperties.filter(property => {
        return property['Phase: Phase Name'] && 
               String(property['Phase: Phase Name']).toLowerCase() === location.toLowerCase();
      });
    }
    
    // Rooms filter
    if (rooms && rooms !== 'any_rooms') {
      filteredProperties = filteredProperties.filter(property => {
        return property['Number of rooms'] && 
               String(property['Number of rooms']) === rooms;
      });
    }
    
    // Unit Type filter
    if (unitType && unitType !== 'any_type') {
      filteredProperties = filteredProperties.filter(property => {
        return property['Unit Type'] && 
               String(property['Unit Type']).toLowerCase() === unitType.toLowerCase();
      });
    }
    
    // Unit Status filter
    if (unitStatus && unitStatus !== 'any_status') {
      filteredProperties = filteredProperties.filter(property => {
        return property['Unit Status'] && 
               String(property['Unit Status']).toLowerCase() === unitStatus.toLowerCase();
      });
    }
    
    // Area range filter
    if (minArea > 0 || maxArea < Infinity) {
      filteredProperties = filteredProperties.filter(property => {
        const area = Number(property['Unit Gross Area']) || 0;
        return area >= minArea && area <= maxArea;
      });
    }
    
    // Calculate pagination
    const total = filteredProperties.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Important: Do not transform the property objects - return them as is
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);
    
    // Log the first item to verify all fields are present
    if (paginatedProperties.length > 0) {
      console.log('Sample paginated property:');
      console.log(JSON.stringify(paginatedProperties[0], null, 2));
      
      // Count number of fields to verify
      const fieldCount = Object.keys(paginatedProperties[0]).length;
      console.log(`Property has ${fieldCount} fields`);
    }
    
    // Get unique filter options from your data
    const locations = [...new Set(properties
      .map(p => p['Phase: Phase Name'])
      .filter(Boolean))];
    
    const roomOptions = [...new Set(properties
      .map(p => p['Number of rooms'])
      .filter(Boolean)
      .map(String))];
    
    const unitTypes = [...new Set(properties
      .map(p => p['Unit Type'])
      .filter(Boolean))];
    
    const statusOptions = [...new Set(properties
      .map(p => p['Unit Status'])
      .filter(Boolean))];
    
    // Return the complete objects with ALL their fields
    return NextResponse.json({
      data: JSON.parse(JSON.stringify(paginatedProperties)), // Deep copy to ensure all fields
      total,
      page,
      limit,
      filterOptions: {
        locations,
        roomOptions,
        unitTypes,
        statusOptions
      }
    });
    
  } catch (error) {
    console.error('API: Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties: ' + String(error) },
      { status: 500 }
    );
  }
}
