import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  MapPin,
  Calendar,
  Star,
  MessageCircle,
  Users2,
  User,
  Search,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const Index: React.FC = () => {
  const { t, language } = useLanguage();

  const arabicFeatureCards = [
    {
      icon: MapPin,
      title: t('features.courtsMap.title'),
      description: t('features.courtsMap.description'),
      cta: t('features.courtsMap.cta'),
      gradient: 'from-pink-400 to-purple-500',
    },
    {
      icon: Calendar,
      title: t('features.quickMatch.title'),
      description: t('features.quickMatch.description'),
      cta: t('features.quickMatch.cta'),
      gradient: 'from-green-400 to-emerald-500',
    },
    {
      icon: Users,
      title: t('features.matchFinder.title'),
      description: t('features.matchFinder.description'),
      cta: t('features.matchFinder.cta'),
      gradient: 'from-purple-400 to-indigo-500',
    },
    {
      icon: Star,
      title: t('features.premium.title'),
      description: t('features.premium.description'),
      cta: t('features.premium.cta'),
      gradient: 'from-yellow-400 to-orange-500',
    },
    {
      icon: MessageCircle,
      title: t('features.chat.title'),
      description: t('features.chat.description'),
      cta: t('features.chat.cta'),
      gradient: 'from-orange-400 to-pink-500',
    },
    {
      icon: Users2,
      title: t('features.community.title'),
      description: t('features.community.description'),
      cta: t('features.community.cta'),
      gradient: 'from-blue-400 to-cyan-500',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('index.badge')}
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up">
              {t('hero.title')}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button asChild variant="hero" size="xl">
                <Link to="/profile">
                  {t('hero.createProfile')}
                  <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="xl">
                <Link to="/find-player">
                  {t('hero.findMatch')}
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">10K+</div>
                <div className="text-sm text-muted-foreground mt-1">{t('index.stats.players')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">500+</div>
                <div className="text-sm text-muted-foreground mt-1">{t('index.stats.courts')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">25K+</div>
                <div className="text-sm text-muted-foreground mt-1">{t('index.stats.matches')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Arabic feature cards section */}
          <div className="mb-16">
            {/* Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                {t('index.features.badge')}
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-4">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                {t('index.features.title')}
              </h2>
            </div>

            {/* Subtitle */}
            <div className="text-center mb-12">
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t('index.features.subtitle')}
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {arabicFeatureCards.map((item, index) => (
                <Card key={index} glow className="p-6 h-full flex flex-col justify-between">
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-auto">
                      <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                        <span>{item.cta}</span>
                        <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {t('index.howItWorks.badge')}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t('index.howItWorks.title')}
            </h2>
          </div>

          {/* Steps Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <Card glow className="text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <User className="w-12 h-12 text-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                  {t('index.howItWorks.step1.title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('index.howItWorks.step1.description')}
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card glow className="text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">2</span>
                </div>
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Search className="w-12 h-12 text-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                  {t('index.howItWorks.step2.title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('index.howItWorks.step2.description')}
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card glow className="text-center p-8">
              <CardContent className="p-0">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal-500 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">3</span>
                </div>
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-foreground" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                  {t('index.howItWorks.step3.title')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('index.howItWorks.step3.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="gradient-primary p-8 md:p-12 text-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                {t('index.cta.title')}
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                {t('index.cta.subtitle')}
              </p>
              <Button asChild variant="secondary" size="xl" className="hover:bg-white hover:text-primary hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_8px_rgba(255,255,255,0.4)]">
                <Link to="/profile">
                  {t('index.cta.button')}
                  <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
