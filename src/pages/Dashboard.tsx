import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { Award, Flag, Lock, Cpu, Timer, User, Gauge, ArrowRight, CreditCard, Calendar } from 'lucide-react'; // Removed BarChart2
import Navbar from '@/components/Navbar';
import F1Card from '@/components/F1Card';
// Removed TrackProgress import as it's no longer used
import { Button } from "@/components/ui/button";
import {
  fetchTeamStandings,
  fetchDriverStandings,
  fetchRaceResults,
  TeamStanding,
  DriverStanding,
  RaceResult
} from '@/lib/api'; // Import API functions and types
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSeason } from '@/contexts/SeasonContext'; // Import useSeason
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define rookies by season year
const rookiesByYear: { [year: string]: string[] } = {
  '2025': ['ANT', 'BOR', 'DOO', 'BEA', 'HAD', 'LAW'], // Antonelli, Bortoleto, Doohan, Bearman, Hadjar, Lawson
  '2024': ['BEA', 'COL'], // Bearman, Colapinto
  '2023': ['PIA', 'SAR', 'DEV'], // Piastri, Sargeant, De Vries
  '2022': ['ZHO'], // Zhou
  '2021': ['MSC', 'MAZ', 'TSU'], // Mick Schumacher, Mazepin, Tsunoda
  '2020': ['LAT'], // Latifi
  '2019': ['NOR', 'RUS', 'ALB'] // Norris, Russell, Albon
};

// Helper function to check if a driver is a rookie in a given year
const isRookie = (driverCode: string, year: number): boolean => {
  const yearStr = year.toString();
  return rookiesByYear[yearStr]?.includes(driverCode) || false;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedYear, setSelectedYear, availableYears } = useSeason(); // Use context

  // Fetch Team Standings
  const { data: teamStandings, isLoading: isLoadingTeams } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 120, // 2 hours
  });

  // Fetch Driver Standings
  const { data: driverStandings, isLoading: isLoadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 120,
  });

  // Fetch Race Results
  const { data: raceResults, isLoading: isLoadingRaces } = useQuery<RaceResult[]>({
     queryKey: ['raceResults', selectedYear],
     queryFn: () => fetchRaceResults(selectedYear),
     staleTime: 1000 * 60 * 30,
     gcTime: 1000 * 60 * 60,
  });

  // Show top 4 recent races
  const recentRaces = raceResults?.slice(-6).reverse() ?? [];

  const handleRaceClick = (race: RaceResult) => {
    const raceId = `${race.year}-${race.event.toLowerCase().replace(/\s+/g, '-')}`;
    navigate(`/race/${raceId}`);
  };

  // Helper to get team color class
  const getTeamColorClass = (teamName: string | undefined): string => {
      if (!teamName) return 'gray';
      const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (simpleName.includes('mclaren')) return 'mclaren';
      if (simpleName.includes('mercedes')) return 'mercedes';
      if (simpleName.includes('redbull')) return 'redbull';
      if (simpleName.includes('ferrari')) return 'ferrari';
      if (simpleName.includes('alpine')) return 'alpine';
      if (simpleName.includes('astonmartin')) return 'astonmartin';
      if (simpleName.includes('williams')) return 'williams';
      if (simpleName.includes('haas')) return 'haas';
      if (simpleName.includes('sauber')) return 'alfaromeo';
      if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'alphatauri';
      return 'gray';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <Navbar />

      <div className="px-4 md:px-8 py-8">

        {/* --- Header Section --- */}
        <header className="mb-8 md:mb-12"> {/* Reduced bottom margin */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="animate-slide-in-left">
              {/* Responsive title size */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-1">Dashboard</h1>
              {/* Responsive subtitle size */}
              <p className="text-sm sm:text-md md:text-lg text-gray-400">{selectedYear} Season Overview</p>
            </div>
            {/* Season Selector */}
            <div className="flex items-center gap-4 animate-slide-in-right">
               <Select
                 value={String(selectedYear)}
                 onValueChange={(value) => setSelectedYear(Number(value))}
               >
                 <SelectTrigger className="w-[160px] bg-gray-800/80 border-gray-700 text-gray-200 hover:bg-gray-700/70 hover:border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:ring-offset-0 transition-colors duration-150 py-2.5">
                   <Calendar className="w-4 h-4 mr-2 opacity-60"/>
                   <SelectValue placeholder="Select Season" />
                 </SelectTrigger>
                 <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                   <SelectGroup>
                     <SelectLabel className="text-gray-500 px-2 py-1.5">Season</SelectLabel>
                     {availableYears.map((year) => (
                       <SelectItem
                         key={year}
                         value={String(year)}
                         className="focus:bg-red-600/30 focus:text-white data-[state=checked]:bg-red-600/20"
                       >
                         {year}
                       </SelectItem>
                     ))}
                   </SelectGroup>
                 </SelectContent>
               </Select>
               {/* Removed Data Status Indicator */}
            </div>
          </div>
        </header>


        {/* --- Main Content Grid --- */}
        {/* Adjusted main grid gap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

          {/* Left Column */}
           {/* Adjusted spacing between sections */}
          <div className="lg:col-span-2 space-y-8 md:space-y-10">

            {/* Team Standings Section */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex justify-between items-center mb-4">
                 {/* Responsive section title size */}
                 <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Team Standings</h2>
                 <Button variant="link" className="text-red-400 hover:text-red-300 px-0 text-sm" onClick={() => navigate('/standings/teams')}>
                    See full standings <ArrowRight className="w-4 h-4 ml-1"/>
                  </Button>
                </div>
                {isLoadingTeams ? (

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                     {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[88px] bg-gray-800/50 rounded-lg"/>)}
                  </div>
                ) : (

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                   {teamStandings?.slice(0, 4).map((team) => (
                     // Remove the Link and replace with a simple div
                     <div key={team.shortName || team.team} className="no-underline">
                       <F1Card
                         title={team.team}
                         value={`${team.points} PTS`}
                        team={getTeamColorClass(team.team) as any}
                         icon={<Award className={`h-5 w-5 text-f1-${getTeamColorClass(team.team)}`} />}
                         points_change={team.points_change} // Pass points_change
                         className="bg-gray-900/80 border border-gray-700/80 hover:border-red-600/50 transition-colors duration-200 h-full" // Added h-full for consistent height
                       />
                     </div>
                   ))}
                  </div>
                )}
            </section>

            {/* Driver Standings Section */}
            <section className="animate-fade-in" style={{ animationDelay: '150ms' }}>
               <div className="flex justify-between items-center mb-4">
                 {/* Responsive section title size */}
                 <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Driver Standings</h2>
                  <Button variant="link" className="text-red-400 hover:text-red-300 px-0 text-sm" onClick={() => navigate('/standings/drivers')}>
                   See full standings <ArrowRight className="w-4 h-4 ml-1"/>
                 </Button>
               </div>
               {isLoadingDrivers ? (

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                     {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[88px] bg-gray-800/50 rounded-lg"/>)}
                 </div>
               ) : (

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                   {driverStandings?.slice(0, 4).map((driver) => (
                     // Remove the Link and replace with a simple div
                     <div key={driver.code} className="no-underline">
                       <F1Card
                         title={driver.name}
                         value={`${driver.points} PTS`}
                        team={getTeamColorClass(driver.team) as any}
                         icon={<Users className={`h-5 w-5 text-f1-${getTeamColorClass(driver.team)}`} />}
                         points_change={driver.points_change} // Pass points_change
                         isRookie={isRookie(driver.code, selectedYear)} // Add rookie status
                         className="bg-gray-900/80 border border-gray-700/80 hover:border-red-600/50 transition-colors duration-200 h-full" // Added h-full for consistent height
                       />
                     </div>
                   ))}
                  </div>
                )}
            </section>
          </div>

          {/* Right Column - Replaced with "Explore Analytics by Race" */}
          <aside className="lg:col-span-1 space-y-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
             {/* Responsive section title size */}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">Explore Analytics by Race</h2>
            {isLoadingRaces ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[88px] bg-gray-800/50 rounded-lg"/>)}
              </div>
            ) : recentRaces.length > 0 ? (
              <div className="space-y-4">
                {recentRaces.slice(0, 4).map((race) => (
                  <div
                    key={`${race.year}-${race.event}`}
                    onClick={() => handleRaceClick(race)}
                    className="cursor-pointer group transition-transform duration-200 ease-in-out hover:scale-[1.03]"
                  >
                    <Card 
                      className="bg-gray-900/80 border border-gray-700/80 group-hover:border-red-500/50 transition-colors duration-200"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold text-white">{race.event}</CardTitle>
                            <CardDescription className="text-gray-400 text-sm">
                              {race.date || `Round ${race.round}`}{race.location ? `, ${race.location}` : ''}
                            </CardDescription>
                          </div>
                          <div className={`p-2 bg-gray-800 rounded-lg border border-gray-700 text-f1-${getTeamColorClass(race.team)}`}>
                            <Flag className="h-5 w-5" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">Winner: {race.driver}</span>
                          <ArrowRight className="w-4 h-4 text-red-400"/>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic py-10 text-center">No race results available for {selectedYear}.</p>
            )}
          </aside>

        </div>
      </div>
    </div>
  );
};

// Replaced the FeatureCardRedesigned component since it's no longer used
const FeatureCardRedesigned = ({
  title, description, icon, linkTo
}: {
  title: string; description: string; icon: React.ReactNode; linkTo: string;
}) => {
  return (
    <Card
      className={cn(
        "bg-gray-900/70 border-gray-700/80",
        "cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-800/80 hover:border-red-500/50",
        "relative overflow-hidden" 
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
            <CardDescription className="text-gray-400 text-sm">{description}</CardDescription>
          </div>
          <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex justify-end items-center text-xs text-red-400">
          <ArrowRight className="w-3 h-3 ml-1"/>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
