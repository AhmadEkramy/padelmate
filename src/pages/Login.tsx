import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success(t('auth.loginSuccess') || 'Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = t('auth.loginError') || 'Failed to login. Please try again.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalidEmail') || 'Invalid email address.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = t('auth.userNotFound') || 'User not found.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('auth.wrongPassword') || 'Incorrect password.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = t('auth.invalidCredential') || 'Invalid email or password.';
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
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display">{t('auth.login') || 'Login'}</CardTitle>
            <CardDescription>
              {t('auth.loginDescription') || 'Sign in to your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email') || 'Email'}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder') || 'Enter your email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                    {t('auth.loggingIn') || 'Logging in...'}
                  </>
                ) : (
                  t('auth.login') || 'Login'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {t('auth.noAccount') || "Don't have an account? "}
              </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                {t('auth.signUp') || 'Sign Up'}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

