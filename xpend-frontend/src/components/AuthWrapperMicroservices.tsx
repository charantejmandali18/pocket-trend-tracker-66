import React, { useState, useEffect } from 'react';
import { authService, User } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Use real authentication check
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        }
        // No mock user - require real authentication
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Don't create mock user - require real login
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setAuthLoading(true);

    try {
      // Use real registration
      const response = await authService.register({
        email: email.trim(),
        fullName: fullName.trim(),
        password: password,
        confirmPassword: confirmPassword
      });
      
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        toast({
          title: "Success",
          description: "Account created successfully! Welcome to XPEND.",
        });

        // Clear form
        setEmail('');
        setPassword('');
        setFullName('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      // Use real authentication
      const response = await authService.login({
        email: email.trim(),
        password: password
      });
      
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        toast({
          title: "Success",
          description: "Welcome back to XPEND!",
        });
        
        // Clear form
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Use real sign out
      await authService.logout();
      setUser(null);
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      setUser(null);
    }
  };

  // Google Sign-In handler (placeholder for future implementation)
  const handleGoogleSignIn = async () => {
    toast({
      title: "Coming Soon",
      description: "Google Sign-In will be available soon!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">XPEND</CardTitle>
            <p className="text-center text-sm text-gray-500">
              Secure Expense Tracking with Microservices
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? "Signing In..." : "Sign In"}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                  >
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-fullname">Full Name</Label>
                    <Input
                      id="signup-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password (8+ characters)"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must contain uppercase, lowercase, number, and special character
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-10 flex items-center space-x-2">
        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
          Microservices Auth
        </div>
        <div className="text-sm text-muted-foreground">
          Welcome, {user.fullName}
        </div>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
      {children}
    </div>
  );
};

export default AuthWrapper;