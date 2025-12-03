import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t, language } = useLanguage();

  const quickLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/find-player', label: t('nav.findMatch') },
    { path: '/create-match', label: t('nav.createMatch') },
    { path: '/courts', label: t('nav.courts') },
  ];

  const resources = [
    { path: '/about', label: t('footer.about') },
    { path: '/blog', label: t('footer.blog') },
    { path: '/contact', label: t('footer.contact') },
  ];

  const support = [
    { path: '/help', label: t('footer.help') },
    { path: '/faq', label: t('footer.faq') },
  ];

  const legal = [
    { path: '/privacy', label: t('footer.privacy') },
    { path: '/terms', label: t('footer.terms') },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">P</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">PadelMate</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {t('footer.description')}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.resources')}</h3>
            <ul className="space-y-2">
              {resources.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2 mb-6">
              {support.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="font-semibold text-foreground mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              {legal.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Website Creator Section */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              <img
                src="https://github.com/AhmadEkramy/ahmedekramy/blob/master/images/profile.jpg?raw=true"
                alt="Ahmed Ekramy"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 shadow-lg"
              />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition-colors">
                {t('footer.websiteCreator')}
              </p>
              <p className="text-base font-medium text-foreground mb-1 hover:text-primary transition-colors">
                Ahmed Ekramy
              </p>
              <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('footer.computerEngineer')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/ahmed.ekramy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary hover:scale-110 transition-all duration-300"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href="https://www.instagram.com/ahmed.ekramy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary hover:scale-110 transition-all duration-300"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://www.linkedin.com/in/ahmed-ekramy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary hover:scale-110 transition-all duration-300"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a
                href="https://wa.me/201234567890"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary hover:scale-110 transition-all duration-300"
              >
                <MessageCircle className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-center text-muted-foreground">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

