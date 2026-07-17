# AI Marketing OS

An enterprise-grade, AI-driven Marketing Operating System built to automate competitor analysis, social media engagement tracking, and brand intelligence using large language models and real-time social scraping.

## 🚀 Features

- **Automated Competitor Analysis:** Automatically tracks and pulls top trending competitor reels/posts from platforms like Instagram using Apify.
- **AI-Powered Insights:** Deep analytics powered by the Cerebras Inference Engine (Gemma/Llama models) to generate actionable marketing intelligence from raw social data.
- **Brand Intelligence:** Enriches client and competitor data with brand assets, colors, and typography using the Brandfetch API.
- **Role-Based Dashboards:** Separate panels for Agency Admins (to manage campaigns and integrations) and Clients (to view unified analytics and insights).
- **Secure Architecture:** Built with a decoupled Vite frontend and Express proxy backend. No API keys are exposed to the browser.
- **Real-Time Database:** Powered by Supabase for instantaneous data synchronization and Row-Level Security (RLS).
- **Automated Reporting:** Generates and emails beautifully formatted marketing reports to clients using EmailJS.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React + TypeScript + Vite
- **Styling:** Vanilla CSS / Tailwind CSS (depending on configuration)
- **Charts:** Recharts for dynamic, theme-responsive data visualization
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js + Express
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Integrations:** Cerebras API
- **Scraping Engine:** Apify API (Instagram, Twitter, LinkedIn Scrapers)
- **Email Delivery:** EmailJS

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Git

You will also need accounts and API keys for:
- [Supabase](https://supabase.com) (Database and Auth)
- [Apify](https://apify.com) (Social Media Scraping)
- [Cerebras](https://cerebras.ai/) (AI Inference)
- [Brandfetch](https://brandfetch.com) (Brand context)
- [EmailJS](https://www.emailjs.com) (Automated emails)

---

## 🏗️ Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/vedantd-e2m/Marketing-OS.git
cd Marketing-OS
```

### 2. Setup the Backend
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add your keys:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Apify
APIFY_API_KEY=your_apify_key
APIFY_INSTAGRAM_SCRAPER_ACTOR_ID=apify/instagram-scraper
APIFY_COMPETITOR_REELS_ACTOR_ID=coregent/instagram-reel-hooks-competitor-analyzer

# Cerebras AI
CEREBRAS_API_KEY=your_cerebras_key
CEREBRAS_MODEL=gemma-4-31b

# Brandfetch
BRANDFETCH_API_KEY=your_brandfetch_key

# EmailJS (These will be dynamically sent to the frontend)
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup the Frontend
Navigate to the client directory and install dependencies:
```bash
cd ../client
npm install
```
*(Note: Do not create a `.env` file in the client directory. The frontend is designed to fetch public configurations securely from the backend on startup.)*

### 4. Run the Application
You need to run both the frontend and backend servers simultaneously.

**Start the Backend (Port 5000):**
```bash
cd server
npm start
```

**Start the Frontend (Port 5173):**
```bash
cd client
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📖 How to Use the System

1. **Authentication:** 
   Sign up or log in. The first user typically becomes the Admin (configured in your Supabase dashboard).
2. **Client Management:** 
   Navigate to the Admin Dashboard to create a new Client. Brandfetch will automatically pull the client's logos and brand identity.
3. **Campaign Creation:** 
   Create a new campaign for a client. If you input specific competitor URLs, the system will track them. If you leave it blank, the system will robustly fallback to scraping trending posts in the client's industry via hashtags.
4. **Data Syncing:** 
   Click "Sync Data" on a campaign. This triggers the Apify actors to scrape social media, runs the data through Cerebras AI for insights, and updates the Supabase database.
5. **Client View:** 
   Clients logging in will see a clean, restricted view of their specific campaigns, dark-mode compatible charts, and the AI-generated insights.

---

## 🚀 Deployment Strategy (Free Tier)

This project is configured for a split deployment.

### Backend (Render)
1. Push your repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Connect your repository, set the root directory to `server`.
4. Set Build Command to `npm install && npm run build` and Start Command to `npm start`.
5. Add all your `.env` variables in the Render dashboard.

### Frontend (Vercel)
1. Create a new **Project** on [Vercel](https://vercel.com).
2. Connect your repository and set the root directory to `client`.
3. Add a `vercel.json` file in the `client` directory to proxy API calls to your Render backend:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-render-url.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
4. Deploy the frontend. 

---

## 🛡️ Architecture & Security
- **Dynamic Config Loading:** The frontend contains absolutely no hardcoded API keys. It queries `/api/config` from the backend at startup to load the public Supabase Anon key and EmailJS config.
- **Row Level Security (RLS):** Database operations are protected by Supabase RLS, meaning clients can only ever access their own campaign data.

---

## 📝 License
This project is proprietary and intended for authorized agency use only.
