import React, { useState, useEffect } from 'react';
import { Bell, Calendar, MessageCircle, Star, UserPlus, CheckCircle, X, Filter, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, Timestamp, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface Notification {
  id: string;
  userId: string;
  type: 'match_invitation' | 'invitation_accepted' | 'match_reminder' | 'chat_message' | 'rating_request';
  title: string;
  description: string;
  read: boolean;
  createdAt: Timestamp | Date;
  data?: {
    matchId?: string;
    invitationId?: string;
    matchLocation?: string;
    matchDateTime?: Timestamp | Date;
    inviterName?: string;
    accepterName?: string;
    chatId?: string;
    messageCount?: number;
  };
}

interface NotificationsProps {
  onRatePlayers?: (matchId: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onRatePlayers }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'invitations' | 'chat' | 'system'>('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedMatchForRating, setSelectedMatchForRating] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const notificationsSnapshot = await getDocs(q);

      const notificationsData: Notification[] = [];
      notificationsSnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        } as Notification);
      });

      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) {
        toast.info('All notifications are already read');
        return;
      }

      const batch = writeBatch(db);
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, {
          read: true,
          readAt: serverTimestamp(),
        });
      });

      await batch.commit();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleAcceptInvitation = async (notification: Notification) => {
    if (!user || !notification.data?.matchId || !notification.data?.invitationId) return;

    try {
      // This will be handled by the MatchFinder component
      // For now, just mark as read and show a message
      await handleMarkAsRead(notification.id);
      toast.success('Please go to Match Finder to accept the invitation');
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async (notification: Notification) => {
    if (!user || !notification.data?.invitationId) return;

    try {
      // Update invitation status
      await updateDoc(doc(db, 'matchInvitations', notification.data.invitationId), {
        status: 'declined',
        respondedAt: serverTimestamp(),
      });
      
      // Mark notification as read
      await handleMarkAsRead(notification.id);
      toast.success('Invitation declined');
      await fetchNotifications();
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    }
  };

  const handleRatePlayers = (notification: Notification) => {
    if (notification.data?.matchId) {
      setSelectedMatchForRating(notification.data.matchId);
      setShowRatingModal(true);
      handleMarkAsRead(notification.id);
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success(t('notifications.deleted') || 'Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'match_invitation':
        return <UserPlus className="w-5 h-5" />;
      case 'invitation_accepted':
        return <CheckCircle className="w-5 h-5" />;
      case 'match_reminder':
        return <Calendar className="w-5 h-5" />;
      case 'chat_message':
        return <MessageCircle className="w-5 h-5" />;
      case 'rating_request':
        return <Star className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'match_invitation':
        return 'text-blue-500 bg-blue-500/10';
      case 'invitation_accepted':
        return 'text-green-500 bg-green-500/10';
      case 'match_reminder':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'chat_message':
        return 'text-purple-500 bg-purple-500/10';
      case 'rating_request':
        return 'text-orange-500 bg-orange-500/10';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  const formatTimeAgo = (date: Date | Timestamp) => {
    const now = new Date();
    const notificationDate = date instanceof Date ? date : date.toDate();
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return t('notifications.justNow') || 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${t('notifications.minutesAgo') || 'min ago'}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${t('notifications.hoursAgo') || 'hours ago'}`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ${t('notifications.daysAgo') || 'days ago'}`;
    return notificationDate.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'invitations') {
      return notification.type === 'match_invitation' || notification.type === 'invitation_accepted';
    }
    if (filter === 'chat') {
      return notification.type === 'chat_message';
    }
    if (filter === 'system') {
      return notification.type === 'match_reminder' || notification.type === 'rating_request';
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filter and Mark All as Read */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{t('notifications.title') || 'Notifications'}</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[140px] glow-input">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('notifications.all') || 'All'}</SelectItem>
              <SelectItem value="invitations">{t('notifications.invitations') || 'Invitations'}</SelectItem>
              <SelectItem value="chat">{t('notifications.chat') || 'Chat'}</SelectItem>
              <SelectItem value="system">{t('notifications.system') || 'System'}</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="glow-primary"
            >
              {t('notifications.markAllRead') || 'Mark all as read'}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {t('notifications.noNotifications') || 'No notifications'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "glass-card transition-all duration-300 cursor-pointer hover:glow-card",
                !notification.read && "ring-2 ring-primary/50"
              )}
              onClick={() => !notification.read && handleMarkAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    getNotificationColor(notification.type)
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={cn(
                        "font-semibold text-sm",
                        !notification.read && "font-bold"
                      )}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          title={t('notifications.delete') || 'Delete notification'}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.description}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notification.createdAt as Date | Timestamp)}
                      </span>
                      
                      {/* Action Buttons */}
                      {notification.type === 'match_invitation' && !notification.read && (
                        <div className="flex gap-2 ml-auto">
                          <Button
                            variant="hero"
                            size="sm"
                            className="h-7 text-xs glow-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptInvitation(notification);
                            }}
                          >
                            {t('notifications.accept') || 'Accept'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeclineInvitation(notification);
                            }}
                          >
                            {t('notifications.decline') || 'Decline'}
                          </Button>
                        </div>
                      )}
                      {notification.type === 'rating_request' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs ml-auto glow-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRatePlayers(notification);
                          }}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {t('notifications.ratePlayers') || 'Rate Players'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

