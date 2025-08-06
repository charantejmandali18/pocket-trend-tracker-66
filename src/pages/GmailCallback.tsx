import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { gmailOAuthService } from '@/services/gmailOAuth';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const GmailCallback = () => {
  const [searchParams] = useSearchParams();
  const { user } = useApp();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Gmail authorization...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Wait for user to be available, or get from Supabase auth directly
      let currentUser = user;
      if (!currentUser) {
        // Get user from Supabase auth directly
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          throw new Error('User not authenticated');
        }
        currentUser = authUser;
      }

      // Exchange code for tokens
      setMessage('Exchanging authorization code for tokens...');
      const tokens = await gmailOAuthService.exchangeCodeForTokens(code);

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Get user info
      setMessage('Getting Gmail account information...');
      const userInfo = await gmailOAuthService.getUserInfo(tokens.access_token);

      if (!userInfo.email) {
        throw new Error('Could not retrieve email address');
      }

      // Store integration in Supabase
      setMessage('Saving Gmail integration...');
      const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined;
      
      await gmailOAuthService.storeEmailIntegration(
        currentUser.id,
        userInfo.email,
        tokens.access_token,
        tokens.refresh_token,
        expiresAt
      );

      setStatus('success');
      setMessage(`Successfully connected ${userInfo.email}!`);

      // Notify parent window
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'GMAIL_OAUTH_SUCCESS',
            email: userInfo.email
          }, window.location.origin);
          console.log('Success message sent to parent window');
        } catch (error) {
          console.error('Error sending message to parent:', error);
        }
      }

      // Close popup after a short delay
      setTimeout(() => {
        try {
          window.close();
        } catch (error) {
          console.log('Could not close window automatically');
          setMessage('Authentication successful! You can close this window.');
        }
      }, 2000);

    } catch (error) {
      console.error('Gmail OAuth callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unknown error occurred');

      // Notify parent window of error
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'GMAIL_OAUTH_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, window.location.origin);
          console.log('Error message sent to parent window');
        } catch (postError) {
          console.error('Error sending message to parent:', postError);
        }
      }

      // Close popup after a delay
      setTimeout(() => {
        try {
          window.close();
        } catch (error) {
          console.log('Could not close window automatically');
        }
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {status === 'loading' && <Loader className="h-5 w-5 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            <span>
              {status === 'loading' && 'Connecting Gmail...'}
              {status === 'success' && 'Gmail Connected!'}
              {status === 'error' && 'Connection Failed'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">{message}</p>
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm text-gray-500">
              This window will close shortly. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GmailCallback;