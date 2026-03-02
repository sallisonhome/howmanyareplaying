CREATE TABLE IF NOT EXISTS rank_history (
  appid         INTEGER  NOT NULL REFERENCES games(appid) ON DELETE CASCADE,
  recorded_date DATE     NOT NULL,
  rank          SMALLINT NOT NULL,
  PRIMARY KEY (appid, recorded_date)
);
CREATE INDEX IF NOT EXISTS rank_history_appid_date
  ON rank_history(appid, recorded_date DESC);
