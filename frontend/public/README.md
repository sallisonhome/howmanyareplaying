# Google Search Console Verification

To verify your site with Google Search Console:

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property → URL prefix → `https://howmanyareplaying.com`
3. Choose **HTML file** verification method
4. Download the verification file (e.g., `google1234abcd5678.html`)
5. Place the file in this directory (`frontend/public/`)
6. Rebuild and redeploy the frontend:

   ```bash
   cd /opt/howmanyareplaying
   docker compose -f docker-compose.prod.yml build frontend
   docker compose -f docker-compose.prod.yml up -d --force-recreate frontend
   ```

7. Verify that `https://howmanyareplaying.com/google...html` serves the file
8. Click **Verify** in Search Console
9. Submit your sitemap: `https://howmanyareplaying.com/sitemap.xml`

Vite automatically copies everything in `public/` to the build output root, so any `.html` file placed here will be served at the site root.
