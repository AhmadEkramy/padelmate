import React, { useState, useEffect } from 'react';
import { Plus, Filter, MapPin, Calendar, Clock, Users, Star, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, serverTimestamp, Timestamp, getDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { createInvitationAcceptedNotification } from '@/lib/notifications';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Match {
  id: string;
  createdBy: string;
  createdByName: string;
  date: string;
  time: string;
  dateTime: Timestamp | Date;
  location: string;
  playersNeeded: number;
  skillPreference: string;
  status: 'open' | 'full' | 'completed';
  participants: string[];
  type?: 'singles' | 'doubles';
  gender?: 'male' | 'female' | 'mixed' | 'any';
  createdAt?: Timestamp;
}

interface Filters {
  skillLevel: string;
  location: string;
  status: string;
  gender: string;
  timeRange: string;
}

const MatchFinder: React.FC = () => {
  const { t } = useLanguage();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchRequests, setMatchRequests] = useState<string[]>([]); // Array of match IDs where user has sent a request
  const [matchInvitations, setMatchInvitations] = useState<Record<string, string>>({}); // Map of matchId -> invitationId for pending invitations
  const [filters, setFilters] = useState<Filters>({
    skillLevel: '',
    location: '',
    status: '',
    gender: '',
    timeRange: '',
  });
  const [createFormData, setCreateFormData] = useState({
    date: '',
    time: '',
    location: '',
    playersNeeded: '1',
    skillPreference: 'any',
    type: 'doubles',
    gender: 'any',
  });

  // Helper function to fetch and process matches
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, orderBy('dateTime', 'asc'));
      const matchesSnapshot = await getDocs(q);
      
      const matchesData: Match[] = [];
      matchesSnapshot.forEach((doc) => {
        const data = doc.data();
        const matchDateTime = data.dateTime?.toDate ? data.dateTime.toDate() : new Date(`${data.date}T${data.time}`);
        const now = new Date();
        
        // Determine status
        let status: 'open' | 'full' | 'completed' = 'open';
        if (matchDateTime < now) {
          status = 'completed';
        } else if (data.participants?.length >= data.playersNeeded) {
          status = 'full';
        }
        
        matchesData.push({
          id: doc.id,
          ...data,
          dateTime: matchDateTime,
          status,
        } as Match);
      });
      
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches from Firestore
  useEffect(() => {
    fetchMatches();
    fetchMatchInvitations();
  }, [user]);

  // Fetch match invitations for current user
  const fetchMatchInvitations = async () => {
    if (!user) return;

    try {
      const invitationsRef = collection(db, 'matchInvitations');
      const q = query(
        invitationsRef,
        where('invitedPlayerId', '==', user.uid),
        where('status', '==', 'pending')
      );
      const invitationsSnapshot = await getDocs(q);
      
      const invitationsMap: Record<string, string> = {};
      invitationsSnapshot.forEach((doc) => {
        const data = doc.data();
        invitationsMap[data.matchId] = doc.id;
      });
      
      setMatchInvitations(invitationsMap);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  // Handle accepting invitation
  const handleAcceptInvitation = async (matchId: string, invitationId: string) => {
    if (!user) return;

    try {
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        toast.error('Match not found');
        return;
      }
      
      const matchData = matchDoc.data();
      
      // Check if match is still open
      if (matchData.participants?.length >= matchData.playersNeeded) {
        toast.error('Match is already full');
        // Update invitation status to declined
        await updateDoc(doc(db, 'matchInvitations', invitationId), { 
          status: 'declined',
          respondedAt: serverTimestamp(),
        });
        await fetchMatchInvitations();
        return;
      }
      
      // Add user to match participants
      await updateDoc(matchRef, {
        participants: arrayUnion(user.uid),
        status: (matchData.participants?.length || 0) + 1 >= matchData.playersNeeded ? 'full' : 'open',
      });
      
      // Update invitation status to accepted
      await updateDoc(doc(db, 'matchInvitations', invitationId), { 
        status: 'accepted',
        respondedAt: serverTimestamp(),
      });
      
      // Create notification for match creator
      if (matchData.createdBy) {
        await createInvitationAcceptedNotification(
          matchData.createdBy,
          userData?.displayName || user.email?.split('@')[0] || 'Unknown',
          matchId,
          matchData.location
        );
      }
      
      toast.success('Invitation accepted!');
      await fetchMatches();
      await fetchMatchInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    }
  };

  // Handle declining invitation
  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await updateDoc(doc(db, 'matchInvitations', invitationId), { 
        status: 'declined',
        respondedAt: serverTimestamp(),
      });
      
      toast.success('Invitation declined');
      await fetchMatchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation. Please try again.');
    }
  };

  // Filter matches
  const filteredMatches = matches.filter((match) => {
    if (filters.skillLevel && filters.skillLevel !== 'all' && match.skillPreference !== filters.skillLevel && match.skillPreference !== 'any') return false;
    if (filters.location && !match.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'open' && match.status !== 'open') return false;
      if (filters.status === 'full' && match.status !== 'full') return false;
      if (filters.status === 'completed' && match.status !== 'completed') return false;
    }
    if (filters.gender && filters.gender !== 'all' && match.gender !== filters.gender && match.gender !== 'any') return false;
    return true;
  });

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to create a match');
      navigate('/login');
      return;
    }

    if (!createFormData.date || !createFormData.time || !createFormData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const matchDateTime = new Date(`${createFormData.date}T${createFormData.time}`);
      
      const matchData = {
        createdBy: user.uid,
        createdByName: userData?.displayName || user.email?.split('@')[0] || 'Unknown',
        date: createFormData.date,
        time: createFormData.time,
        dateTime: Timestamp.fromDate(matchDateTime),
        location: createFormData.location,
        playersNeeded: parseInt(createFormData.playersNeeded) || 1,
        skillPreference: createFormData.skillPreference || 'any',
        type: createFormData.type || 'doubles',
        gender: createFormData.gender || 'any',
        status: 'open',
        participants: [], // Creator is not automatically added - they can join if they want
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'matches'), matchData);
      
      toast.success(t('create.success') || 'Match created successfully!');
      setShowCreateModal(false);
      
      // Reset form
      setCreateFormData({
        date: '',
        time: '',
        location: '',
        playersNeeded: '1',
        skillPreference: 'any',
        type: 'doubles',
        gender: 'any',
      });
      
      // Refresh matches
      await fetchMatches();
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error('Failed to create match. Please try again.');
    }
  };

  const handleJoinMatch = async (matchId: string) => {
    if (!user) {
      toast.error('Please login to join a match');
      navigate('/login');
      return;
    }

    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;
      
      const isParticipant = match.participants.includes(user.uid);
      const hasRequest = matchRequests.includes(matchId);
      
      if (isParticipant) {
        // Unjoin the match (only if user is already a participant)
        const matchRef = doc(db, 'matches', matchId);
        const updatedParticipants = match.participants.filter((pid: string) => pid !== user.uid);
        await updateDoc(matchRef, {
          participants: updatedParticipants,
          status: 'open',
        });
        
        toast.success(t('matchFinder.leaveMatch') || 'Successfully left the match!');
        await fetchMatches();
      } else if (hasRequest) {
        // Cancel the request
        const requestsRef = collection(db, 'matchRequests');
        const q = query(
          requestsRef, 
          where('matchId', '==', matchId),
          where('requestedBy', '==', user.uid),
          where('status', '==', 'pending')
        );
        const requestsSnapshot = await getDocs(q);
        
        const deletePromises = requestsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        setMatchRequests(matchRequests.filter(id => id !== matchId));
        toast.success(t('profile.requestCancelled') || 'Request cancelled');
      } else {
        // Send request to join
        if (match.participants.length >= match.playersNeeded) {
          toast.error('Match is full');
          return;
        }
        
        // Check if request already exists
        try {
          const requestsRef = collection(db, 'matchRequests');
          const existingRequestQuery = query(
            requestsRef,
            where('matchId', '==', matchId),
            where('requestedBy', '==', user.uid),
            where('status', '==', 'pending')
          );
          const existingRequests = await getDocs(existingRequestQuery);
          
          if (!existingRequests.empty) {
            toast.error('You already have a pending request for this match');
            return;
          }
        } catch (queryError: any) {
          // If query fails due to permissions, log but continue (might be first request)
          console.warn('Could not check existing requests:', queryError);
          // Continue to create request anyway
        }
        
        // Create request
        const requestData = {
          matchId: matchId,
          requestedBy: user.uid,
          requestedByName: userData?.displayName || user.email?.split('@')[0] || 'Unknown',
          matchCreator: match.createdBy,
          status: 'pending',
          createdAt: serverTimestamp(),
        };
        
        await addDoc(collection(db, 'matchRequests'), requestData);
        
        setMatchRequests([...matchRequests, matchId]);
        toast.success(t('matchFinder.requestSent') || 'Request sent successfully!');
      }
    } catch (error) {
      console.error('Error handling match request:', error);
      toast.error('Failed to process request. Please try again.');
    }
  };

  const clearFilters = () => {
    setFilters({
      skillLevel: '',
      location: '',
      status: '',
      gender: '',
      timeRange: '',
    });
  };

  const isMatchPast = (match: Match) => {
    const matchDateTime = match.dateTime instanceof Date ? match.dateTime : match.dateTime.toDate();
    return matchDateTime < new Date();
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('matchFinder.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('matchFinder.subtitle')}
          </p>
        </div>

        {/* Filters Section */}
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{t('matchFinder.filters')}</h3>
            </div>
            <div className="flex flex-wrap gap-4 overflow-x-auto pb-2">
              {/* Skill Level */}
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm mb-2 block">{t('matchFinder.skillLevel')}</Label>
                <Select
                  value={filters.skillLevel}
                  onValueChange={(value) => setFilters({ ...filters, skillLevel: value })}
                >
                  <SelectTrigger className="glow-input">
                    <SelectValue placeholder={t('profile.any')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('profile.any')}</SelectItem>
                    <SelectItem value="beginner">{t('profile.beginner')}</SelectItem>
                    <SelectItem value="intermediate">{t('profile.intermediate')}</SelectItem>
                    <SelectItem value="advanced">{t('profile.advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm mb-2 block">{t('matchFinder.location')}</Label>
                <Input
                  placeholder={t('create.locationPlaceholder')}
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="glow-input"
                />
              </div>

              {/* Status */}
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm mb-2 block">{t('matchFinder.status') || 'Status'}</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="glow-input">
                    <SelectValue placeholder={t('profile.any')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('profile.any')}</SelectItem>
                    <SelectItem value="open">{t('matchFinder.openMatch') || 'Open Match'}</SelectItem>
                    <SelectItem value="full">{t('matchFinder.fullMatch') || 'Full Match'}</SelectItem>
                    <SelectItem value="completed">{t('matchFinder.matchCompleted')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div className="flex-1 min-w-[150px]">
                <Label className="text-sm mb-2 block">{t('profile.gender')}</Label>
                <Select
                  value={filters.gender}
                  onValueChange={(value) => setFilters({ ...filters, gender: value })}
                >
                  <SelectTrigger className="glow-input">
                    <SelectValue placeholder={t('profile.any')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('profile.any')}</SelectItem>
                    <SelectItem value="male">{t('profile.male')}</SelectItem>
                    <SelectItem value="female">{t('profile.female')}</SelectItem>
                    <SelectItem value="mixed">{t('profile.mixed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="glow-primary"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('matchFinder.clearFilters')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches List */}
        {loading ? (
          <Card className="text-center py-12">
            <CardContent>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </CardContent>
          </Card>
        ) : filteredMatches.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">{t('matchFinder.noMatches')}</p>
              <p className="text-sm text-muted-foreground">{t('matchFinder.noMatchesDesc')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match) => {
              const matchDateTime = match.dateTime instanceof Date ? match.dateTime : match.dateTime.toDate();
              const isPast = isMatchPast(match);
              const isParticipant = user && match.participants.includes(user.uid);
              const isFull = match.participants.length >= match.playersNeeded;
              const hasInvitation = user && matchInvitations[match.id] !== undefined;
              
              return (
                <Card
                  key={match.id}
                  className={cn(
                    "glass-card glow-card cursor-pointer transition-all duration-300",
                    isPast && "opacity-75"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{match.createdByName}</h3>
                          {isPast && (
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {t('matchFinder.matchCompleted')}
                            </span>
                          )}
                          {!isPast && isFull && (
                            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                              {t('matchFinder.matchFull')}
                            </span>
                          )}
                          {!isPast && !isFull && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              {t('matchFinder.matchOpen')}
                            </span>
                          )}
                          {hasInvitation && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                              {t('matchFinder.invitationReceived') || 'Invitation Received'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{t('matchFinder.creator')}</p>
                      </div>

                      {/* Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{match.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{match.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{match.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-primary" />
                          <span>
                            {match.participants.length} / {match.playersNeeded} {t('matchFinder.playersNeeded')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-primary" />
                          <span>{t(`profile.${match.skillPreference}`) || match.skillPreference}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2">
                        {isPast && isParticipant && (
                          <Button
                            variant="hero"
                            className="w-full glow-primary"
                            onClick={() => {
                              setSelectedMatch(match);
                              setShowRatingModal(true);
                            }}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            {t('matchFinder.ratePlayers')}
                          </Button>
                        )}
                        {!isPast && hasInvitation && !isParticipant && (
                          <div className="flex gap-2">
                            <Button
                              variant="hero"
                              className="flex-1 glow-primary"
                              onClick={() => handleAcceptInvitation(match.id, matchInvitations[match.id])}
                            >
                              {t('matchFinder.accept') || 'Accept'}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleDeclineInvitation(matchInvitations[match.id])}
                            >
                              {t('matchFinder.decline') || 'Decline'}
                            </Button>
                          </div>
                        )}
                        {!isPast && !isParticipant && !isFull && !matchRequests.includes(match.id) && !hasInvitation && (
                          <Button
                            variant="hero"
                            className="w-full glow-primary"
                            onClick={() => handleJoinMatch(match.id)}
                          >
                            {t('matchFinder.requestToJoin')}
                          </Button>
                        )}
                        {!isPast && !isParticipant && !isFull && matchRequests.includes(match.id) && !hasInvitation && (
                          <Button
                            variant="outline"
                            className="w-full glow-primary"
                            onClick={() => handleJoinMatch(match.id)}
                          >
                            {t('matchFinder.cancelRequest')}
                          </Button>
                        )}
                        {!isPast && isParticipant && (
                          <Button
                            variant="outline"
                            className="w-full glow-primary"
                            onClick={() => handleJoinMatch(match.id)}
                          >
                            {t('matchFinder.leaveMatch')}
                          </Button>
                        )}
                        {!isPast && !isParticipant && isFull && !hasInvitation && (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            {t('matchFinder.matchFull')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Match Floating Button */}
        <Button
          variant="hero"
          size="lg"
          className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-lg glow-primary z-40"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>

        {/* Create Match Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('create.title')}</DialogTitle>
              <DialogDescription>{t('create.subtitle')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {t('create.date')}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={createFormData.date}
                    onChange={(e) => setCreateFormData({ ...createFormData, date: e.target.value })}
                    className="glow-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {t('create.time')}
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={createFormData.time}
                    onChange={(e) => setCreateFormData({ ...createFormData, time: e.target.value })}
                    className="glow-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {t('create.location')}
                </Label>
                <Input
                  id="location"
                  placeholder={t('create.locationPlaceholder')}
                  value={createFormData.location}
                  onChange={(e) => setCreateFormData({ ...createFormData, location: e.target.value })}
                  className="glow-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {t('create.players')}
                  </Label>
                  <Select
                    value={createFormData.playersNeeded}
                    onValueChange={(value) => setCreateFormData({ ...createFormData, playersNeeded: value })}
                  >
                    <SelectTrigger className="glow-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 {t('create.playersCount')}</SelectItem>
                      <SelectItem value="2">2 {t('create.playersCount')}</SelectItem>
                      <SelectItem value="3">3 {t('create.playersCount')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('matchFinder.type')}</Label>
                  <Select
                    value={createFormData.type}
                    onValueChange={(value) => setCreateFormData({ ...createFormData, type: value })}
                  >
                    <SelectTrigger className="glow-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singles">{t('matchFinder.singles')}</SelectItem>
                      <SelectItem value="doubles">{t('matchFinder.doubles')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('create.skillPreference')}</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={createFormData.skillPreference === 'beginner' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreateFormData({ ...createFormData, skillPreference: 'beginner' })}
                    className={createFormData.skillPreference === 'beginner' ? '' : 'bg-muted text-foreground hover:bg-muted/80'}
                  >
                    {t('profile.beginner')}
                  </Button>
                  <Button
                    type="button"
                    variant={createFormData.skillPreference === 'intermediate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreateFormData({ ...createFormData, skillPreference: 'intermediate' })}
                    className={createFormData.skillPreference === 'intermediate' ? '' : 'bg-muted text-foreground hover:bg-muted/80'}
                  >
                    {t('profile.intermediate')}
                  </Button>
                  <Button
                    type="button"
                    variant={createFormData.skillPreference === 'advanced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreateFormData({ ...createFormData, skillPreference: 'advanced' })}
                    className={createFormData.skillPreference === 'advanced' ? '' : 'bg-muted text-foreground hover:bg-muted/80'}
                  >
                    {t('profile.advanced')}
                  </Button>
                  <Button
                    type="button"
                    variant={createFormData.skillPreference === 'any' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCreateFormData({ ...createFormData, skillPreference: 'any' })}
                    className={createFormData.skillPreference === 'any' ? '' : 'bg-muted text-foreground hover:bg-muted/80'}
                  >
                    {t('create.anyLevel')}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('profile.gender')}</Label>
                <Select
                  value={createFormData.gender}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, gender: value })}
                >
                  <SelectTrigger className="glow-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t('profile.any')}</SelectItem>
                    <SelectItem value="male">{t('profile.male')}</SelectItem>
                    <SelectItem value="female">{t('profile.female')}</SelectItem>
                    <SelectItem value="mixed">{t('profile.mixed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="hero" className="glow-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('create.submit')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Rating Modal */}
        <RatingModal
          open={showRatingModal}
          onOpenChange={setShowRatingModal}
          match={selectedMatch}
        />
      </div>
    </div>
  );
};

// Rating Modal Component
interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
}

const RatingModal: React.FC<RatingModalProps> = ({ open, onOpenChange, match }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [ratings, setRatings] = useState({
    punctuality: 0,
    skills: 0,
    behavior: 0,
    teamwork: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPlayerNames = async () => {
      if (!match || !match.participants) {
        setPlayerNames({});
        return;
      }

      const namesMap: Record<string, string> = {};
      const fetchPromises = match.participants.map(async (playerId: string) => {
        try {
          const playerDoc = await getDoc(doc(db, 'users', playerId));
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            namesMap[playerId] = playerData.displayName || playerData.name || `Player ${playerId.slice(0, 8)}`;
          } else {
            namesMap[playerId] = `Player ${playerId.slice(0, 8)}`;
          }
        } catch (error) {
          console.error(`Error fetching player ${playerId}:`, error);
          namesMap[playerId] = `Player ${playerId.slice(0, 8)}`;
        }
      });

      await Promise.all(fetchPromises);
      setPlayerNames(namesMap);
    };

    if (match && match.participants && match.participants.length > 0) {
      // Set first other player as default
      const otherPlayer = match.participants.find((p: string) => p !== user?.uid);
      if (otherPlayer) {
        setSelectedPlayer(otherPlayer);
      } else {
        setSelectedPlayer('');
      }
      loadPlayerNames();
    } else {
      setSelectedPlayer('');
      setPlayerNames({});
    }
    // Reset ratings when modal opens/closes or match changes
    setRatings({
      punctuality: 0,
      skills: 0,
      behavior: 0,
      teamwork: 0,
    });
  }, [match, user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Rating submit clicked', { selectedPlayer, match: match?.id, user: user?.uid, ratings });
    
    if (!selectedPlayer) {
      toast.error('Please select a player to rate');
      return;
    }
    
    if (!match) {
      toast.error('Match information is missing');
      return;
    }
    
    if (!user) {
      toast.error('Please login to submit a rating');
      return;
    }
    
    if (ratings.punctuality === 0 || ratings.skills === 0 || ratings.behavior === 0 || ratings.teamwork === 0) {
      toast.error('Please rate all categories (Punctuality, Skills, Behavior, and Teamwork)');
      return;
    }

    setSubmitting(true);

    try {
      // Calculate average rating
      const averageRating = (ratings.punctuality + ratings.skills + ratings.behavior + ratings.teamwork) / 4;
      
      // Store the rating in a ratings collection
      const ratingData = {
        ratedBy: user.uid,
        ratedPlayer: selectedPlayer,
        matchId: match.id,
        punctuality: ratings.punctuality,
        skills: ratings.skills,
        behavior: ratings.behavior,
        teamwork: ratings.teamwork,
        averageRating: averageRating,
        createdAt: serverTimestamp(),
      };
      
      console.log('Adding rating to Firestore:', ratingData);
      await addDoc(collection(db, 'ratings'), ratingData);
      
      // Update the rated player's overall rating
      const playerDocRef = doc(db, 'users', selectedPlayer);
      const playerDoc = await getDoc(playerDocRef);
      
      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        const existingRating = playerData.rating || 0;
        const ratingCount = playerData.ratingCount || 0;
        
        // Calculate new average: (oldAverage * count + newRating) / (count + 1)
        const newRating = ratingCount === 0 
          ? averageRating 
          : (existingRating * ratingCount + averageRating) / (ratingCount + 1);
        
        console.log('Updating player rating:', { existingRating, ratingCount, newRating });
        await updateDoc(playerDocRef, {
          rating: newRating,
          ratingCount: ratingCount + 1,
        });
      } else {
        console.warn('Player document not found:', selectedPlayer);
      }
      
      toast.success(t('rating.success'));
      onOpenChange(false);
      
      // Reset form
      setRatings({
        punctuality: 0,
        skills: 0,
        behavior: 0,
        teamwork: 0,
      });
      setSelectedPlayer('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!match) return null;

  const otherPlayers = match.participants.filter(p => p !== user?.uid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('rating.title')}</DialogTitle>
          <DialogDescription>
            {t('rating.selectPlayer')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {otherPlayers.length > 0 && (
            <div className="space-y-2">
              <Label>{t('rating.selectPlayer')}</Label>
              <Select 
                value={selectedPlayer} 
                onValueChange={(value) => {
                  setSelectedPlayer(value);
                }}
                required
              >
                <SelectTrigger className="glow-input">
                  <SelectValue placeholder={t('rating.selectPlayer')} />
                </SelectTrigger>
                <SelectContent>
                  {otherPlayers.map((playerId: string) => (
                    <SelectItem key={playerId} value={playerId}>
                      {playerNames[playerId] || `Player ${playerId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedPlayer && (
                <p className="text-sm text-muted-foreground">Please select a player to rate</p>
              )}
            </div>
          )}
          
          {otherPlayers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No other players in this match to rate</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('rating.punctuality')}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={ratings.punctuality >= rating ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setRatings({ ...ratings, punctuality: rating })}
                    className="glow-primary"
                  >
                    <Star className={cn("w-5 h-5", ratings.punctuality >= rating && "fill-current")} />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('rating.skills') || 'Skills'}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={ratings.skills >= rating ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setRatings({ ...ratings, skills: rating })}
                    className="glow-primary"
                  >
                    <Star className={cn("w-5 h-5", ratings.skills >= rating && "fill-current")} />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('rating.behavior') || 'Behavior'}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={ratings.behavior >= rating ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setRatings({ ...ratings, behavior: rating })}
                    className="glow-primary"
                  >
                    <Star className={cn("w-5 h-5", ratings.behavior >= rating && "fill-current")} />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('rating.teamwork') || 'Teamwork'}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant={ratings.teamwork >= rating ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setRatings({ ...ratings, teamwork: rating })}
                    className="glow-primary"
                  >
                    <Star className={cn("w-5 h-5", ratings.teamwork >= rating && "fill-current")} />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            {/* Helper message showing what's missing */}
            {(ratings.punctuality === 0 || ratings.skills === 0 || ratings.behavior === 0 || ratings.teamwork === 0 || !selectedPlayer) && (
              <div className="text-xs text-muted-foreground w-full text-center">
                {!selectedPlayer && <span>Please select a player. </span>}
                {ratings.punctuality === 0 && <span>Rate Punctuality. </span>}
                {ratings.skills === 0 && <span>Rate Skills. </span>}
                {ratings.behavior === 0 && <span>Rate Behavior. </span>}
                {ratings.teamwork === 0 && <span>Rate Teamwork.</span>}
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                variant="hero" 
                className="glow-primary flex-1" 
                disabled={
                  submitting || 
                  !selectedPlayer || 
                  !match ||
                  ratings.punctuality === 0 || 
                  ratings.skills === 0 || 
                  ratings.behavior === 0 ||
                  ratings.teamwork === 0
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('rating.submitting')}
                  </>
                ) : (
                  t('rating.submit')
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MatchFinder;

