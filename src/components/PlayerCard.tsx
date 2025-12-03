import React, { useState } from 'react';
import { MapPin, Star, MessageCircle, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import InviteModal from '@/components/InviteModal';
import { toast } from 'sonner';

interface PlayerCardProps {
  playerId?: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  location: string;
  distance: string;
  avatar?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  playerId,
  name,
  skillLevel,
  rating,
  location,
  distance,
  avatar,
}) => {
  const { t } = useLanguage();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const skillColors = {
    beginner: 'bg-green-500/10 text-green-600 dark:text-green-400',
    intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    advanced: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const skillLabels = {
    beginner: t('profile.beginner'),
    intermediate: t('profile.intermediate'),
    advanced: t('profile.advanced'),
  };

  return (
    <Card glow className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-primary-foreground font-bold text-xl">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{name}</h3>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${skillColors[skillLevel]}`}>
                {skillLabels[skillLevel]}
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{location}</span>
              <span className="text-primary font-medium ml-auto">{distance}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              toast.info(t('common.comingSoon') || 'Coming soon');
            }}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {t('finder.chat')}
          </Button>
          <Button 
            variant="glow" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              if (playerId) {
                setShowInviteModal(true);
              } else {
                // Fallback if playerId is not provided
                console.warn('Player ID not provided for invite');
              }
            }}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            {t('finder.invite')}
          </Button>
        </div>
      </CardContent>
      
      {playerId && (
        <InviteModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          playerId={playerId}
          playerName={name}
        />
      )}
    </Card>
  );
};

export default PlayerCard;
