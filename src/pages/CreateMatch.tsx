import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlayerCard from '@/components/PlayerCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { createMatchInvitationNotification } from '@/lib/notifications';

interface Player {
  id: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  location: string;
  distance: string;
  avatar?: string;
}

const CreateMatch: React.FC = () => {
  const { t } = useLanguage();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [nearbyPlayers, setNearbyPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    playersNeeded: '',
    skillPreference: '',
    genderPreference: '',
  });
  
  // Get invite player info from navigation state
  const invitePlayerId = location.state?.invitePlayerId;
  const invitePlayerName = location.state?.invitePlayerName;

  // Fetch nearby players from Firestore
  useEffect(() => {
    const fetchNearbyPlayers = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const playersData: Player[] = [];
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const userId = doc.id;
          
          // Skip current user
          if (userId === user.uid) return;
          
          // Only include users with profile data
          const hasName = userData.displayName || userData.email;
          const hasLocation = userData.city || userData.nearestCourt;
          const hasSkillLevel = userData.skillLevel;
          
          if (hasName && hasLocation && hasSkillLevel) {
            const name = userData.displayName || userData.email?.split('@')[0] || 'Unknown';
            const location = userData.nearestCourt || userData.city || 'Unknown location';
            
            // Validate skillLevel
            const validSkillLevels = ['beginner', 'intermediate', 'advanced'];
            if (!validSkillLevels.includes(userData.skillLevel)) return;
            
            const skillLevel = userData.skillLevel as 'beginner' | 'intermediate' | 'advanced';
            const rating = userData.rating && userData.rating >= 0 && userData.rating <= 5 
              ? userData.rating 
              : 4.0;
            
            // Calculate distance (for now, using a default)
            const distance = `${Math.floor(Math.random() * 10 + 1)}.${Math.floor(Math.random() * 9)} km`;
            
            playersData.push({
              id: userId,
              name,
              skillLevel,
              rating: typeof rating === 'number' ? rating : 4.0,
              location,
              distance,
              avatar: userData.avatar,
            });
          }
        });
        
        // Limit to 5 nearby players
        setNearbyPlayers(playersData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching nearby players:', error);
        toast.error('Failed to load nearby players');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyPlayers();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to create a match');
      navigate('/login');
      return;
    }

    if (!formData.date || !formData.time || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Combine date and time
      const matchDateTime = new Date(`${formData.date}T${formData.time}`);
      
      const matchData = {
        createdBy: user.uid,
        createdByName: userData?.displayName || user.email?.split('@')[0] || 'Unknown',
        date: formData.date,
        time: formData.time,
        dateTime: Timestamp.fromDate(matchDateTime),
        location: formData.location,
        playersNeeded: parseInt(formData.playersNeeded) || 1,
        skillPreference: formData.skillPreference || 'any',
        genderPreference: formData.genderPreference || 'any',
        status: 'open',
        participants: [], // Creator is not automatically added - they can join if they want
        createdAt: serverTimestamp(),
      };

      const matchRef = await addDoc(collection(db, 'matches'), matchData);
      
      // Auto-invite player if provided
      if (invitePlayerId) {
        try {
          const invitationsRef = collection(db, 'matchInvitations');
          const invitationData = {
            matchId: matchRef.id,
            invitedBy: user.uid,
            invitedByName: userData?.displayName || user.email?.split('@')[0] || 'Unknown',
            invitedPlayerId: invitePlayerId,
            invitedPlayerName: invitePlayerName || 'Unknown',
            status: 'pending',
            createdAt: serverTimestamp(),
          };
          const invitationRef = await addDoc(invitationsRef, invitationData);
          
          // Create notification for invited player
          await createMatchInvitationNotification(
            invitePlayerId,
            userData?.displayName || user.email?.split('@')[0] || 'Unknown',
            matchRef.id,
            invitationRef.id,
            formData.location,
            Timestamp.fromDate(matchDateTime)
          );
          
          toast.success(t('create.success') || 'Match created and invitation sent!');
        } catch (inviteError) {
          console.error('Error sending invitation:', inviteError);
          toast.success(t('create.success') || 'Match created successfully!');
          toast.error('Failed to send invitation. Please try again.');
        }
      } else {
        toast.success(t('create.success') || 'Match created successfully!');
      }
      
      // Reset form
      setFormData({
        date: '',
        time: '',
        location: '',
        playersNeeded: '',
        skillPreference: '',
        genderPreference: '',
      });
      
      // Navigate to match finder
      navigate('/match-finder');
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error('Failed to create match. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('create.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('create.subtitle')}
          </p>
          {invitePlayerName && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg inline-block">
              <p className="text-sm text-primary">
                {t('invite.creatingFor') || `Creating match and inviting ${invitePlayerName}`}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  {t('create.matchDetails')}
                </CardTitle>
              </CardHeader>
              {/* Notification Message */}
              <div className="px-6 pb-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('create.notificationMessage')}
                  </p>
                </div>
              </div>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="date" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {t('create.date')}
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                      <Label htmlFor="time" className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        {t('create.time')}
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t('create.location')}
                    </Label>
                    <Input
                      id="location"
                      placeholder={t('create.locationPlaceholder')}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Players Needed */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        {t('create.players')}
                      </Label>
                      <Select
                        value={formData.playersNeeded}
                        onValueChange={(value) => setFormData({ ...formData, playersNeeded: value })}
                      >
                        <SelectTrigger className="glow-input">
                          <SelectValue placeholder={t('create.select')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 {t('create.playersCount')}</SelectItem>
                          <SelectItem value="2">2 {t('create.playersCount')}</SelectItem>
                          <SelectItem value="3">3 {t('create.playersCount')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Skill Preference */}
                    <div className="space-y-2 md:col-span-2">
                      <Label>{t('create.skillPreference')}</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={formData.skillPreference === 'beginner' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, skillPreference: formData.skillPreference === 'beginner' ? '' : 'beginner' })}
                          className={formData.skillPreference === 'beginner' ? '' : 'bg-muted text-foreground hover:bg-muted/80 hover:text-foreground border-border'}
                        >
                          {t('profile.beginner')}
                        </Button>
                        <Button
                          type="button"
                          variant={formData.skillPreference === 'intermediate' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, skillPreference: formData.skillPreference === 'intermediate' ? '' : 'intermediate' })}
                          className={formData.skillPreference === 'intermediate' ? '' : 'bg-muted text-foreground hover:bg-muted/80 hover:text-foreground border-border'}
                        >
                          {t('profile.intermediate')}
                        </Button>
                        <Button
                          type="button"
                          variant={formData.skillPreference === 'advanced' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, skillPreference: formData.skillPreference === 'advanced' ? '' : 'advanced' })}
                          className={formData.skillPreference === 'advanced' ? '' : 'bg-muted text-foreground hover:bg-muted/80 hover:text-foreground border-border'}
                        >
                          {t('profile.advanced')}
                        </Button>
                        <Button
                          type="button"
                          variant={formData.skillPreference === 'any' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, skillPreference: formData.skillPreference === 'any' ? '' : 'any' })}
                          className={formData.skillPreference === 'any' ? '' : 'bg-muted text-foreground hover:bg-muted/80 hover:text-foreground border-border'}
                        >
                          {t('create.anyLevel')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Gender Preference */}
                  <div className="space-y-2">
                    <Label>{t('profile.gender')}</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={formData.genderPreference === 'any' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, genderPreference: formData.genderPreference === 'any' ? '' : 'any' })}
                        className={formData.genderPreference === 'any' ? '' : 'bg-muted text-foreground hover:bg-muted/80 hover:text-foreground border-border'}
                      >
                        {t('profile.any')}
                      </Button>
                      <Button
                        type="button"
                        variant={formData.genderPreference === 'male' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, genderPreference: formData.genderPreference === 'male' ? '' : 'male' })}
                        className={formData.genderPreference === 'male' ? '' : 'bg-muted text-foreground hover:bg-muted/80 hover:text-foreground border-border'}
                      >
                        {t('profile.male')}
                      </Button>
                      <Button
                        type="button"
                        variant={formData.genderPreference === 'female' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, genderPreference: formData.genderPreference === 'female' ? '' : 'female' })}
                        className={formData.genderPreference === 'female' ? '' : 'bg-muted text-foreground hover:bg-muted/80 hover:text-foreground border-border'}
                      >
                        {t('profile.female')}
                      </Button>
                      <Button
                        type="button"
                        variant={formData.genderPreference === 'mixed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, genderPreference: formData.genderPreference === 'mixed' ? '' : 'mixed' })}
                        className={formData.genderPreference === 'mixed' ? '' : 'bg-muted text-foreground hover:bg-muted/80 hover:text-foreground border-border'}
                      >
                        {t('profile.mixed')}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t('create.creating') || 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        {t('create.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Nearby Players */}
          <div>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">{t('create.nearbyPlayers')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : nearbyPlayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No nearby players found
                  </p>
                ) : (
                  nearbyPlayers.map((player) => (
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
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMatch;
