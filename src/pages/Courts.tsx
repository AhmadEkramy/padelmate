import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Star, Phone, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface Court {
  id: string;
  name: string;
  address: string;
  price: string;
  hours: string;
  rating: number;
  phone: string;
  image?: string;
  status?: string;
  whatsapp?: string;
  website?: string;
}

const Courts: React.FC = () => {
  const { t } = useLanguage();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const courtsRef = collection(db, 'courts');
        // Order by name for consistent display
        const courtsQuery = query(courtsRef, orderBy('name'));
        const courtsSnapshot = await getDocs(courtsQuery);
        
        const courtsData: Court[] = [];
        
        courtsSnapshot.forEach((doc) => {
          const courtData = doc.data();
          const courtId = doc.id;
          
          // Only include courts with required fields
          if (courtData.name && courtData.address) {
            courtsData.push({
              id: courtId,
              name: courtData.name,
              address: courtData.address,
              price: courtData.price || 'Price not available',
              hours: courtData.hours || courtData.openingHours || 'Hours not available',
              rating: courtData.rating || 4.0,
              phone: courtData.phone || courtData.phoneNumber || 'Phone not available',
              image: courtData.image || courtData.imageUrl || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop',
              status: courtData.status || 'active',
              whatsapp: courtData.whatsapp || '',
              website: courtData.website || '',
            });
          }
        });
        
        setCourts(courtsData);
      } catch (error) {
        console.error('Error fetching courts:', error);
        toast.error('Failed to load courts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t('nav.courts')}
          </h1>
          <p className="text-muted-foreground">
            Find and book courts near you
          </p>
        </div>

        {/* Courts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">{t('common.loading') || 'Loading courts...'}</p>
            </div>
          </div>
        ) : courts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">
                No courts found. Check back later or contact us to add a court.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts
              .filter((court) => !court.status || court.status === 'active')
              .map((court) => (
                <Card key={court.id} glow className="overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={court.image}
                      alt={court.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        // Fallback image if the provided image fails to load
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop';
                      }}
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{court.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 
                        className={`font-display font-semibold text-lg text-foreground ${court.website ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                        onClick={() => {
                          if (court.website) {
                            window.open(court.website, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                      {court.name}
                    </h3>
                      {court.website && (
                        <ExternalLink 
                          className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(court.website, '_blank', 'noopener,noreferrer');
                          }}
                        />
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{court.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span>{court.price}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{court.hours}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {court.phone && court.phone !== 'Phone not available' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(`tel:${court.phone}`, '_self')}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      )}
                      <Button 
                        variant="glow" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          if (court.whatsapp) {
                            // Format WhatsApp number (remove any spaces, dashes, or other characters)
                            const cleanNumber = court.whatsapp.replace(/[^\d+]/g, '');
                            const whatsappUrl = `https://wa.me/${cleanNumber}`;
                            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                          } else {
                            toast.error('WhatsApp number not available for this court');
                          }
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courts;
