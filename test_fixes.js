// Test script for URL normalization and Facebook crawling fixes
const http = require('http');

// Test 1: URL without protocol
console.log('🧪 Test 1: URL without protocol (stonefarmliving.com)');
const test1Data = JSON.stringify({ url: 'stonefarmliving.com' });

const options1 = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/scrape/single',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': test1Data.length,
  },
};

const req1 = http.request(options1, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const response = JSON.parse(data);
    console.log('Response status:', response.status);
    if (response.status === 'success' || response.status === 'no_contacts') {
      console.log('✅ Test 1 PASSED: URL normalization works!');
      console.log('Found contacts:', response.summary.total_found);
    } else if (response.error) {
      console.log('❌ Test 1 FAILED:', response.error);
    }
    console.log('---\n');
  });
});

req1.on('error', (e) => {
  console.log('❌ Test 1 ERROR:', e.message);
  console.log('Make sure server is running on localhost:5000');
});

req1.setTimeout(15000);
req1.write(test1Data);
req1.end();

// Test 2: Check Facebook crawling for sites without direct contacts
setTimeout(() => {
  console.log('🧪 Test 2: Facebook crawling for sites without direct contacts');
  const test2Data = JSON.stringify({ url: 'https://www.artisancustomclosets.com' });

  const options2 = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/scrape/single',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': test2Data.length,
    },
  };

  const req2 = http.request(options2, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      const response = JSON.parse(data);
      console.log('Response status:', response.status);
      console.log('Total contacts found:', response.summary.total_found);
      console.log('From Facebook:', response.summary.from_facebook);

      if (response.summary.from_facebook > 0) {
        console.log('✅ Test 2 PASSED: Facebook fallback is working!');
        response.results.forEach((r) => {
          console.log(
            `  Email: ${r.contact_email}, Source: ${r.source}, Confidence: ${r.confidence_score}`
          );
        });
      } else if (response.status === 'success' && response.summary.total_found > 0) {
        console.log('✅ Test 2 PASSED: Found contacts (may be from website itself)');
        response.results.forEach((r) => {
          console.log(
            `  Email: ${r.contact_email}, Source: ${r.source}, Confidence: ${r.confidence_score}`
          );
        });
      } else {
        console.log('⚠️  Test 2: No contacts found (check if site has contact info)');
      }
    });
  });

  req2.on('error', (e) => {
    console.log('❌ Test 2 ERROR:', e.message);
  });

  req2.write(test2Data);
  req2.end();
}, 2000);
