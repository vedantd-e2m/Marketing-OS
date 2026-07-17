const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const token = process.env.APIFY_API_KEY;
if (!token) {
  console.error("No APIFY_API_KEY found");
  process.exit(1);
}

async function test() {
  console.log("Starting scrape test...");
  const actorId = "apify~instagram-scraper";
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
  
  const reqBody = {
    addParentData: false,
    directUrls: ["https://www.instagram.com/adidas/"],
    enhanceUserSearchWithFacebookPage: false,
    isUserReelFeedURL: false,
    isUserTaggedFeedURL: false,
    resultsLimit: 2,
    resultsType: "posts",
    searchLimit: 1,
    searchType: "hashtag"
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody)
    });
    
    console.log("Status:", res.status);
    if (!res.ok) {
      console.log("Error:", await res.text());
      return;
    }
    const data = await res.json();
    console.log("Data length:", data.length);
    if (data.length > 0) {
      console.log("Sample keys:", Object.keys(data[0]));
      console.log("Likes:", data[0].likesCount);
      console.log("Comments:", data[0].commentsCount);
      console.log(data[0]);
    }
  } catch (err) {
    console.error(err);
  }
}

test();

