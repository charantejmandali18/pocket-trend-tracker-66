const jwt = require('jsonwebtoken');

// Same secret from application.yml
const secret = '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';

// Create a development JWT token
const payload = {
  sub: '1', // userId as string (will be parsed to Long)
  email: 'dev@example.com',
  fullName: 'Development User',
  roles: ['USER', 'ADMIN'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 days
};

const token = jwt.sign(payload, secret);

console.log('Development JWT Token:');
console.log(token);
console.log('\nUse this token in your frontend services by replacing "mock-dev-token" with this token.');
console.log('\nToken details:');
console.log('- User ID: 1');
console.log('- Email: dev@example.com');
console.log('- Full Name: Development User');
console.log('- Roles: USER, ADMIN');
console.log('- Expires: 30 days from now');