"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const APIFY_TOKEN = process.env.APIFY_API_KEY || '';
const CEREBRAS_KEY = process.env.CEREBRAS_API_KEY || '';
// Proxy Apify
router.post('/apify/*', auth_1.requireAuth, (0, rbac_1.requireRole)(['execute']), async (req, res) => {
    try {
        const targetPath = req.params[0]; // e.g. v2/acts/xxx/run-sync-get-dataset-items
        const url = new URL(`https://api.apify.com/${targetPath}`);
        url.searchParams.set('token', APIFY_TOKEN);
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).send(err);
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Proxy Cerebras
router.post('/cerebras/*', auth_1.requireAuth, (0, rbac_1.requireRole)(['execute']), async (req, res) => {
    try {
        const targetPath = req.params[0];
        const url = `https://api.cerebras.ai/${targetPath}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CEREBRAS_KEY}`
            },
            body: JSON.stringify(req.body)
        });
        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).send(err);
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Proxy DuckDuckGo
router.get('/duckduckgo', auth_1.requireAuth, (0, rbac_1.requireRole)(['execute']), async (req, res) => {
    try {
        const searchParams = new URLSearchParams(req.query);
        const url = `https://api.duckduckgo.com/?${searchParams.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map