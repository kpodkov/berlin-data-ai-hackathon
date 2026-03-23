# Wealth Growth Calculator

Personal finance projection tool using real FRED economic data.
All calculations run in your browser — no data is sent anywhere.

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

- **Data**: Pre-extracted from Snowflake (FRED + ETF prices) as static JSON
- **Engine**: Pure TypeScript calculation functions (projection, debt, inflation, benchmarks)
- **UI**: React + Tailwind + Recharts with progressive disclosure (3 tiers)
- **Privacy**: Zero network calls after initial page load. User inputs in React state only.

## Data Refresh

To update the economic data:
```bash
cd scripts
python3 extract-fred.py
python3 build_etf_json.py
python3 build_benchmarks.py
```

Requires `snow sql -c hackathon` connection to Snowflake.
