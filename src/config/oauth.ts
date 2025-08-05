// OAuth configuration for email providers
export const OAUTH_CONFIG = {
  gmail: {
    client_id: '947339834442-49fj6pmcql4414esqama3pfem01r6luh.apps.googleusercontent.com',
    client_secret: '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',
    redirect_uri: `${window.location.origin}/auth/gmail/callback`,
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  }
};

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];