import React, { useState, useEffect } from 'react';
import { MessageSquare, ShoppingBag, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface Post {
  id: string;
  author: string;
  title: string;
  replies: number;
  createdAt: Timestamp | Date;
  time: string;
}

interface MarketItem {
  id: string;
  title: string;
  price: string;
  condition: string;
  image?: string;
}

const Community: React.FC = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState({
    posts: true,
    market: true,
  });

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: Timestamp | Date): string => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch Posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);
        
        const postsData: Post[] = [];
        postsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.title && data.author) {
            const createdAt = data.createdAt || data.created || new Date();
            postsData.push({
              id: doc.id,
              author: data.author,
              title: data.title,
              replies: data.replies || data.replyCount || 0,
              createdAt,
              time: formatTimeAgo(createdAt),
            });
          }
        });
        
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setLoading(prev => ({ ...prev, posts: false }));
      }
    };

    fetchPosts();
  }, []);

  // Fetch Market Items
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const marketRef = collection(db, 'market');
        const marketQuery = query(marketRef, orderBy('createdAt', 'desc'));
        const marketSnapshot = await getDocs(marketQuery);
        
        const marketData: MarketItem[] = [];
        marketSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.title && data.price) {
            marketData.push({
              id: doc.id,
              title: data.title,
              price: data.price,
              condition: data.condition || 'Used',
              image: data.image || data.imageUrl,
            });
          }
        });
        
        setMarketItems(marketData);
      } catch (error) {
        console.error('Error fetching market items:', error);
        toast.error('Failed to load market items');
      } finally {
        setLoading(prev => ({ ...prev, market: false }));
      }
    };

    fetchMarket();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('nav.community')}
          </h1>
          <p className="text-muted-foreground">
            Connect, discuss, and grow with fellow players
          </p>
        </div>

        <Tabs defaultValue="discussions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="discussions" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Discussions</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Market</span>
            </TabsTrigger>
          </TabsList>

          {/* Discussions */}
          <TabsContent value="discussions">
            {loading.posts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <p className="text-muted-foreground">No posts yet. Start a discussion!</p>
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post) => (
                <Card key={post.id} glow>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Posted by {post.author} • {post.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <MessageSquare className="w-4 h-4" />
                        {post.replies}
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                  ))
                )}
                <Button variant="outline" className="w-full">
                  Create New Post
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Market */}
          <TabsContent value="market">
            {loading.market ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : marketItems.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No items for sale. Be the first to list something!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketItems.map((item) => (
                <Card key={item.id} glow>
                  <CardContent className="p-4">
                    {item.image ? (
                      <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-lg bg-muted mb-3 flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-primary">{item.price}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {item.condition}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      Contact Seller
                    </Button>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
