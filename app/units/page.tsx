/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PropertyUnit } from "@/lib/csv-parser";
import DashboardLayout from "@/components/dashboard/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlertCircle, Search, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { debounce } from "lodash";

// Prevent hydration issues with client-only components
const ClientOnlySlider = ({
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  disabled,
}: {
  value: number[];
  min: number;
  max: number;
  step: number;
  onChange: (value: number[]) => void;
  onCommit: (value: number[]) => void;
  disabled: boolean;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return an element with consistent styling for SSR
    return <div className="w-full h-5 bg-muted rounded-md"></div>;
  }

  return (
    <Slider
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={onChange}
      onValueCommit={onCommit}
      disabled={disabled}
    />
  );
};

function Units() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Refs to track mounted state and request abortions
  const isMounted = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  // State for properties and loading
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);

  // State for filter options
  const [locations, setLocations] = useState<string[]>([]);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [unitTypes, setUnitTypes] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  // State for filter values (initialized with defaults, populated after mount)
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(20000000); // Increased for higher property values
  const [selectedLocation, setSelectedLocation] = useState("any_location");
  const [selectedRooms, setSelectedRooms] = useState("any_rooms");
  const [selectedUnitType, setSelectedUnitType] = useState("any_type");
  const [selectedStatus, setSelectedStatus] = useState("any_status");
  const [minArea, setMinArea] = useState(0);
  const [maxArea, setMaxArea] = useState(500); // Default max area

  // Track if filters have been initialized from URL
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Create a debounced version of the search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      if (isMounted.current) {
        startTransition(() => {
          updateSearchParams({ search: searchValue, page: "1" });
        });
      }
    }, 500),
    [startTransition]
  );

  // Reset function to prevent memory leaks
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      debouncedSearch.cancel();
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [debouncedSearch]);

  // Function to update URL search params
  const updateSearchParams = useCallback(
    (params: Record<string, string>) => {
      if (!isMounted.current) return;

      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newSearchParams.set(key, value);
        } else {
          newSearchParams.delete(key);
        }
      });

      router.push(`?${newSearchParams.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleLocationChange = useCallback(
    (value: string) => {
      setSelectedLocation(value);
      startTransition(() => {
        if (value === "any_location") {
          updateSearchParams({ location: "", page: "1" });
        } else {
          updateSearchParams({ location: value, page: "1" });
        }
      });
    },
    [startTransition, updateSearchParams]
  );

  const handleRoomsChange = useCallback(
    (value: string) => {
      setSelectedRooms(value);
      startTransition(() => {
        // Only add to URL params if not the "any" value
        if (value === "any_rooms") {
          updateSearchParams({ rooms: "", page: "1" });
        } else {
          updateSearchParams({ rooms: value, page: "1" });
        }
      });
    },
    [startTransition, updateSearchParams]
  );

  const handleUnitTypeChange = useCallback(
    (value: string) => {
      setSelectedUnitType(value);
      startTransition(() => {
        if (value === "any_type") {
          updateSearchParams({ unitType: "", page: "1" });
        } else {
          updateSearchParams({ unitType: value, page: "1" });
        }
      });
    },
    [startTransition, updateSearchParams]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setSelectedStatus(value);
      startTransition(() => {
        if (value === "any_status") {
          updateSearchParams({ unitStatus: "", page: "1" });
        } else {
          updateSearchParams({ unitStatus: value, page: "1" });
        }
      });
    },
    [startTransition, updateSearchParams]
  );

  const handlePriceChange = useCallback((values: number[]) => {
    const [min, max] = values;
    setMinPrice(min);
    setMaxPrice(max);
  }, []);

  const handlePriceCommit = useCallback(
    (values: number[]) => {
      const [min, max] = values;
      startTransition(() => {
        updateSearchParams({
          minPrice: min.toString(),
          maxPrice: max.toString(),
          page: "1",
        });
      });
    },
    [startTransition, updateSearchParams]
  );

  const handleAreaChange = useCallback((values: number[]) => {
    const [min, max] = values;
    setMinArea(min);
    setMaxArea(max);
  }, []);

  const handleAreaCommit = useCallback(
    (values: number[]) => {
      const [min, max] = values;
      startTransition(() => {
        updateSearchParams({
          minArea: min.toString(),
          maxArea: max.toString(),
          page: "1",
        });
      });
    },
    [startTransition, updateSearchParams]
  );

  // Handle page navigation
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      startTransition(() => {
        updateSearchParams({ page: newPage.toString() });
      });
      // Scroll back to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [startTransition, updateSearchParams]
  );

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearch("");
    setSelectedLocation("any_location");
    setSelectedRooms("any_rooms");
    setSelectedUnitType("any_type");
    setSelectedStatus("any_status");
    setMinPrice(0);
    setMaxPrice(20000000);
    setMinArea(0);
    setMaxArea(500);
    setPage(1);

    startTransition(() => {
      router.push("/units");
    });
  }, [router]);

  // Retry on error
  const handleRetry = useCallback(() => {
    setError(null);
    fetchProperties();
  }, []);

  // Fetch properties from API with current filters
  const fetchProperties = useCallback(async () => {
    // Don't fetch until filters have been initialized
    if (!filtersInitialized) return;

    // Cancel previous request if it exists
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create new abort controller for this request
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(window.location.search);

      // Set a timeout to prevent hanging requests
      const timeoutId = setTimeout(() => {
        if (abortController.current) {
          abortController.current.abort();
        }
      }, 15000); // 15 second timeout

      const response = await fetch(`/api/properties?${params.toString()}`, {
        signal,
        headers: {
          "Cache-Control": "no-store",
        },
      });

      clearTimeout(timeoutId);

      if (!isMounted.current) return;

      if (!response.ok) {
        throw new Error(
          `Error ${response.status}: ${
            response.statusText || "Failed to fetch properties"
          }`
        );
      }

      const result = await response.json();

      if (!isMounted.current) return;

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid data format received from server");
      }

      setProperties(result.data);
      setTotal(result.total || 0);
      setLocations(
        Array.isArray(result.filterOptions?.locations)
          ? result.filterOptions.locations
          : []
      );
      setRoomOptions(
        Array.isArray(result.filterOptions?.roomOptions)
          ? result.filterOptions.roomOptions
          : []
      );
      setUnitTypes(
        Array.isArray(result.filterOptions?.unitTypes)
          ? result.filterOptions.unitTypes
          : []
      );
      setStatusOptions(
        Array.isArray(result.filterOptions?.statusOptions)
          ? result.filterOptions.statusOptions
          : []
      );

      // Calculate max page
      const limit = Number(params.get("limit")) || 10;
      const maxPageCalc = Math.max(1, Math.ceil((result.total || 0) / limit));
      setMaxPage(maxPageCalc);

      // If current page is beyond max page, go to max page
      if (page > maxPageCalc) {
        handlePageChange(maxPageCalc);
      }
    } catch (err) {
      if (!isMounted.current) return;

      // Don't show error for aborted requests
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }

      setError(
        `Failed to load properties: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error("Error fetching properties:", err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [filtersInitialized, page, handlePageChange]);

  // Initialize filters from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize values from URL parameters
    const params = new URLSearchParams(window.location.search);

    setSearch(params.get("search") || "");

    // Validate min/max price to ensure min <= max
    const minPriceParam = Math.max(0, Number(params.get("minPrice")) || 0);
    const maxPriceParam = Math.max(
      minPriceParam,
      Number(params.get("maxPrice")) || 20000000
    );

    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);

    // Validate min/max area
    const minAreaParam = Math.max(0, Number(params.get("minArea")) || 0);
    const maxAreaParam = Math.max(
      minAreaParam,
      Number(params.get("maxArea")) || 500
    );

    setMinArea(minAreaParam);
    setMaxArea(maxAreaParam);

    // Use the ANY values as default, or the URL param if present
    const locationParam = params.get("location");
    setSelectedLocation(locationParam || "any_location");

    const roomsParam = params.get("rooms");
    setSelectedRooms(roomsParam || "any_rooms");

    const unitTypeParam = params.get("unitType");
    setSelectedUnitType(unitTypeParam || "any_type");

    const statusParam = params.get("unitStatus");
    setSelectedStatus(statusParam || "any_status");

    setPage(Math.max(1, Number(params.get("page")) || 1));

    setFiltersInitialized(true);
  }, []);

  // Fetch data when filters initialized or search params change
  useEffect(() => {
    if (filtersInitialized) {
      fetchProperties();
    }
  }, [fetchProperties, filtersInitialized, searchParams]);

  // Use consistent keys for property rows to avoid hydration mismatches
  const getPropertyKey = useCallback(
    (property: PropertyUnit, index: number) => {
      // Use a deterministic property key
      if (property.id) return property.id;
      // If no ID, use a property value combination that would be unique
      const nameStr = property.name || "";
      const priceStr = property.price ? String(property.price) : "";
      const cityStr = property.city || "";
      // Don't use random values to avoid hydration mismatches
      return `property-${index}-${nameStr.substring(
        0,
        10
      )}-${priceStr}-${cityStr.substring(0, 10)}`;
    },
    []
  );

  return (
    <div className="space-y-6 w-full">
      <h1 className="text-3xl font-bold">Properties</h1>

      <div className="flex flex-col gap-6 w-full">
        {/* Search and Filters */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>
              Find properties by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Search box */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  className="pl-8"
                  value={search}
                  onChange={handleSearchChange}
                  disabled={isPending || loading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {/* Location filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  {!filtersInitialized ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedLocation}
                      onValueChange={handleLocationChange}
                      disabled={isPending || loading || locations.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_location">
                          Any location
                        </SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Rooms filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bedrooms</label>
                  {!filtersInitialized ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedRooms}
                      onValueChange={handleRoomsChange}
                      disabled={
                        isPending || loading || roomOptions.length === 0
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rooms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_rooms">Any number</SelectItem>
                        {roomOptions.map((room) => (
                          <SelectItem key={room} value={room}>
                            {room}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Unit Type filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Property Type</label>
                  {!filtersInitialized ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedUnitType}
                      onValueChange={handleUnitTypeChange}
                      disabled={isPending || loading || unitTypes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_type">Any type</SelectItem>
                        {unitTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Status filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  {!filtersInitialized ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedStatus}
                      onValueChange={handleStatusChange}
                      disabled={
                        isPending || loading || statusOptions.length === 0
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any_status">Any status</SelectItem>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Price range filter */}
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Price range</label>
                    <span className="text-sm text-muted-foreground">
                      ${minPrice.toLocaleString()} - $
                      {maxPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-8">
                    {!filtersInitialized ? (
                      <Skeleton className="h-4 w-full" />
                    ) : (
                      <ClientOnlySlider
                        value={[minPrice, maxPrice]}
                        min={0}
                        max={20000000}
                        step={10000}
                        onChange={handlePriceChange}
                        onCommit={handlePriceCommit}
                        disabled={isPending || loading}
                      />
                    )}
                  </div>
                </div>

                {/* Area range filter */}
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">
                      Area range (m²)
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {minArea.toLocaleString()} - {maxArea.toLocaleString()} m²
                    </span>
                  </div>
                  <div className="h-8">
                    {!filtersInitialized ? (
                      <Skeleton className="h-4 w-full" />
                    ) : (
                      <ClientOnlySlider
                        value={[minArea, maxArea]}
                        min={0}
                        max={500}
                        step={10}
                        onChange={handleAreaChange}
                        onCommit={handleAreaCommit}
                        disabled={isPending || loading}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Clear filters button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={
                    isPending ||
                    loading ||
                    (!search &&
                      !selectedLocation &&
                      !selectedRooms &&
                      !selectedUnitType &&
                      !selectedStatus &&
                      minPrice === 0 &&
                      maxPrice === 20000000 &&
                      minArea === 0 &&
                      maxArea === 500)
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="w-full">
          <CardHeader className="w-full">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Properties</CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading..."
                    : `Showing ${properties.length} of ${total} properties`}
                </CardDescription>
              </div>
              {error && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="w-full">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading && !properties.length ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 px-4">
                <h3 className="text-lg font-semibold mb-2">
                  No properties found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or clearing them to see more
                  results.
                </p>
                <Button onClick={handleClearFilters}>Clear All Filters</Button>
              </div>
            ) : (
              <ScrollArea className="w-full rounded-md border">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className=" whitespace-nowrap w-[240px]">
                        Unit Name
                      </TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rooms</TableHead>
                      <TableHead>Area (m²)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((property, index) => (
                      <TableRow key={getPropertyKey(property, index)}>
                        <TableCell className="font-medium w-[240px] whitespace-nowrap">
                          {property["Unit Name"] || (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* Make sure to check for both price fields */}
                          {property["Unit Price"] !== undefined ||
                          property["Final Total Unit Price"] !== undefined ? (
                            `$${Number(
                              property["Unit Price"] ||
                                property["Final Total Unit Price"]
                            ).toLocaleString()}`
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {property["Phase: Phase Name"] || (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {property["Unit Type"] || (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {property["Number of rooms"] !== undefined ? (
                            property["Number of rooms"]
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {property["Unit Gross Area"] !== undefined ? (
                            `${property["Unit Gross Area"]} m²`
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {property["Unit Status"] || (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            <span>Loading more...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 w-full">
            <div className="flex w-full sm:w-auto justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading || isPending}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground flex items-center">
                Page {page} of {maxPage}
              </div>
              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= maxPage || loading || isPending}
              >
                Next
              </Button>
            </div>
            <div className="w-full sm:w-auto">
              <Select
                value={page.toString()}
                onValueChange={(value) => handlePageChange(Number(value))}
                disabled={maxPage <= 1 || loading || isPending}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder={`Page ${page}`} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxPage }, (_, i) => i + 1).map((p) => (
                    <SelectItem key={p} value={p.toString()}>
                      Page {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function UnitsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<Skeleton className="min-h-screen w-full" />}>
        <div className="w-full">
          <Units />
        </div>
      </Suspense>
    </DashboardLayout>
  );
}
