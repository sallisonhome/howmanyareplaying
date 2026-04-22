import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  const txt = `User-agent: *
Allow: /

Sitemap: https://howmanyareplaying.com/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(txt);
});

export default router;
