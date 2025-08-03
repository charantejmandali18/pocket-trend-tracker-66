import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Copy, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setError(`OAuth Error: ${error}`);
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setLoading(false);
        return;
      }

      // Exchange code for tokens
      await exchangeCodeForTokens(code, state);
      
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exchangeCodeForTokens = async (code: string, state: string | null) => {
    try {
      // Call backend endpoint to securely exchange code for tokens - bypass security issue  
      const tokenResponse = await fetch('http://localhost:8089/api/email-auth/gmail/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          state: state
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(`Token exchange failed: ${errorData.error || 'Unknown error'}`);
      }

      const result = await tokenResponse.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Token exchange failed');
      }

      // Set token data from backend response
      setTokenData({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        token_type: result.token_type,
        scope: result.scope
      });
      
      setEmail(result.email);

      toast({
        title: "OAuth Success!",
        description: `Successfully authenticated with Gmail: ${result.email}`,
      });

      // Redirect to profile page after successful OAuth
      setTimeout(() => {
        navigate('/profile');
      }, 2000); // Wait 2 seconds to show success message

    } catch (err) {
      console.error('Token exchange error:', err);
      throw err;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Processing OAuth callback...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              OAuth Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={goToProfile} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center text-green-600">
              <CheckCircle className="h-6 w-6 mr-2" />
              🎉 Gmail Connected Successfully!
            </CardTitle>
            {email && (
              <div className="mt-2">
                <p className="text-gray-600 dark:text-gray-400">
                  Successfully authenticated: <span className="font-mono text-green-600">{email}</span>
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  ✨ Your Gmail account is now connected and ready for transaction extraction!
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Redirecting to your profile page in 2 seconds...
                </p>
              </div>
            )}
          </CardHeader>
        </Card>

        {tokenData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>OAuth Tokens</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These tokens prove the OAuth flow is working correctly. In production, these would be securely stored.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Access Token */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-sm">Access Token</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(tokenData.access_token, 'Access Token')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border break-all">
                  {tokenData.access_token}
                </div>
              </div>

              {/* Refresh Token */}
              {tokenData.refresh_token && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-sm">Refresh Token</label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(tokenData.refresh_token!, 'Refresh Token')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="font-mono text-xs bg-white dark:bg-gray-900 p-2 rounded border break-all">
                    {tokenData.refresh_token}
                  </div>
                </div>
              )}

              {/* Token Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <label className="font-medium text-sm text-blue-800 dark:text-blue-200">Token Type</label>
                  <div className="font-mono text-sm mt-1">{tokenData.token_type}</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <label className="font-medium text-sm text-green-800 dark:text-green-200">Expires In</label>
                  <div className="font-mono text-sm mt-1">{tokenData.expires_in} seconds</div>
                </div>
              </div>

              {/* Scope */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <label className="font-medium text-sm text-purple-800 dark:text-purple-200">Granted Scopes</label>
                <div className="font-mono text-xs mt-2 space-y-1">
                  {tokenData.scope.split(' ').map((scope, index) => (
                    <div key={index} className="bg-white dark:bg-gray-900 p-1 rounded border">
                      {scope}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Success!</strong> The Gmail OAuth flow is now working correctly. 
                The tokens above can be used to access Gmail API on behalf of the user.
              </AlertDescription>
            </Alert>
            <Button onClick={goToProfile} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OAuthCallback;