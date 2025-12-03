import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 'match_invitation' | 'invitation_accepted' | 'match_reminder' | 'chat_message' | 'rating_request';

export interface NotificationData {
  matchId?: string;
  invitationId?: string;
  matchLocation?: string;
  matchDateTime?: Timestamp | Date;
  inviterName?: string;
  accepterName?: string;
  chatId?: string;
  messageCount?: number;
}

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  description: string,
  data?: NotificationData
) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      type,
      title,
      description,
      read: false,
      data: data || {},
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper functions for specific notification types
export const createMatchInvitationNotification = async (
  invitedPlayerId: string,
  inviterName: string,
  matchId: string,
  invitationId: string,
  matchLocation: string,
  matchDateTime: Timestamp | Date
) => {
  await createNotification(
    invitedPlayerId,
    'match_invitation',
    'Match Invitation',
    `You were invited to join a match at ${matchLocation} on ${formatMatchDateTime(matchDateTime)}.`,
    {
      matchId,
      invitationId,
      matchLocation,
      matchDateTime: matchDateTime instanceof Date ? Timestamp.fromDate(matchDateTime) : matchDateTime,
      inviterName,
    }
  );
};

export const createInvitationAcceptedNotification = async (
  inviterId: string,
  accepterName: string,
  matchId: string,
  matchLocation: string
) => {
  await createNotification(
    inviterId,
    'invitation_accepted',
    'Invitation Accepted',
    `${accepterName} accepted your invitation for the match at ${matchLocation}.`,
    {
      matchId,
      matchLocation,
      accepterName,
    }
  );
};

export const createMatchReminderNotification = async (
  userId: string,
  matchId: string,
  matchLocation: string,
  matchDateTime: Timestamp | Date
) => {
  await createNotification(
    userId,
    'match_reminder',
    'Match Reminder',
    `Your match starts in 2 hours at ${matchLocation}.`,
    {
      matchId,
      matchLocation,
      matchDateTime: matchDateTime instanceof Date ? Timestamp.fromDate(matchDateTime) : matchDateTime,
    }
  );
};

export const createChatMessageNotification = async (
  userId: string,
  chatId: string,
  messageCount: number
) => {
  await createNotification(
    userId,
    'chat_message',
    'New Chat Message',
    `You have ${messageCount} new message${messageCount > 1 ? 's' : ''} in the match chat.`,
    {
      chatId,
      messageCount,
    }
  );
};

export const createRatingRequestNotification = async (
  userId: string,
  matchId: string,
  matchLocation: string
) => {
  await createNotification(
    userId,
    'rating_request',
    'Rating Request',
    `Please rate the players from your last match at ${matchLocation}.`,
    {
      matchId,
      matchLocation,
    }
  );
};

const formatMatchDateTime = (dateTime: Timestamp | Date): string => {
  const date = dateTime instanceof Date ? dateTime : dateTime.toDate();
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

