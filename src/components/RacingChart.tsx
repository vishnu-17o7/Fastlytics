import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
// Import API functions and types
import { fetchLapTimes, fetchSessionDrivers, SessionDriver, LapTimeDataPoint } from '@/lib/api';
import LoadingSpinnerF1 from "@/components/ui/LoadingSpinnerF1"; // Import the spinner
import { AlertCircle, Users, PlusCircle, XCircle } from 'lucide-react'; // Added PlusCircle, XCircle icons
import { driverColor } from '@/lib/driverColor';
// Import Select components
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Use Card for layout
import { Button } from "@/components/ui/button"; // Import Button

// Helper function to format seconds into MM:SS.mmm
const formatLapTime = (totalSeconds: number | null): string => {
  if (totalSeconds === null || isNaN(totalSeconds)) {
    return 'N/A';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  // Pad seconds with leading zero if needed, keep 3 decimal places for milliseconds
  const formattedSeconds = seconds.toFixed(3).padStart(6, '0'); // 6 = SS.mmm
  return `${minutes}:${formattedSeconds}`;
};

interface RacingChartProps {
  className?: string;
  delay?: number;
  title: string;
  year: number;
  event: string;
  session: string;
  initialDrivers: string[]; // Expect array of 2 to 5 driver codes
  staticData?: LapTimeDataPoint[]; // Optional static data prop
}

const MAX_DRIVERS = 5; // Define max drivers constant
const MIN_DRIVERS = 2; // Define min drivers constant

const RacingChart: React.FC<RacingChartProps> = ({
  className,
  delay = 0,
  title,
  year,
  event,
  session,
  initialDrivers, // Should be length 2 to 5
  staticData // Destructure the new prop
}) => {

  // Validate initialDrivers prop length and clamp if necessary
  let validatedInitialDrivers = initialDrivers || [];
  if (!staticData) {
      if (validatedInitialDrivers.length < MIN_DRIVERS) {
          console.warn(`RacingChart received fewer than ${MIN_DRIVERS} initialDrivers. Falling back to defaults.`);
          validatedInitialDrivers = ["VER", "LEC"]; // Default fallback
      } else if (validatedInitialDrivers.length > MAX_DRIVERS) {
          console.warn(`RacingChart received more than ${MAX_DRIVERS} initialDrivers. Clamping to ${MAX_DRIVERS}.`);
          validatedInitialDrivers = validatedInitialDrivers.slice(0, MAX_DRIVERS);
      }
  }

   // Always call useState at the top level
   const [selectedDrivers, setSelectedDrivers] = useState<string[]>(validatedInitialDrivers);

   // Determine which drivers to actually display/fetch for
   // Use validatedInitialDrivers if staticData is provided, otherwise use the state
   const driversToDisplay = staticData ? validatedInitialDrivers : selectedDrivers;

   // Fetch available drivers for the session (only if not using static data)
   const { data: availableDrivers, isLoading: isLoadingDrivers } = useQuery<SessionDriver[]>({
    queryKey: ['sessionDrivers', year, event, session],
    queryFn: () => fetchSessionDrivers(year, event, session),
    staleTime: Infinity, // Driver list for a session won't change
    gcTime: 1000 * 60 * 60 * 24, // Keep for a day
    enabled: !staticData && !!year && !!event && !!session, // Disable if staticData is provided
  });

   // Fetch lap time data based on selected drivers (only if not using static data)
   // Use selectedDrivers state for the query key and function when fetching
   const { data: fetchedLapData, isLoading: isLoadingLapTimes, error, isError } = useQuery<LapTimeDataPoint[]>({
     // Sort drivers in the key for consistent caching regardless of selection order
     queryKey: ['lapTimes', year, event, session, ...selectedDrivers.sort()],
     queryFn: () => fetchLapTimes(year, event, session, selectedDrivers),
     staleTime: 1000 * 60 * 5,
     gcTime: 1000 * 60 * 15,
    retry: 1,
    // Ensure we have the minimum number of drivers selected before enabling fetch
    enabled: !staticData && !!year && !!event && !!session && selectedDrivers.length >= MIN_DRIVERS,
  });

  // Use staticData if provided, otherwise use fetched data
  const lapData = staticData || fetchedLapData;

  // --- Driver Selection Handlers ---
  const handleDriverChange = (index: number, value: string) => {
    // Prevent selecting the same driver multiple times
    if (selectedDrivers.includes(value) && selectedDrivers[index] !== value) {
      console.warn("Driver already selected");
      return;
    }
    // This function should only be called when not using static data
    if (!staticData) {
      const newSelection = [...selectedDrivers];
      newSelection[index] = value;
      setSelectedDrivers(newSelection);
    }
  };

  const addDriver = () => {
    if (selectedDrivers.length < MAX_DRIVERS && availableDrivers) {
      // Find the first available driver not already selected
      const nextDriver = availableDrivers.find(d => !selectedDrivers.includes(d.code));
      if (nextDriver) {
        setSelectedDrivers([...selectedDrivers, nextDriver.code]);
      } else {
        console.warn("No more available drivers to add.");
        // Optionally show a message to the user
      }
    }
  };

  const removeDriver = (indexToRemove: number) => {
    if (selectedDrivers.length > MIN_DRIVERS) {
      setSelectedDrivers(selectedDrivers.filter((_, index) => index !== indexToRemove));
    }
  };

  // Adjust isLoading check for static data
  const isLoading = !staticData && (isLoadingDrivers || isLoadingLapTimes);

  // --- Render States ---
  // Simplified loading/error checks
  const renderContent = () => {
    if (isLoading) {
      // Use LoadingSpinnerF1 instead of Skeleton
      return (
        <div className="w-full h-[300px] flex items-center justify-center bg-gray-900/50 rounded-lg">
          <LoadingSpinnerF1 />
        </div>
      );
    }
    if (isError || !lapData) {
      return (
        <div className="w-full h-[300px] bg-gray-900/80 border border-red-500/30 rounded-lg flex flex-col items-center justify-center text-red-400">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">Error loading lap times</p>
          <p className="text-xs text-gray-500 mt-1">{(error as Error)?.message || 'Could not fetch data.'}</p>
        </div>
      );
    }
    if (lapData.length === 0) {
      return (
        <div className="w-full h-[300px] bg-gray-900/80 border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-500">
          No common lap data found for comparison.
        </div>
      );
    }

    // --- Render Chart ---
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lapData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.3)" />
          <XAxis dataKey="LapNumber" stroke="rgba(156, 163, 175, 0.7)" tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }} padding={{ left: 10, right: 10 }} />
          {/* Updated YAxis tickFormatter */}
          <YAxis stroke="rgba(156, 163, 175, 0.7)" tick={{ fill: 'rgba(156, 163, 175, 0.9)', fontSize: 12 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} tickFormatter={formatLapTime} allowDecimals={true} width={60} />
          {/* Updated Tooltip: isAnimationActive=false helps focus on single item */}
          <Tooltip
            isAnimationActive={false} // Prevent showing all lines on hover
            contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: 'rgba(100, 116, 139, 0.5)', color: '#E5E7EB', borderRadius: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '5px' }}
            itemStyle={{ padding: '2px 0' }}
            formatter={(value: number | null, name: string, props) => {
                // Only return the value for the specific item being hovered (if active)
                // Note: This might still show multiple if lines overlap perfectly.
                // A fully custom tooltip might be needed for absolute single-item display.
                return [`${formatLapTime(value)}`, name];
            }}
            labelFormatter={(label) => `Lap ${label}`}
            // cursor={{ stroke: 'rgba(156, 163, 175, 0.5)', strokeWidth: 1 }} // Optional: customize cursor line
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          {/* Dynamically render lines */}
          {driversToDisplay.map((driverCode) => {
            const color = driverColor(driverCode);
            return (
              <Line
                key={driverCode}
                type="monotone"
                dataKey={driverCode}
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 1, stroke: 'rgba(255,255,255,0.5)', fill: color }}
                name={driverCode}
                connectNulls={true}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={cn("chart-container bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
           <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
           {/* Driver Selectors (Hide if using static data) */}
           {!staticData && (
             <div className="flex flex-wrap items-center gap-2"> {/* This div is the direct child */}
               {selectedDrivers.map((driverCode, index) => (
                 <div key={index} className="flex items-center gap-1">
                   <Select
                     value={driverCode}
                     onValueChange={(value) => handleDriverChange(index, value)}
                     disabled={isLoadingDrivers || !availableDrivers}
                   >
                     <SelectTrigger className="w-full sm:w-[150px] bg-gray-800/80 border-gray-700 text-gray-200 text-xs h-8 focus:border-red-500 focus:ring-red-500">
                       <SelectValue placeholder="Select Driver" />
                     </SelectTrigger>
                     <SelectContent className="bg-gray-900 border-gray-700 text-gray-200 max-h-[200px]"> {/* Added max-height */}
                       <SelectGroup>
                         <SelectLabel className="text-xs text-gray-500">Driver {index + 1}</SelectLabel>
                         {availableDrivers?.map((drv) => (
                           <SelectItem key={drv.code} value={drv.code} className="text-xs">
                             {drv.code} ({drv.name})
                           </SelectItem>
                         ))}
                       </SelectGroup>
                     </SelectContent>
                   </Select>
                   {/* Show remove button only if more than MIN_DRIVERS */}
                   {selectedDrivers.length > MIN_DRIVERS && (
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-gray-700/50"
                       onClick={() => removeDriver(index)}
                       aria-label={`Remove Driver ${index + 1}`}
                     >
                       <XCircle className="h-4 w-4" />
                     </Button>
                   )}
                 </div>
               ))}
               {/* Add Driver Button */}
               {selectedDrivers.length < MAX_DRIVERS && (
                 <Button
                   variant="outline"
                   size="sm"
                   className="h-8 text-xs border-gray-700 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
                   onClick={addDriver}
                   disabled={isLoadingDrivers || !availableDrivers}
                 >
                   <PlusCircle className="h-4 w-4 mr-1.5" />
                   Add Driver
                 </Button>
               )}
             </div>
           )} {/* End conditional rendering for selectors */}
         </div>
       </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default RacingChart;
