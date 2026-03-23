USE DATABASE DB_TEAM_3;
USE WAREHOUSE WH_TEAM_3_XS;

-- === FRED_OBSERVATIONS ===
COMMENT ON TABLE RAW.FRED_OBSERVATIONS IS 'Federal Reserve Economic Data (FRED) time series observations. 31 series covering income, savings, debt, housing, CPI, interest rates, and market indicators. Source: FRED API.';
ALTER TABLE RAW.FRED_OBSERVATIONS ALTER COLUMN series_id COMMENT 'FRED series identifier (e.g. UNRATE, CPIAUCSL, MORTGAGE30US)';
ALTER TABLE RAW.FRED_OBSERVATIONS ALTER COLUMN obs_date COMMENT 'Observation date. Frequency varies by series: daily, weekly, monthly, quarterly, or annual.';
ALTER TABLE RAW.FRED_OBSERVATIONS ALTER COLUMN value COMMENT 'Observed value in native units (see FRED_SERIES_METADATA.units for unit description)';

-- === FRED_SERIES_METADATA ===
COMMENT ON TABLE RAW.FRED_SERIES_METADATA IS 'Metadata for FRED series in FRED_OBSERVATIONS. One row per series with title, units, frequency, and seasonal adjustment info.';
ALTER TABLE RAW.FRED_SERIES_METADATA ALTER COLUMN series_id COMMENT 'FRED series identifier. Joins to FRED_OBSERVATIONS.series_id.';
ALTER TABLE RAW.FRED_SERIES_METADATA ALTER COLUMN title COMMENT 'Official FRED series title (e.g. Consumer Price Index for All Urban Consumers)';
ALTER TABLE RAW.FRED_SERIES_METADATA ALTER COLUMN units COMMENT 'Unit of measurement (e.g. Percent, Billions of Dollars, Index 1982-1984=100)';
ALTER TABLE RAW.FRED_SERIES_METADATA ALTER COLUMN frequency COMMENT 'Publication frequency: Daily, Weekly, Monthly, Quarterly, or Annual';
ALTER TABLE RAW.FRED_SERIES_METADATA ALTER COLUMN seasonal_adjustment COMMENT 'Seasonal adjustment status (Seasonally Adjusted or Not Seasonally Adjusted)';
ALTER TABLE RAW.FRED_SERIES_METADATA ALTER COLUMN last_updated COMMENT 'Timestamp of the most recent data revision from FRED';
ALTER TABLE RAW.FRED_SERIES_METADATA ALTER COLUMN category COMMENT 'Personal finance category label assigned during ingestion';

-- === MARKET_PRICES ===
COMMENT ON TABLE RAW.MARKET_PRICES IS 'Daily closing prices for stocks, ETFs, and crypto from Yahoo Finance. 13 tickers including SPY, QQQ, AGG, BTC-USD, GLD, and international ETFs.';
ALTER TABLE RAW.MARKET_PRICES ALTER COLUMN series_id COMMENT 'Yahoo Finance ticker symbol (e.g. SPY, BTC-USD, GLD, DX-Y.NYB)';
ALTER TABLE RAW.MARKET_PRICES ALTER COLUMN obs_date COMMENT 'Trading date (market days only, no weekends or holidays)';
ALTER TABLE RAW.MARKET_PRICES ALTER COLUMN value COMMENT 'Adjusted closing price in USD (accounts for splits and dividends)';

-- === MARKET_METADATA ===
COMMENT ON TABLE RAW.MARKET_METADATA IS 'Metadata for tickers in MARKET_PRICES. One row per ticker with description and asset class.';
ALTER TABLE RAW.MARKET_METADATA ALTER COLUMN series_id COMMENT 'Yahoo Finance ticker symbol. Joins to MARKET_PRICES.series_id.';
ALTER TABLE RAW.MARKET_METADATA ALTER COLUMN title COMMENT 'Human-readable ticker description (e.g. S&P 500 ETF, Bitcoin USD)';
ALTER TABLE RAW.MARKET_METADATA ALTER COLUMN units COMMENT 'Price currency (USD)';
ALTER TABLE RAW.MARKET_METADATA ALTER COLUMN frequency COMMENT 'Data frequency (Daily)';
ALTER TABLE RAW.MARKET_METADATA ALTER COLUMN source COMMENT 'Data provider (Yahoo Finance)';

-- === WORLDBANK_INDICATORS ===
COMMENT ON TABLE RAW.WORLDBANK_INDICATORS IS 'World Bank development indicators for 15 countries (G7, BRICS, comparators). 10 indicators covering GDP, inflation, unemployment, savings, inequality, and remittances. Annual, 2000-2024.';
ALTER TABLE RAW.WORLDBANK_INDICATORS ALTER COLUMN series_id COMMENT 'Composite key: WorldBank indicator code underscore country ISO3 (e.g. FP.CPI.TOTL.ZG_USA, SI.POV.GINI_DEU)';
ALTER TABLE RAW.WORLDBANK_INDICATORS ALTER COLUMN obs_date COMMENT 'Observation year (January 1st of each year, annual frequency)';
ALTER TABLE RAW.WORLDBANK_INDICATORS ALTER COLUMN value COMMENT 'Indicator value in native units (see WORLDBANK_METADATA for unit description)';

-- === WORLDBANK_METADATA ===
COMMENT ON TABLE RAW.WORLDBANK_METADATA IS 'Metadata for World Bank indicator-country combinations in WORLDBANK_INDICATORS. One row per series_id.';
ALTER TABLE RAW.WORLDBANK_METADATA ALTER COLUMN series_id COMMENT 'Composite key: indicator_country. Joins to WORLDBANK_INDICATORS.series_id.';
ALTER TABLE RAW.WORLDBANK_METADATA ALTER COLUMN title COMMENT 'Indicator description with country suffix (e.g. Inflation Rate CPI annual pct - USA)';
ALTER TABLE RAW.WORLDBANK_METADATA ALTER COLUMN units COMMENT 'Unit of measurement extracted from indicator title (e.g. pct, current USD, index)';
ALTER TABLE RAW.WORLDBANK_METADATA ALTER COLUMN frequency COMMENT 'Data frequency (Annual)';
ALTER TABLE RAW.WORLDBANK_METADATA ALTER COLUMN source COMMENT 'Data provider (World Bank)';
