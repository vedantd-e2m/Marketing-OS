const http = require('http');
const req = http.request('http://localhost:5000/api/jobs/brandfetch/v2/brands/apple.com', {
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});
req.end();
