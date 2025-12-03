import React, { useState, useEffect } from 'react';
import { Save, User, Loader2, Calendar, Clock, MapPin, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, serverTimestamp, Timestamp, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Notifications from '@/components/Notifications';
import { createRatingRequestNotification } from '@/lib/notifications';

const Profile: React.FC = () => {
  const { t } = useLanguage();
  const { user, userData, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    skillLevel: '',
    city: '',
    availableTimes: '',
    gender: '',
    genderPreference: '',
    whatsapp: '',
  });
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchRequests, setMatchRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [ratings, setRatings] = useState({
    punctuality: 0,
    skills: 0,
    behavior: 0,
    teamwork: 0,
  });
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});

  // Load user profile data from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return; // Wait for auth to finish loading
      
      if (!user) {
        // Redirect to login if not authenticated
        toast.error('Please login to view your profile');
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData({
            name: data.displayName || '',
            skillLevel: data.skillLevel || '',
            city: data.city || '',
            availableTimes: data.availableTimes || '',
            gender: data.gender || '',
            genderPreference: data.genderPreference || '',
            whatsapp: data.whatsapp || '',
          });
        } else {
          // If document doesn't exist, initialize with userData from auth
          if (userData) {
            setFormData({
              name: userData.displayName || '',
              skillLevel: '',
              city: '',
              availableTimes: '',
              gender: '',
              genderPreference: '',
              whatsapp: '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, userData, authLoading, navigate]);

  // Load user matches
  useEffect(() => {
    const loadMatches = async () => {
      if (!user) return;

      try {
        setMatchesLoading(true);
        const matchesRef = collection(db, 'matches');
        
        // Fetch matches where user is creator OR participant
        // Since Firestore doesn't support OR queries easily, we'll fetch all and filter
        let matchesSnapshot;
        try {
          // Try to fetch with orderBy first
          const q = query(matchesRef, orderBy('dateTime', 'desc'));
          matchesSnapshot = await getDocs(q);
        } catch (error: any) {
          // If orderBy fails, fetch without ordering
          console.warn('Could not order matches, fetching without order:', error);
          matchesSnapshot = await getDocs(matchesRef);
        }
        
        const matchesData: any[] = [];
        const allPlayerIds = new Set<string>();
        
        matchesSnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Include matches where user is creator OR participant
          const isCreator = data.createdBy === user.uid;
          const isParticipant = data.participants?.includes(user.uid) || false;
          
          if (!isCreator && !isParticipant) return;
          
          // Collect all player IDs to fetch their names
          if (data.participants && Array.isArray(data.participants)) {
            data.participants.forEach((pid: string) => allPlayerIds.add(pid));
          }
          if (data.createdBy) {
            allPlayerIds.add(data.createdBy);
          }
          
          const matchDateTime = data.dateTime?.toDate ? data.dateTime.toDate() : new Date(`${data.date}T${data.time}`);
          matchesData.push({
            id: doc.id,
            ...data,
            dateTime: matchDateTime,
          });
        });
        
        // Sort by dateTime descending
        matchesData.sort((a, b) => {
          const aDate = a.dateTime instanceof Date ? a.dateTime.getTime() : (a.dateTime?.toDate ? a.dateTime.toDate().getTime() : 0);
          const bDate = b.dateTime instanceof Date ? b.dateTime.getTime() : (b.dateTime?.toDate ? b.dateTime.toDate().getTime() : 0);
          return bDate - aDate;
        });
        
        setMatches(matchesData);
        
        // Fetch player names
        const namesMap: Record<string, string> = {};
        const fetchPromises = Array.from(allPlayerIds).map(async (playerId) => {
          try {
            const playerDoc = await getDoc(doc(db, 'users', playerId));
            if (playerDoc.exists()) {
              const playerData = playerDoc.data();
              namesMap[playerId] = playerData.displayName || playerData.name || playerId.slice(0, 8);
            } else {
              namesMap[playerId] = playerId.slice(0, 8);
            }
          } catch (error) {
            console.error(`Error fetching player ${playerId}:`, error);
            namesMap[playerId] = playerId.slice(0, 8);
          }
        });
        
        await Promise.all(fetchPromises);
        setPlayerNames(namesMap);
      } catch (error) {
        console.error('Error loading matches:', error);
      } finally {
        setMatchesLoading(false);
      }
    };

    loadMatches();
  }, [user]);

  // Load incoming match requests for matches created by user
  useEffect(() => {
    const loadMatchRequests = async () => {
      if (!user) return;

      try {
        setRequestsLoading(true);
        const requestsRef = collection(db, 'matchRequests');
        let requestsSnapshot;
        try {
          const q = query(
            requestsRef,
            where('matchCreator', '==', user.uid),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
          );
          requestsSnapshot = await getDocs(q);
        } catch (error: any) {
          // If index doesn't exist, fetch all and filter
          console.warn('Index not found, fetching all requests:', error);
          requestsSnapshot = await getDocs(requestsRef);
        }
        
        const requestsData: any[] = [];
        for (const docSnapshot of requestsSnapshot.docs) {
          const data = docSnapshot.data();
          if (data.matchCreator === user.uid && data.status === 'pending') {
            // Fetch match details
            try {
              const matchDoc = await getDoc(doc(db, 'matches', data.matchId));
              if (matchDoc.exists()) {
                const matchData = matchDoc.data();
                requestsData.push({
                  id: docSnapshot.id,
                  ...data,
                  matchDetails: {
                    location: matchData.location,
                    date: matchData.date,
                    time: matchData.time,
                    playersNeeded: matchData.playersNeeded,
                    participants: matchData.participants?.length || 0,
                  },
                });
              } else {
                requestsData.push({
                  id: docSnapshot.id,
                  ...data,
                });
              }
            } catch (err) {
              console.error('Error fetching match details:', err);
              requestsData.push({
                id: docSnapshot.id,
                ...data,
              });
            }
          }
        }
        
        // Sort by createdAt if available
        requestsData.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bDate - aDate;
        });
        
        setMatchRequests(requestsData);
      } catch (error) {
        console.error('Error loading match requests:', error);
      } finally {
        setRequestsLoading(false);
      }
    };

    loadMatchRequests();
  }, [user]);

  const handleAcceptRequest = async (requestId: string, matchId: string, requestedBy: string) => {
    try {
      // Get match data
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
        // Update request status to rejected
        await updateDoc(doc(db, 'matchRequests', requestId), { status: 'rejected' });
        setMatchRequests(matchRequests.filter(r => r.id !== requestId));
        return;
      }
      
      // Add user to match participants
      await updateDoc(matchRef, {
        participants: [...(matchData.participants || []), requestedBy],
        status: (matchData.participants?.length || 0) + 1 >= matchData.playersNeeded ? 'full' : 'open',
      });
      
      // Update request status to accepted
      await updateDoc(doc(db, 'matchRequests', requestId), { 
        status: 'accepted',
        respondedAt: serverTimestamp(),
      });
      
      // Remove from pending requests
      setMatchRequests(matchRequests.filter(r => r.id !== requestId));
      
      toast.success(t('profile.requestAccepted') || 'Request accepted!');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'matchRequests', requestId), { 
        status: 'rejected',
        respondedAt: serverTimestamp(),
      });
      
      setMatchRequests(matchRequests.filter(r => r.id !== requestId));
      toast.success(t('profile.requestRejected') || 'Request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request. Please try again.');
    }
  };

  const isMatchPast = (match: any) => {
    const matchDateTime = match.dateTime instanceof Date ? match.dateTime : match.dateTime.toDate();
    return matchDateTime < new Date();
  };

  const upcomingMatches = matches.filter(m => !isMatchPast(m));
  const pastMatches = matches.filter(m => isMatchPast(m));

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedPlayer) {
      toast.error('Please select a player to rate');
      return;
    }
    
    if (!selectedMatch) {
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

    try {
      // Calculate average rating
      const averageRating = (ratings.punctuality + ratings.skills + ratings.behavior + ratings.teamwork) / 4;
      
      // Store the rating in a ratings collection
      const ratingData = {
        ratedBy: user.uid,
        ratedPlayer: selectedPlayer,
        matchId: selectedMatch.id,
        punctuality: ratings.punctuality,
        skills: ratings.skills,
        behavior: ratings.behavior,
        teamwork: ratings.teamwork,
        averageRating: averageRating,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'ratings'), ratingData);
      
      // Check if all players have been rated (optional - could create a notification when match ends)
      // For now, we'll just update the rating
      
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
        
        await updateDoc(playerDocRef, {
          rating: newRating,
          ratingCount: ratingCount + 1,
        });
      }
      
      toast.success(t('rating.success'));
      setShowRatingModal(false);
      setRatings({ punctuality: 0, skills: 0, behavior: 0, teamwork: 0 });
      setSelectedPlayer('');
      setSelectedMatch(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to save your profile');
      navigate('/login');
      return;
    }

    setSaving(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      const profileData = {
        displayName: formData.name,
        skillLevel: formData.skillLevel,
        city: formData.city,
        availableTimes: formData.availableTimes,
        gender: formData.gender,
        genderPreference: formData.genderPreference,
        whatsapp: formData.whatsapp,
        updatedAt: serverTimestamp(),
      };

      if (userDoc.exists()) {
        // Update existing document
        await setDoc(userDocRef, profileData, { merge: true });
      } else {
        // Create new document with all user data
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || '',
          role: 'user',
          createdAt: serverTimestamp(),
          ...profileData,
        });
      }

      toast.success(t('profile.saveSuccess') || 'Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('common.loading') || 'Loading profile...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center animate-pulse-glow">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('profile.title')}
          </h1>
          <p className="text-muted-foreground">
            Complete your profile to find the perfect match
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Notifications, Match Requests and Matches */}
          <div className="lg:col-span-2 space-y-8">
            {/* Notifications Section */}
            <Notifications 
              onRatePlayers={(matchId) => {
                const match = pastMatches.find(m => m.id === matchId);
                if (match) {
                  setSelectedMatch(match);
                  setShowRatingModal(true);
                }
              }}
            />

            {/* Match Requests Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4">{t('profile.incomingRequests')}</h2>
              {requestsLoading ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  </CardContent>
                </Card>
              ) : matchRequests.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">{t('profile.noRequests')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchRequests.map((request) => (
                    <Card key={request.id} className="glass-card glow-card">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{request.requestedByName || 'Unknown'}</h3>
                            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                              {t('profile.requestFrom')}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">Wants to join your match</p>
                            {request.matchDetails && (
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-primary" />
                                  <span>{request.matchDetails.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3 text-primary" />
                                  <span>{request.matchDetails.date} {request.matchDetails.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-3 h-3 text-primary" />
                                  <span>
                                    {request.matchDetails.participants} / {request.matchDetails.playersNeeded} {t('matchFinder.playersNeeded')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="hero"
                              size="sm"
                              className="flex-1 glow-primary"
                              onClick={() => handleAcceptRequest(request.id, request.matchId, request.requestedBy)}
                            >
                              {t('profile.accept')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              {t('profile.reject')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Matches Section */}
            <div className="space-y-6">
              {/* Upcoming Matches */}
              <div>
                <h2 className="text-2xl font-bold mb-4">{t('profile.upcomingMatches')}</h2>
                {matchesLoading ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                    </CardContent>
                  </Card>
                ) : upcomingMatches.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">{t('profile.noUpcomingMatches')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingMatches.map((match) => (
                      <Card key={match.id} className="glass-card glow-card">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{match.location}</h3>
                              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                {t('matchFinder.matchUpcoming')}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{match.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>{match.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span>
                                  {match.participants?.length || 0} / {match.playersNeeded} {t('matchFinder.playersNeeded')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Matches */}
              <div>
                <h2 className="text-2xl font-bold mb-4">{t('profile.pastMatches')}</h2>
                {matchesLoading ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                    </CardContent>
                  </Card>
                ) : pastMatches.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-muted-foreground">{t('profile.noPastMatches')}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pastMatches.map((match) => (
                      <Card key={match.id} className="glass-card glow-card">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{match.location}</h3>
                              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                {t('matchFinder.matchCompleted')}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{match.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>{match.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span>
                                  {match.participants?.length || 0} / {match.playersNeeded} {t('matchFinder.playersNeeded')}
                                </span>
                              </div>
                            </div>
                            {match.participants && match.participants.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedMatch(match);
                                  setShowRatingModal(true);
                                }}
                              >
                                {t('matchFinder.ratePlayers')}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Personal Information */}
          <div className="lg:col-span-1">
            <Card className="glass-card sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('profile.name')}</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Skill Level */}
              <div className="space-y-2">
                <Label>{t('profile.skillLevel')}</Label>
                <Select
                  value={formData.skillLevel}
                  onValueChange={(value) => setFormData({ ...formData, skillLevel: value })}
                >
                  <SelectTrigger className="glow-input">
                    <SelectValue placeholder="Select skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t('profile.beginner')}</SelectItem>
                    <SelectItem value="intermediate">{t('profile.intermediate')}</SelectItem>
                    <SelectItem value="advanced">{t('profile.advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">{t('profile.city')}</Label>
                <Input
                  id="city"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger className="glow-input">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  placeholder="e.g., +971501234567"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>

              {/* Available Times */}
              <div className="space-y-2">
                <Label htmlFor="availableTimes">{t('profile.availableTimes')}</Label>
                <Input
                  id="availableTimes"
                  placeholder="e.g., Weekday evenings, Weekend mornings"
                  value={formData.availableTimes}
                  onChange={(e) => setFormData({ ...formData, availableTimes: e.target.value })}
                />
              </div>

              {/* Gender Preference */}
              <div className="space-y-2">
                <Label>{t('profile.gender')}</Label>
                <Select
                  value={formData.genderPreference}
                  onValueChange={(value) => setFormData({ ...formData, genderPreference: value })}
                >
                  <SelectTrigger className="glow-input">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">{t('profile.any')}</SelectItem>
                    <SelectItem value="male">{t('profile.male')}</SelectItem>
                    <SelectItem value="female">{t('profile.female')}</SelectItem>
                    <SelectItem value="mixed">{t('profile.mixed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t('profile.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {t('profile.save')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rating.title')}</DialogTitle>
            <DialogDescription>{t('rating.selectPlayer')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRatingSubmit} className="space-y-6">
            {selectedMatch && (
              <div className="space-y-2">
                <Label>{t('rating.selectPlayer')}</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="glow-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedMatch.participants?.filter((p: string) => p !== user?.uid) || []).map((playerId: string) => (
                      <SelectItem key={playerId} value={playerId}>
                        {playerNames[playerId] || `Player ${playerId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRatingModal(false)}>
                {t('common.cancel')}
              </Button>
            <Button 
              type="submit" 
              variant="hero" 
              className="glow-primary"
              disabled={
                !selectedPlayer || 
                !selectedMatch ||
                ratings.punctuality === 0 || 
                ratings.skills === 0 || 
                ratings.behavior === 0 ||
                ratings.teamwork === 0
              }
            >
              {t('rating.submit')}
            </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
