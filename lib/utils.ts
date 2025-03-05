/* eslint-disable @typescript-eslint/no-explicit-any */
// app/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to simulate an API request with delay
export function simulateApiRequest<T>(data: T, delay = 500): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
}

// Function to filter properties based on search criteria
export function filterProperties(
  properties: any[],
  search: string,
  filters: {
    priceRange?: [number, number];
    city?: string;
    rooms?: string;
  }
) {
  return properties.filter(property => {
    // Search term filtering
    const searchLower = search.toLowerCase();
    const matchesSearch = search === '' || 
      property.name?.toLowerCase().includes(searchLower) ||
      property.description?.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower);
    
    if (!matchesSearch) return false;
    
    // Price range filtering
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (property.price < min || property.price > max) return false;
    }
    
    // City filtering
    if (filters.city && filters.city !== 'all') {
      if (property.city !== filters.city) return false;
    }
    
    // Rooms filtering
    if (filters.rooms && filters.rooms !== 'all') {
      const roomCount = parseInt(filters.rooms);
      if (filters.rooms === '4+') {
        if (property.rooms < 4) return false;
      } else {
        if (property.rooms !== roomCount) return false;
      }
    }
    
    return true;
  });
}