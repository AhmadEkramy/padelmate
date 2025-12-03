import React, { useState, useEffect } from 'react';
import { Filter, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import PlayerCard from '@/components/PlayerCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface Player {
  id: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  location: string;
  distance: string;
  avatar?: string;
  gender?: string;
  genderPreference?: string;
}

const FindPlayer: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skillLevel: 'all',
    type: 'all',
    distance: [10],
    search: '',
  });

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const playersData: Player[] = [];
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const userId = doc.id;
          
          // Skip current user
          if (user && userId === user.uid) return;
          
          // Only include users with profile data (skillLevel and location)
          // Also ensure they have a name or email
          const hasName = userData.displayName || userData.email;
          const hasLocation = userData.city || userData.nearestCourt;
          const hasSkillLevel = userData.skillLevel;
          
          if (hasName && hasLocation && hasSkillLevel) {
            const name = userData.displayName || userData.email?.split('@')[0] || 'Unknown';
            const location = userData.nearestCourt || userData.city || 'Unknown location';
            
            // Validate skillLevel is one of the allowed values
            const validSkillLevels = ['beginner', 'intermediate', 'advanced'];
            if (!validSkillLevels.includes(userData.skillLevel)) return;
            
            const skillLevel = userData.skillLevel as 'beginner' | 'intermediate' | 'advanced';
            
            // Default rating if not available (between 3.5 and 5.0)
            const rating = userData.rating && userData.rating >= 0 && userData.rating <= 5 
              ? userData.rating 
              : 4.0;
            
            // Calculate or default distance (for now, using a default)
            // In a real app, you'd calculate this based on user's location coordinates
            const distance = `${Math.floor(Math.random() * 10 + 1)}.${Math.floor(Math.random() * 9)} km`;
            
            playersData.push({
              id: userId,
              name,
              skillLevel,
              rating: typeof rating === 'number' ? rating : 4.0,
              location,
              distance,
              avatar: userData.avatar,
              gender: userData.gender || '',
              genderPreference: userData.genderPreference || '',
            });
          }
        });
        
        setPlayers(playersData);
      } catch (error) {
        console.error('Error fetching players:', error);
        toast.error('Failed to load players. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [user]);

  const filteredPlayers = players.filter((player) => {
    // Skill Level filter
    if (filters.skillLevel && filters.skillLevel !== 'all' && player.skillLevel !== filters.skillLevel) return false;
    
    // Search filter
    if (filters.search && !player.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    
    // Type filter (gender)
    if (filters.type && filters.type !== 'all') {
      if (filters.type === 'male') {
        if (player.gender !== 'male') return false;
      } else if (filters.type === 'female') {
        if (player.gender !== 'female') return false;
      } else if (filters.type === 'mixed') {
        // For mixed, show players who accept mixed matches or have mixed preference
        const acceptsMixed = player.genderPreference === 'mixed' || player.genderPreference === 'any';
        if (!acceptsMixed) return false;
      }
    }
    
    // Note: Distance filtering would require coordinates
    return true;
  });

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('finder.title')}
          </h1>
          <p className="text-muted-foreground">
            Discover players near you and start playing
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters - Desktop Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <Card className="glass-card sticky top-24">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {t('finder.filters')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide' : 'Show'}
                </Button>
              </CardHeader>
              <CardContent className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div className="space-y-2">
                  <Label>{t('common.search')}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      className="pl-10"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                </div>

                {/* Skill Level */}
                <div className="space-y-2">
                  <Label>{t('profile.skillLevel')}</Label>
                  <Select
                    value={filters.skillLevel}
                    onValueChange={(value) => setFilters({ ...filters, skillLevel: value })}
                  >
                    <SelectTrigger className="glow-input">
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any level</SelectItem>
                      <SelectItem value="beginner">{t('profile.beginner')}</SelectItem>
                      <SelectItem value="intermediate">{t('profile.intermediate')}</SelectItem>
                      <SelectItem value="advanced">{t('profile.advanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Distance */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t('finder.distance')}</Label>
                    <span className="text-sm text-primary font-medium">
                      {filters.distance[0]} {t('finder.km')}
                    </span>
                  </div>
                  <Slider
                    value={filters.distance}
                    onValueChange={(value) => setFilters({ ...filters, distance: value })}
                    max={50}
                    min={1}
                    step={1}
                    className="glow-input"
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>{t('finder.type')}</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                  >
                    <SelectTrigger className="glow-input">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any type</SelectItem>
                      <SelectItem value="male">{t('profile.male')}</SelectItem>
                      <SelectItem value="female">{t('profile.female')}</SelectItem>
                      <SelectItem value="mixed">{t('profile.mixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="glow" className="w-full">
                  {t('common.apply')}
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Players Grid */}
          <main className="flex-1">
            {loading ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">{t('common.loading') || 'Loading players...'}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPlayers.map((player) => (
                    <PlayerCard
                      key={player.id}
                      playerId={player.id}
                      name={player.name}
                      skillLevel={player.skillLevel}
                      rating={player.rating}
                      location={player.location}
                      distance={player.distance}
                      avatar={player.avatar}
                    />
                  ))}
                </div>

                {filteredPlayers.length === 0 && !loading && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <p className="text-muted-foreground">
                        {players.length === 0 
                          ? 'No players found. Be the first to create a profile!'
                          : 'No players found matching your criteria'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default FindPlayer;

