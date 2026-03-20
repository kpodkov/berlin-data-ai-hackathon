# Snow CLI & Programmatic Access

## Snow CLI

The [Snowflake CLI](https://docs.snowflake.com/en/developer-guide/snowflake-cli/index) (`snow`) lets you run queries from the terminal. This is how AI coding agents (Claude Code, Cursor, Copilot, etc.) execute Snowflake queries on your behalf.

### Install

```bash
# macOS
brew install snowflakecli

# pip (any platform)
pip install snowflake-cli
```

Verify: `snow --version`

### Configure

1. Copy the template config to your Snowflake config directory:

```bash
mkdir -p ~/.snowflake
cp platforms/snowflake/connections.toml ~/.snowflake/connections.toml
```

2. Edit `~/.snowflake/connections.toml` — fill in your email, password, and team number:

```toml
[hackathon]
account = "<ACCOUNT_ID>"
user = "you@example.com"
password = "your-password"
warehouse = "WH_TEAM_1_XS"
database = "DB_JW_SHARED"
schema = "CHALLENGE"
```

3. Test the connection:

```bash
snow sql -q "SELECT CURRENT_USER(), CURRENT_WAREHOUSE()" -c hackathon
```

### Usage

```bash
# Run a query
snow sql -q "SELECT COUNT(*) FROM T1" -c hackathon

# Use a bigger warehouse for heavy queries
snow sql -q "USE WAREHOUSE WH_TEAM_1_S; SELECT COUNT(*) FROM T3" -c hackathon

# JSON output (useful for wide tables or semi-structured data)
snow sql -q "SELECT * FROM PACKAGES LIMIT 5" -c hackathon --format json

# Run SQL from a file
snow sql -f my_query.sql -c hackathon

# Write results to team database
snow sql -q "USE DATABASE DB_TEAM_1; CREATE OR REPLACE TABLE analysis.results AS SELECT ..." -c hackathon
```

Since your connection config defaults to `DB_JW_SHARED.CHALLENGE`, you can reference tables without full paths (e.g. `T1` instead of `DB_JW_SHARED.CHALLENGE.T1`). Use full paths when querying across databases.

## Python

### snowflake-connector-python

```bash
pip install snowflake-connector-python pandas
```

```python
import snowflake.connector
import pandas as pd

conn = snowflake.connector.connect(
    account="<ACCOUNT_ID>",
    user="you@example.com",
    password="your-password",
    warehouse="WH_TEAM_1_XS",
    database="DB_JW_SHARED",
    schema="CHALLENGE",
)

# Query to DataFrame
cursor = conn.cursor()
cursor.execute("SELECT * FROM T1 LIMIT 1000")
df = cursor.fetch_pandas_all()

cursor.close()
conn.close()
```

### SQLAlchemy

```bash
pip install snowflake-sqlalchemy pandas
```

```python
from sqlalchemy import create_engine
import pandas as pd

engine = create_engine(
    "snowflake://you@example.com:your-password@<ACCOUNT_ID>/"
    "DB_JW_SHARED/CHALLENGE?warehouse=WH_TEAM_1_XS"
)

df = pd.read_sql("SELECT * FROM T1 LIMIT 1000", engine)
```

### Snowpark (DataFrames in Snowflake)

```bash
pip install snowflake-snowpark-python
```

```python
from snowflake.snowpark import Session

session = Session.builder.configs({
    "account": "<ACCOUNT_ID>",
    "user": "you@example.com",
    "password": "your-password",
    "warehouse": "WH_TEAM_1_XS",
    "database": "DB_JW_SHARED",
    "schema": "CHALLENGE",
}).create()

# Snowpark DataFrames — computation runs in Snowflake, not locally
df = session.table("T1").filter("se_category = 'clickout'").limit(1000)
df.show()

# Convert to pandas when needed
pandas_df = df.to_pandas()
```
