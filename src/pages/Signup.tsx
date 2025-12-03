import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const Signup: React.FC = () => {
  const { t } = useLanguage();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwordMismatch') || 'Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('auth.passwordTooShort') || 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.displayName);
      toast.success(t('auth.signupSuccess') || 'Account created successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = t('auth.signupError') || 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('auth.emailInUse') || 'Email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalidEmail') || 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('auth.weakPassword') || 'Password is too weak.';
      } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        errorMessage = t('auth.permissionError') || 'Permission denied. Please check Firestore security rules.';
        console.error('Firestore permission error. Make sure to update your Firestore security rules. See FIRESTORE_SECURITY_RULES.txt for the rules to add.');
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">{t('auth.signUp') || 'Sign Up'}</CardTitle>
            <CardDescription>
              {t('auth.signupDescription') || 'Create a new account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('auth.displayName') || 'Full Name'}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder={t('auth.displayNamePlaceholder') || 'Enter your full name'}
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email') || 'Email'}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder') || 'Enter your email'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password') || 'Password'}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder') || 'Enter your password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword') || 'Confirm Password'}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t('auth.confirmPasswordPlaceholder') || 'Confirm your password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.creatingAccount') || 'Creating account...'}
                  </>
                ) : (
                  t('auth.signUp') || 'Sign Up'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {t('auth.haveAccount') || 'Already have an account? '}
              </span>
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('auth.login') || 'Login'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;

