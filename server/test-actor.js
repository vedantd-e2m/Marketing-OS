require('dotenv').config();

async function testHookAnalyzer() {
  const token = process.env.APIFY_API_KEY;
  if (!token) {
    console.error("No APIFY_API_KEY found in .env");
    return;
  }

  const inputs = [
    "https://www.instagram.com/p/DYB6Fs3AJUw/", // Image from user's logs
    "https://www.instagram.com/reel/C2-mG7RIn-s/" // Random popular reel
  ];

  console.log("Testing apify~instagram-scraper with URLs:", inputs);

  try {
    const res = await fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addParentData: false,
        directUrls: ["https://www.instagram.com/adidasfootball/"],
        enhanceUserSearchWithFacebookPage: false,
        isUserReelFeedURL: false,
        isUserTaggedFeedURL: false,
        resultsLimit: 2,
        resultsType: "posts",
        searchLimit: 1,
        searchType: "hashtag"
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Apify error:", res.status, err);
      return;
    }

    const data = await res.json();
    console.log("Data length:", data.length);
    if (data.length > 0) {
      console.log("Sample:", JSON.stringify(data[0], null, 2));
    } else {
      console.log("Returned 0 rows!");
    }
  } catch (err) {
    console.error("Crash:", err);
  }
}

testHookAnalyzer();
