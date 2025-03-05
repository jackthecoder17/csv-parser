/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/units/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { filterProperties } from '@/lib/utils';

// This would normally come from a database
let unitsDatabase: any[] = [];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const minPrice = parseInt(searchParams.get('minPrice') || '0');
  const maxPrice = parseInt(searchParams.get('maxPrice') || '1000000');
  const city = searchParams.get('city') || 'all';
  const rooms = searchParams.get('rooms') || 'all';
  
  // Simulate server delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const filteredUnits = filterProperties(
    unitsDatabase,
    search,
    {
      priceRange: [minPrice, maxPrice],
      city,
      rooms
    }
  );
  
  return NextResponse.json({
    units: filteredUnits,
    total: filteredUnits.length,
    page: 1,
    limit: 10,
    totalPages: Math.ceil(filteredUnits.length / 10)
  });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  if (Array.isArray(data.units)) {
    // Add new units to the database
    unitsDatabase = [...unitsDatabase, ...data.units.map((unit : any) => ({
      ...unit,
      id: unit.id || `unit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: unit.createdAt || new Date().toISOString()
    }))];
    
    return NextResponse.json({
      success: true,
      count: data.units.length,
      message: `Successfully imported ${data.units.length} units`
    });
  }
  
  return NextResponse.json({
    success: false,
    message: 'Invalid data format'
  }, { status: 400 });
}