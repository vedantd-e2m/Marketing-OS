const http = require('http');
const reqBody = JSON.stringify({
  directUrls: ["https://www.instagram.com/p/CoU5l2jP-g_/"],
  resultsType: "posts",
  resultsLimit: 50,
  searchType: "hashtag",
  searchLimit: 1
});

const req = http.request('http://localhost:5000/api/jobs/apify/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(reqBody)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});
req.write(reqBody);
req.end();
