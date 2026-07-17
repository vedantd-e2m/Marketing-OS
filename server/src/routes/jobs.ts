import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Proxy Apify
router.post(/^\/apify\/(.*)/, requireAuth, requireRole(['execute']), async (req, res) => {
  try {
    const targetPath = req.params[0]; // e.g. v2/acts/xxx/run-sync-get-dataset-items
    const url = new URL(`https://api.apify.com/${targetPath}`);
    const apifyToken = process.env.APIFY_API_KEY || '';
    url.searchParams.set('token', apifyToken);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Apify proxy error: ${response.status} ${response.statusText}`, err);
      return res.status(response.status).send(err);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy Cerebras
router.post(/^\/cerebras\/(.*)/, requireAuth, requireRole(['execute']), async (req, res) => {
  try {
    const targetPath = req.params[0]; 
    const url = `https://api.cerebras.ai/${targetPath}`;

    const cerebrasKey = process.env.CEREBRAS_API_KEY || '';
    const cerebrasModel = process.env.CEREBRAS_MODEL || 'llama-3.1-8b';

    const reqBody = { ...req.body, model: cerebrasModel };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cerebrasKey}`
      },
      body: JSON.stringify(reqBody)
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).send(err);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy DuckDuckGo
router.get('/duckduckgo', requireAuth, requireRole(['execute']), async (req, res) => {
  try {
    const searchParams = new URLSearchParams(req.query as any);
    const url = `https://api.duckduckgo.com/?${searchParams.toString()}`;

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy Brandfetch
router.get(/^\/brandfetch\/(.*)/, requireAuth, async (req, res) => {
  try {
    const targetPath = req.params[0]; 
    const url = `https://api.brandfetch.io/${targetPath}`;

    const brandfetchKey = process.env.BRANDFETCH_API_KEY || process.env.VITE_BRANDFETCH_API_KEY || '';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${brandfetchKey}`
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).send(err);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
