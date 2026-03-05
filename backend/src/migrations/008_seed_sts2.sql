-- Seed Slay the Spire 2 into wishlist_tracking so pollLive picks it up
-- on launch day before GetMostPlayedGames catches up.
INSERT INTO wishlist_tracking (appid, name)
VALUES (2868840, 'Slay the Spire 2')
ON CONFLICT (appid) DO NOTHING;
