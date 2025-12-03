import React, { useState, useEffect } from 'react';
import { 
  Users, MapPin, MessageSquare, Calendar, ShoppingBag, 
  BarChart3, TrendingUp, Edit, Trash2, Plus, Eye, X, Clock, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, updateDoc, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

// Interfaces
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

interface Court {
  id: string;
  name: string;
  address: string;
  price?: string;
  rating?: number;
  status?: string;
  [key: string]: any;
}

interface Post {
  id: string;
  title: string;
  authorId: string;
  author?: string;
  replies?: number;
  status?: string;
  [key: string]: any;
}

interface Group {
  id: string;
  name: string;
  members?: number | string[];
  city?: string;
  status?: string;
  [key: string]: any;
}

interface Event {
  id: string;
  title: string;
  date?: string;
  location?: string;
  participants?: number | string[];
  status?: string;
  [key: string]: any;
}

interface MarketItem {
  id: string;
  title: string;
  price: string;
  sellerId: string;
  seller?: string;
  status?: string;
  [key: string]: any;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalCourts: number;
  totalPosts: number;
  totalEvents: number;
  marketListings: number;
  totalMatches: number;
}

const Admin: React.FC = () => {
  const { t } = useLanguage();
  const { toast: toastHook } = useToast();
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [market, setMarket] = useState<MarketItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCourts: 0,
    totalPosts: 0,
    totalEvents: 0,
    marketListings: 0,
    totalMatches: 0,
  });
  
  const [loading, setLoading] = useState({
    courts: true,
    posts: true,
    groups: true,
    events: true,
    market: true,
    matches: true,
    users: true,
  });
  
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [isCourtDialogOpen, setIsCourtDialogOpen] = useState(false);
  const [courtForm, setCourtForm] = useState({ name: '', address: '', price: '', rating: 0, imageUrl: '', hours: '', whatsapp: '', website: '' });
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch all data from Firestore
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch Users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;
        const activeUsers = usersSnapshot.docs.filter(doc => {
          const data = doc.data();
          const lastActive = data.lastActive?.toDate ? data.lastActive.toDate() : null;
          if (!lastActive) return false;
          const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceActive <= 30; // Active in last 30 days
        }).length;

        // Fetch Courts
        const courtsRef = collection(db, 'courts');
        const courtsSnapshot = await getDocs(courtsRef);
        const courtsData: Court[] = [];
        courtsSnapshot.forEach((doc) => {
          courtsData.push({
            id: doc.id,
            ...doc.data(),
          } as Court);
        });
        setCourts(courtsData);
        setLoading(prev => ({ ...prev, courts: false }));

        // Fetch Posts
        const postsRef = collection(db, 'posts');
        let postsSnapshot;
        try {
          postsSnapshot = await getDocs(query(postsRef, orderBy('createdAt', 'desc')));
        } catch (error) {
          // If orderBy fails, fetch without ordering
          console.warn('Could not order posts by createdAt, fetching without order:', error);
          postsSnapshot = await getDocs(postsRef);
        }
        const postsData: Post[] = [];
        postsSnapshot.forEach((doc) => {
          const data = doc.data();
          postsData.push({
            id: doc.id,
            ...data,
            author: data.authorName || data.authorId || 'Unknown',
            replies: data.replies?.length || data.replyCount || 0,
          } as Post);
        });
        // Sort by createdAt if available, otherwise by id
        postsData.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bDate - aDate;
        });
        setPosts(postsData);
        setLoading(prev => ({ ...prev, posts: false }));

        // Fetch Groups
        const groupsRef = collection(db, 'groups');
        const groupsSnapshot = await getDocs(groupsRef);
        const groupsData: Group[] = [];
        groupsSnapshot.forEach((doc) => {
          const data = doc.data();
          groupsData.push({
            id: doc.id,
            ...data,
            members: Array.isArray(data.members) ? data.members.length : data.memberCount || 0,
          } as Group);
        });
        setGroups(groupsData);
        setLoading(prev => ({ ...prev, groups: false }));

        // Fetch Events
        const eventsRef = collection(db, 'events');
        let eventsSnapshot;
        try {
          eventsSnapshot = await getDocs(query(eventsRef, orderBy('date', 'desc')));
        } catch (error) {
          // If orderBy fails, fetch without ordering
          console.warn('Could not order events by date, fetching without order:', error);
          eventsSnapshot = await getDocs(eventsRef);
        }
        const eventsData: Event[] = [];
        eventsSnapshot.forEach((doc) => {
          const data = doc.data();
          eventsData.push({
            id: doc.id,
            ...data,
            participants: Array.isArray(data.participants) ? data.participants.length : data.participantCount || 0,
          } as Event);
        });
        // Sort by date if available
        eventsData.sort((a, b) => {
          const aDate = a.date || '';
          const bDate = b.date || '';
          return bDate.localeCompare(aDate);
        });
        setEvents(eventsData);
        setLoading(prev => ({ ...prev, events: false }));

        // Fetch Market Items
        const marketRef = collection(db, 'market');
        let marketSnapshot;
        try {
          marketSnapshot = await getDocs(query(marketRef, orderBy('createdAt', 'desc')));
        } catch (error) {
          // If orderBy fails, fetch without ordering
          console.warn('Could not order market items by createdAt, fetching without order:', error);
          marketSnapshot = await getDocs(marketRef);
        }
        const marketData: MarketItem[] = [];
        marketSnapshot.forEach((doc) => {
          const data = doc.data();
          marketData.push({
            id: doc.id,
            ...data,
            seller: data.sellerName || data.sellerId || 'Unknown',
          } as MarketItem);
        });
        // Sort by createdAt if available
        marketData.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bDate - aDate;
        });
        setMarket(marketData);
        setLoading(prev => ({ ...prev, market: false }));

        // Fetch Matches
        const matchesRef = collection(db, 'matches');
        let matchesSnapshot;
        try {
          matchesSnapshot = await getDocs(query(matchesRef, orderBy('dateTime', 'desc')));
        } catch (error) {
          // If orderBy fails, fetch without ordering
          console.warn('Could not order matches by dateTime, fetching without order:', error);
          matchesSnapshot = await getDocs(matchesRef);
        }
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
        // Sort by dateTime if available
        matchesData.sort((a, b) => {
          const aDate = a.dateTime instanceof Date ? a.dateTime.getTime() : (a.dateTime as Timestamp).toDate().getTime();
          const bDate = b.dateTime instanceof Date ? b.dateTime.getTime() : (b.dateTime as Timestamp).toDate().getTime();
          return bDate - aDate;
        });
        setMatches(matchesData);
        setLoading(prev => ({ ...prev, matches: false }));

        // Update stats
        setStats({
          totalUsers,
          activeUsers,
          totalCourts: courtsData.length,
          totalPosts: postsData.length,
          totalEvents: eventsData.length,
          marketListings: marketData.length,
          totalMatches: matchesData.length,
        });
        setLoading(prev => ({ ...prev, users: false }));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      }
    };

    fetchAllData();
  }, []);

  const handleDeleteMatch = async () => {
    if (!deleteMatchId) return;

    try {
      const matchRef = doc(db, 'matches', deleteMatchId);
      await deleteDoc(matchRef);
      
      setMatches(matches.filter(m => m.id !== deleteMatchId));
      setMatches(matches.filter(m => m.id !== deleteMatchId));
      setStats(prev => ({ ...prev, totalMatches: prev.totalMatches - 1 }));
      toast.success('Match deleted successfully');
      setShowDeleteDialog(false);
      setDeleteMatchId(null);
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Failed to delete match. Please try again.');
    }
  };

  const formatDate = (date: Date | Timestamp) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return date.toDate().toLocaleDateString();
  };

  const formatDateTime = (match: Match) => {
    const matchDateTime = match.dateTime instanceof Date ? match.dateTime : match.dateTime.toDate();
    return `${match.date} ${match.time}`;
  };

  const handleAddCourt = () => {
    setEditingCourt(null);
    setCourtForm({ name: '', address: '', price: '', rating: 0, imageUrl: '', hours: '', whatsapp: '', website: '' });
    setIsCourtDialogOpen(true);
  };

  const handleEditCourt = (court: Court) => {
    setEditingCourt(court);
    setCourtForm({ 
      name: court.name || '', 
      address: court.address || '', 
      price: court.price || '', 
      rating: court.rating || 0,
      imageUrl: court.imageUrl || court.image || '',
      hours: court.hours || court.openingHours || '',
      whatsapp: court.whatsapp || '',
      website: court.website || ''
    });
    setIsCourtDialogOpen(true);
  };

  const handleSaveCourt = async () => {
    try {
      if (editingCourt) {
        const courtRef = doc(db, 'courts', editingCourt.id);
        await updateDoc(courtRef, {
          name: courtForm.name,
          address: courtForm.address,
          price: courtForm.price,
          rating: courtForm.rating,
          imageUrl: courtForm.imageUrl,
          hours: courtForm.hours,
          whatsapp: courtForm.whatsapp,
          website: courtForm.website,
        });
        setCourts(courts.map(c => c.id === editingCourt.id ? { ...c, ...courtForm } : c));
        toast.success('Court updated successfully');
      } else {
        const newCourtRef = doc(collection(db, 'courts'));
        await setDoc(newCourtRef, {
          name: courtForm.name,
          address: courtForm.address,
          price: courtForm.price,
          rating: courtForm.rating,
          imageUrl: courtForm.imageUrl,
          hours: courtForm.hours,
          whatsapp: courtForm.whatsapp,
          website: courtForm.website,
          status: 'active',
          createdAt: Timestamp.now(),
        });
        setCourts([...courts, { id: newCourtRef.id, ...courtForm, status: 'active' }]);
        setStats(prev => ({ ...prev, totalCourts: prev.totalCourts + 1 }));
        toast.success('Court added successfully');
      }
      setIsCourtDialogOpen(false);
    } catch (error) {
      console.error('Error saving court:', error);
      toast.error('Failed to save court');
    }
  };

  const handleDeleteCourt = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'courts', id));
      setCourts(courts.filter(c => c.id !== id));
      setStats(prev => ({ ...prev, totalCourts: prev.totalCourts - 1 }));
      toast.success('Court deleted successfully');
    } catch (error) {
      console.error('Error deleting court:', error);
      toast.error('Failed to delete court');
    }
  };

  const handleTogglePostStatus = async (id: string) => {
    try {
      const post = posts.find(p => p.id === id);
      if (!post) return;
      const newStatus = post.status === 'active' ? 'hidden' : 'active';
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, { status: newStatus });
      setPosts(posts.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast.success('Post status updated');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(posts.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleToggleGroupStatus = async (id: string) => {
    try {
      const group = groups.find(g => g.id === id);
      if (!group) return;
      const newStatus = group.status === 'active' ? 'inactive' : 'active';
      const groupRef = doc(db, 'groups', id);
      await updateDoc(groupRef, { status: newStatus });
      setGroups(groups.map(g => g.id === id ? { ...g, status: newStatus } : g));
      toast.success('Group status updated');
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents(events.filter(e => e.id !== id));
      setStats(prev => ({ ...prev, totalEvents: prev.totalEvents - 1 }));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleDeleteMarketItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'market', id));
      setMarket(market.filter(m => m.id !== id));
      setStats(prev => ({ ...prev, marketListings: prev.marketListings - 1 }));
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting market item:', error);
      toast.error('Failed to delete listing');
    }
  };

  const confirmDeleteMatch = (matchId: string) => {
    setDeleteMatchId(matchId);
    setShowDeleteDialog(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage users, courts, and community content
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card glow>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{loading.users ? '...' : stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card glow>
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-foreground">{loading.courts ? '...' : stats.totalCourts}</p>
              <p className="text-xs text-muted-foreground">Courts</p>
            </CardContent>
          </Card>
          <Card glow>
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-foreground">{loading.posts ? '...' : stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
          <Card glow>
            <CardContent className="p-4 text-center">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-pink-500" />
              <p className="text-2xl font-bold text-foreground">{loading.market ? '...' : stats.marketListings}</p>
              <p className="text-xs text-muted-foreground">Listings</p>
            </CardContent>
          </Card>
          <Card glow>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-foreground">{loading.matches ? '...' : stats.totalMatches}</p>
              <p className="text-xs text-muted-foreground">Matches</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="courts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="courts" className="gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Courts</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Matches</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Market</span>
            </TabsTrigger>
          </TabsList>

          {/* Matches Management */}
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Matches Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loading.matches ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading matches...</span>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No matches found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Creator</TableHead>
                          <TableHead className="hidden md:table-cell">Location</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead className="hidden sm:table-cell">Players</TableHead>
                          <TableHead className="hidden lg:table-cell">Skill</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matches.map((match) => (
                          <TableRow key={match.id}>
                            <TableCell className="font-medium">{match.createdByName || 'Unknown'}</TableCell>
                            <TableCell className="hidden md:table-cell">{match.location}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{match.date}</span>
                                <span className="text-xs text-muted-foreground">{match.time}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {match.participants?.length || 0} / {match.playersNeeded}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell capitalize">
                              {match.skillPreference || 'Any'}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                match.status === 'open' ? 'bg-green-500/20 text-green-500' : 
                                match.status === 'full' ? 'bg-blue-500/20 text-blue-500' : 
                                'bg-muted text-muted-foreground'
                              }`}>
                                {match.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => confirmDeleteMatch(match.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courts Management */}
          <TabsContent value="courts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Courts Management</CardTitle>
                <Button variant="glow" size="sm" onClick={handleAddCourt}>
                  <Plus className="w-4 h-4 mr-1" /> Add Court
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Address</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="hidden sm:table-cell">Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courts.map((court) => (
                      <TableRow key={court.id}>
                        <TableCell className="font-medium">{court.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{court.address}</TableCell>
                        <TableCell>{court.price}</TableCell>
                        <TableCell className="hidden sm:table-cell">{court.rating}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${court.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                            {court.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditCourt(court)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteCourt(court.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Management */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Posts Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Author</TableHead>
                      <TableHead>Replies</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell className="hidden sm:table-cell">{post.author}</TableCell>
                        <TableCell>{post.replies}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            post.status === 'active' ? 'bg-green-500/20 text-green-500' : 
                            post.status === 'flagged' ? 'bg-yellow-500/20 text-yellow-500' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {post.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleTogglePostStatus(post.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Management */}
          <TabsContent value="market">
            <Card>
              <CardHeader>
                <CardTitle>Market Listings</CardTitle>
              </CardHeader>
              <CardContent>
                {loading.market ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading market listings...</span>
                  </div>
                ) : market.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No market listings found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden sm:table-cell">Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {market.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.price || 'N/A'}</TableCell>
                          <TableCell className="hidden sm:table-cell">{item.seller || 'Unknown'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === 'active' ? 'bg-green-500/20 text-green-500' : 
                              'bg-muted text-muted-foreground'
                            }`}>
                              {item.status || 'active'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteMarketItem(item.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Court Dialog */}
        <Dialog open={isCourtDialogOpen} onOpenChange={setIsCourtDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourt ? 'Edit Court' : 'Add New Court'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input 
                  value={courtForm.name} 
                  onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                  placeholder="Court name"
                  className="glow-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Address</label>
                <Input 
                  value={courtForm.address} 
                  onChange={(e) => setCourtForm({ ...courtForm, address: e.target.value })}
                  placeholder="Full address"
                  className="glow-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Price</label>
                <Input 
                  value={courtForm.price} 
                  onChange={(e) => setCourtForm({ ...courtForm, price: e.target.value })}
                  placeholder="e.g., 150 AED/hour"
                  className="glow-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Rating</label>
                <Input 
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={courtForm.rating} 
                  onChange={(e) => setCourtForm({ ...courtForm, rating: parseFloat(e.target.value) || 0 })}
                  className="glow-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Image URL</label>
                <Input 
                  value={courtForm.imageUrl} 
                  onChange={(e) => setCourtForm({ ...courtForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="glow-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Hours</label>
                <Input 
                  value={courtForm.hours} 
                  onChange={(e) => setCourtForm({ ...courtForm, hours: e.target.value })}
                  placeholder="e.g., 9:00 AM - 10:00 PM"
                  className="glow-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">WhatsApp Number</label>
                <Input 
                  value={courtForm.whatsapp} 
                  onChange={(e) => setCourtForm({ ...courtForm, whatsapp: e.target.value })}
                  placeholder="e.g., +971501234567"
                  className="glow-input mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Website (Optional)</label>
                <Input 
                  value={courtForm.website} 
                  onChange={(e) => setCourtForm({ ...courtForm, website: e.target.value })}
                  placeholder="https://example.com"
                  className="glow-input mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCourtDialogOpen(false)}>Cancel</Button>
              <Button variant="glow" onClick={handleSaveCourt}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Match Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Match</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this match? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteMatchId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteMatch}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Admin;
