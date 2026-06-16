import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, DollarSign, Languages, Search, Filter, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { mockLawyers } from "@/data/mockLawyers";

interface Lawyer {
  id: string;
  name: string;
  firm: string;
  practiceAreas: string[];
  states: string[];
  languages: string[];
  hourlyRate: number;
  imageUrl: string;
  rating: number;
  description: string;
}

export function Directory() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const sourceWorkflow = searchParams.get('source');

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [maxRate, setMaxRate] = useState<number>(1000);

  const { data: lawyers = [], isLoading, error } = useQuery<Lawyer[]>({
    queryKey: ["lawyers"],
    queryFn: async () => {
      const response = await fetch("/api/lawyers");
      if (!response.ok) {
        throw new Error("Failed to fetch lawyers");
      }
      return response.json();
    }
  });

  const availableLawyers = error ? mockLawyers : lawyers;

  const filteredLawyers = useMemo(() => {
    return availableLawyers.filter(lawyer => {
      const matchesSearch = lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            lawyer.firm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lawyer.practiceAreas.some(pa => pa.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesState = selectedState === "all" || lawyer.states.includes(selectedState);
      const matchesRate = lawyer.hourlyRate <= maxRate;

      return matchesSearch && matchesState && matchesRate;
    });
  }, [availableLawyers, searchTerm, selectedState, maxRate]);

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-64px)] flex flex-col">
      {sourceWorkflow && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-8 flex items-center animate-in fade-in slide-in-from-top-4">
           <span className="text-sm font-medium">
             Lexy has organized your intake. GoodLegal can now help you compare relevant legal experts.
           </span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 h-full">
        {/* Filters Panel (Left) */}
        <div className="w-full lg:w-80 space-y-6">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search by name, firm, or area..." 
               className="pl-9"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           <div className="space-y-4 border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 font-semibold">
                <Filter className="h-4 w-4" /> Filters
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="DE">Delaware</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium flex justify-between">
                  <span>Max Hourly Rate</span>
                  <span className="text-muted-foreground">${maxRate}/hr</span>
                </label>
                <Slider 
                  value={[maxRate]} 
                  max={1000} 
                  step={50} 
                  onValueChange={(vals) => setMaxRate(vals[0])} 
                />
              </div>
           </div>
        </div>

        {/* Results List (Center/Right) */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold">
               {isLoading ? "Loading..." : `${filteredLawyers.length} Attorneys Found`}
             </h2>
             <div className="text-sm text-muted-foreground">Sorted by Relevance</div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Live lawyer data is unavailable in this environment, so GoodLegal is showing sample attorneys.
            </div>
          )}

          {!isLoading && filteredLawyers.map(lawyer => (
            <Card key={lawyer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img 
                    src={lawyer.imageUrl} 
                    alt={lawyer.name} 
                    className="w-24 h-24 rounded-full object-cover border border-border"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{lawyer.name}</h3>
                        <div className="text-muted-foreground font-medium">{lawyer.firm}</div>
                      </div>
                      <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{lawyer.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">{lawyer.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {lawyer.practiceAreas.map(area => (
                        <Badge key={area} variant="secondary" className="font-normal text-xs">{area}</Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
                       <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> {lawyer.states.join(", ")}
                       </div>
                       <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4" /> {lawyer.languages.join(", ")}
                       </div>
                       <div className="flex items-center gap-2 font-medium text-foreground">
                          <DollarSign className="h-4 w-4" /> ${lawyer.hourlyRate}/hr
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6 justify-end">
                   <Button variant="outline">View Profile</Button>
                   <Button>Request Consult</Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {!isLoading && filteredLawyers.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No lawyers match your criteria. Try adjusting your filters.</p>
             </div>
          )}
        </div>

        {/* Map Placeholder (Desktop Only) */}
        <div className="hidden xl:block w-80 bg-secondary/30 rounded-lg border border-border p-4 flex flex-col items-center justify-center text-muted-foreground">
           <MapPin className="h-12 w-12 mb-4 opacity-20" />
           <p>Map View Unavailable</p>
        </div>
      </div>
    </div>
  );
}
