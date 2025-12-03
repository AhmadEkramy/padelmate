import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { createMatchInvitationNotification } from '@/lib/notifications';

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
}

interface Match {
  id: string;
  createdBy: string;
  createdByName: string;
  date: string;
  time: string;
  dateTime: Timestamp | Date;
  location: string;
  playersNeeded: number;
  participants: string[];
}

const InviteModal: React.FC<InviteModalProps> = ({ open, onOpenChange, playerId, playerName }) => {
  const { t } = useLanguage();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new' | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  useEffect(() => {
    if (open && user) {
      fetchActiveMatches();
    }
  }, [open, user]);

  const fetchActiveMatches = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const matchesRef = collection(db, 'matches');
      const now = new Date();
      
      // Fetch matches created by current user that are not past
      const matchesSnapshot = await getDocs(matchesRef);
      const matchesData: Match[] = [];
      
      matchesSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only include matches created by current user
        if (data.createdBy !== user.uid) return;
        
        const matchDateTime = data.dateTime?.toDate ? data.dateTime.toDate() : new Date(`${data.date}T${data.time}`);
        
        // Only include future matches
        if (matchDateTime < now) return;
        
        // Only include matches that are not full
        if (data.participants?.length >= data.playersNeeded) return;
        
        matchesData.push({
          id: doc.id,
          ...data,
          dateTime: matchDateTime,
        } as Match);
      });
      
      // Sort by dateTime ascending
      matchesData.sort((a, b) => {
        const aDate = a.dateTime instanceof Date ? a.dateTime.getTime() : (a.dateTime as Timestamp).toDate().getTime();
        const bDate = b.dateTime instanceof Date ? b.dateTime.getTime() : (b.dateTime as Timestamp).toDate().getTime();
        return aDate - bDate;
      });
      
      setActiveMatches(matchesData);
    } catch (error) {
      console.error('Error fetching active matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteToExistingMatch = async () => {
    if (!selectedMatchId || !user) {
      toast.error('Please select a match');
      return;
    }

    try {
      // Check if invitation already exists
      const invitationsRef = collection(db, 'matchInvitations');
      const existingInvitationQuery = query(
        invitationsRef,
        where('matchId', '==', selectedMatchId),
        where('invitedPlayerId', '==', playerId),
        where('status', '==', 'pending')
      );
      const existingInvitations = await getDocs(existingInvitationQuery);

      if (!existingInvitations.empty) {
        toast.error('Invitation already sent to this player');
        return;
      }

      // Create invitation
      const invitationData = {
        matchId: selectedMatchId,
        invitedBy: user.uid,
        invitedByName: userData?.displayName || user.email?.split('@')[0] || 'Unknown',
        invitedPlayerId: playerId,
        invitedPlayerName: playerName,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const invitationRef = await addDoc(invitationsRef, invitationData);
      
      // Create notification for invited player
      const matchDoc = await getDoc(doc(db, 'matches', selectedMatchId));
      if (matchDoc.exists()) {
        const matchData = matchDoc.data();
        await createMatchInvitationNotification(
          playerId,
          userData?.displayName || user.email?.split('@')[0] || 'Unknown',
          selectedMatchId,
          invitationRef.id,
          matchData.location,
          matchData.dateTime
        );
      }
      
      toast.success('Invitation sent!');
      onOpenChange(false);
      setSelectedOption(null);
      setSelectedMatchId('');
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation. Please try again.');
    }
  };

  const handleCreateNewMatch = () => {
    onOpenChange(false);
    setSelectedOption(null);
    // Navigate to create match page with playerId in state
    navigate('/create-match', { state: { invitePlayerId: playerId, invitePlayerName: playerName } });
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedOption(null);
    setSelectedMatchId('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('invite.title') || 'Invite Player'}</DialogTitle>
          <DialogDescription>
            {t('invite.description') || `Invite ${playerName} to a match`}
          </DialogDescription>
        </DialogHeader>

        {!selectedOption ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-2"
              onClick={() => setSelectedOption('existing')}
            >
              <div className="font-semibold text-lg">{t('invite.existingMatch') || 'Invite to Existing Match'}</div>
              <div className="text-sm text-muted-foreground">
                {t('invite.existingMatchDesc') || 'Select from your active matches'}
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-2"
              onClick={() => setSelectedOption('new')}
            >
              <div className="font-semibold text-lg">{t('invite.newMatch') || 'Create New Match'}</div>
              <div className="text-sm text-muted-foreground">
                {t('invite.newMatchDesc') || 'Create a new match and automatically invite this player'}
              </div>
            </Button>
          </div>
        ) : selectedOption === 'existing' ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : activeMatches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {t('invite.noActiveMatches') || 'No active matches found'}
                </p>
                <Button variant="outline" onClick={() => setSelectedOption(null)}>
                  {t('common.back')}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {activeMatches.map((match) => {
                    const matchDateTime = match.dateTime instanceof Date 
                      ? match.dateTime 
                      : (match.dateTime as Timestamp).toDate();
                    const neededPlayers = match.playersNeeded - (match.participants?.length || 0);
                    
                    return (
                      <Card
                        key={match.id}
                        className={`cursor-pointer transition-all ${
                          selectedMatchId === match.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedMatchId(match.id)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{match.location}</h3>
                              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                {neededPlayers} {t('matchFinder.playersNeeded')}
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedOption(null)}>
                    {t('common.back')}
                  </Button>
                  <Button
                    variant="hero"
                    onClick={handleInviteToExistingMatch}
                    disabled={!selectedMatchId}
                    className="glow-primary"
                  >
                    {t('invite.sendInvitation') || 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t('invite.createNewMatchMessage') || 'You will be redirected to create a new match. After creating the match, the player will be automatically invited.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOption(null)}>
                {t('common.back') || 'Back'}
              </Button>
              <Button variant="hero" onClick={handleCreateNewMatch} className="glow-primary">
                <Plus className="w-4 h-4 mr-2" />
                {t('invite.createMatch') || 'Create Match'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;

