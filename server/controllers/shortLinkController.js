import ShortLink from '../models/ShortLink.js';
import crypto from 'crypto';

const generateCode = (len = 6) => {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
};

export const createShortLink = async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, message: 'url is required' });
    try { new URL(url); } catch (e) { return res.status(400).json({ success: false, message: 'invalid url' }); }

    // optional: created_by from auth
    const created_by = req.userId || null;

    let code = generateCode(7);
    // ensure unique
    while (await ShortLink.findOne({ code })) {
      code = generateCode(7);
    }

    const entry = await ShortLink.create({ code, url, created_by });

    // Return full masked URL using host from env or default
    const host = process.env.SHORTLINK_HOST || `${req.protocol}://${req.get('host')}`;
    const shortUrl = `${host}/r/${code}`;

    res.json({ success: true, shortUrl, code, entry });
  } catch (e) {
    console.error('createShortLink error', e);
    res.status(500).json({ success: false, message: 'Failed to create shortlink' });
  }
};

export const redirectShortLink = async (req, res) => {
  try {
    const { code } = req.params;
    const entry = await ShortLink.findOne({ code });
    if (!entry) return res.status(404).send('Not found');
    entry.clicks = (entry.clicks || 0) + 1;
    await entry.save();
    return res.redirect(entry.url);
  } catch (e) {
    console.error('redirectShortLink error', e);
    return res.status(500).send('Server error');
  }
};
