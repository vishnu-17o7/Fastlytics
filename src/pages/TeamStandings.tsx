import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { ArrowLeft, Trophy, CheckCircle, MinusCircle, Award, Calendar, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react'; // Added ArrowUp/Down
import Navbar from '@/components/Navbar';
import { Button } from "@/components/ui/button";
// Import API function and type
import { fetchTeamStandings, TeamStanding } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeason } from '@/contexts/SeasonContext'; // Import useSeason

const TeamStandings = () => {
  const navigate = useNavigate();
  const { selectedYear, setSelectedYear, availableYears } = useSeason(); // Use context

  // Fetch Team Standings for the selected year
  const { data: teamStandings, isLoading, error, isError } = useQuery<TeamStanding[]>({
    queryKey: ['teamStandings', selectedYear],
    queryFn: () => fetchTeamStandings(selectedYear),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 120,
    retry: 1,
  });

  // Function to determine change indicator color and icon
  const getChangeIndicator = (change: number | undefined) => { // Accept undefined
    if (change === undefined) { // Check for undefined
       // Return null or a default state if no change data exists
       return null;
    }
    if (change > 0) {
      return { color: 'text-green-500', icon: <ArrowUp className="h-4 w-4" /> }; // Use ArrowUp
    } else if (change < 0) {
      return { color: 'text-red-500', icon: <ArrowDown className="h-4 w-4" /> }; // Use ArrowDown
    } else { // change === 0
      return { color: 'text-gray-500', icon: <MinusCircle className="h-4 w-4" /> };
    }
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
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10">
           <div className="flex items-center">
             <Button variant="ghost" size="icon" className="mr-3 text-gray-300 hover:bg-gray-800 hover:text-white" onClick={() => navigate('/dashboard')}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Constructor Standings</h1>
           </div>
           <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
             <SelectTrigger className="w-full md:w-[180px] bg-gray-800/80 border-gray-700 text-gray-200 hover:bg-gray-700/70 hover:border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:ring-offset-0 transition-colors duration-150 py-2.5">
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
        </header>

        {/* Standings List */}
        <div className="space-y-3 md:space-y-4">
          {isLoading ? (
             [...Array(10)].map((_, i) => <Skeleton key={i} className="h-[76px] bg-gray-800/50 rounded-lg"/>)
          ) : isError ? (
             <div className="text-center py-10 text-red-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                Error loading standings for {selectedYear}. <br/>
                <span className="text-xs text-gray-500">{(error as Error)?.message || 'Please try again later.'}</span>
             </div>
          ) : teamStandings && teamStandings.length > 0 ? (
            teamStandings.map((team, index) => { // Use fetched data
              const indicator = getChangeIndicator(team.points_change); // Use points_change
              const rank = team.rank || index + 1;
              const teamColor = team.teamColor || getTeamColorClass(team.team); // Use provided color or derive

              return (
                <Card
                  key={team.shortName || team.team}
                  className={cn(
                    "bg-gray-900/70 border border-gray-700/80 backdrop-blur-sm",
                    "p-4 md:p-5 flex items-center gap-4 md:gap-6",
                    "transition-all duration-300 ease-in-out hover:bg-gray-800/80 hover:border-gray-600",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <div className="text-xl md:text-2xl font-bold text-gray-500 w-8 text-center">{rank}</div>
                  <div className={cn("w-1.5 h-10 rounded-full", `bg-f1-${teamColor}`)}></div>
                  <div className="flex-grow">
                    {/* Team name (no longer linked) */}
                    <h2 className="text-lg md:text-xl font-semibold text-white">{team.team}</h2>
                  </div>
                  <div className="flex items-center gap-4 md:gap-6 text-sm text-gray-400 flex-shrink-0">
                     <div className="flex items-center gap-1.5" title="Wins">
                       <Trophy className="w-4 h-4 text-yellow-500"/>
                       <span>{team.wins ?? '-'}</span>
                     </div>
                     <div className="flex items-center gap-1.5" title="Podiums">
                       <Award className="w-4 h-4 text-gray-400"/>
                       <span>{team.podiums ?? '-'}</span>
                     </div>
                     {/* Display points change if indicator is not null */}
                     {indicator && (
                        <div className={cn("flex items-center gap-1", indicator.color)} title="Points Change Since Last Race">
                          {indicator.icon}
                          {/* Show absolute value for non-zero change */}
                          <span>{team.points_change !== 0 ? Math.abs(team.points_change ?? 0) : '-'}</span>
                        </div>
                     )}
                  </div>
                   <div className="text-lg md:text-xl font-bold text-white w-20 text-right">
                     {team.points} <span className="text-xs font-normal text-gray-500">PTS</span>
                   </div>
                </Card>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-10">No standings data available for {selectedYear}.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamStandings;
