import streamlit as st
import pandas as pd
import snowflake.connector
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

st.set_page_config(page_title="Personal Finance Advisor", layout="wide", initial_sidebar_state="expanded")


@st.cache_resource
def get_connection():
    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT", "OHHGHHL-ZM06890"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        database="DB_TEAM_3",
        warehouse="WH_TEAM_3_XS",
    )


@st.cache_data(ttl=300)
def query(sql):
    conn = get_connection()
    return pd.read_sql(sql, conn)


# Load advisor summaries
summaries = query("SELECT topic, summary_text FROM DB_TEAM_3.INSIGHTS.ADVISOR_SUMMARIES")
summary_map = dict(zip(summaries['TOPIC'], summaries['SUMMARY_TEXT']))

# ── SIDEBAR: User Profile ──────────────────────────────────
with st.sidebar:
    st.header("Your Profile")
    st.caption("Tell us about yourself for personalized advice")

    with st.form("user_profile", border=False):
        user_age = st.number_input("Age", min_value=18, max_value=85, value=30, step=1)
        user_salary_monthly = st.number_input("Monthly Salary (€)", min_value=0, max_value=100_000, value=5_000, step=500)
        user_rent = st.number_input("Monthly Rent/Housing (€)", min_value=0, max_value=20_000, value=1_500, step=100)
        user_total_savings = st.number_input("Total Savings (€)", min_value=0, max_value=10_000_000, value=15_000, step=1_000, help="Emergency fund + bank accounts + investments")
        user_monthly_savings = st.number_input("Monthly Savings (€)", min_value=0, max_value=50_000, value=500, step=100)

        st.markdown("**Debt**")
        user_mortgage = st.number_input("Mortgage Balance (€)", min_value=0, max_value=2_000_000, value=0, step=10_000)
        user_mortgage_payment = st.number_input("Monthly Mortgage Payment (€)", min_value=0, max_value=20_000, value=0, step=100)
        user_cc_debt = st.number_input("Credit Card Debt (€)", min_value=0, max_value=200_000, value=0, step=500)
        user_other_debt = st.number_input("Other Debt (€)", min_value=0, max_value=500_000, value=0, step=1_000, help="Student loans, auto loans, personal loans")

        st.markdown("**Goals**")
        user_invest_style = st.selectbox("Investment Style", ["Conservative", "Moderate", "Aggressive", "Not sure"])
        user_goal = st.selectbox("Primary Financial Goal", [
            "Build emergency fund",
            "Buy a home",
            "Pay off debt",
            "Save for retirement",
            "Grow investments",
            "Reduce expenses",
        ])
        profile_submitted = st.form_submit_button("Update Profile", use_container_width=True)

    if profile_submitted:
        st.session_state.profile_updated = True

    # Compute derived metrics
    monthly_income = user_salary_monthly
    annual_salary = user_salary_monthly * 12
    savings_rate_user = round(user_monthly_savings / monthly_income * 100, 1) if monthly_income > 0 else 0
    housing_pct = round((user_rent + user_mortgage_payment) / monthly_income * 100, 1) if monthly_income > 0 else 0
    annual_savings = user_monthly_savings * 12
    total_debt = user_mortgage + user_cc_debt + user_other_debt
    debt_to_income = round(total_debt / annual_salary * 100, 1) if annual_salary > 0 else 0
    monthly_expenses = user_rent + user_mortgage_payment + 500  # rough essential expenses
    months_emergency = round(user_total_savings / monthly_expenses, 1) if monthly_expenses > 0 else 0
    net_worth = user_total_savings - user_cc_debt - user_other_debt  # exclude mortgage from net worth calc

    # Show derived stats
    st.divider()
    st.subheader("Your Numbers")
    st.metric("Savings Rate", f"{savings_rate_user}%")
    st.metric("Housing % of Income", f"{housing_pct}%")
    st.metric("Emergency Fund", f"{months_emergency:.0f} months")
    st.metric("Total Debt", f"€{total_debt:,}")
    st.metric("Net Worth", f"€{net_worth:,}")

    # Health score via simple rules
    score = 100
    flags = []
    if savings_rate_user < 10:
        score -= 15
        flags.append("Savings rate below 10%")
    if savings_rate_user < 5:
        score -= 10
        flags.append("Savings rate critically low")
    if housing_pct > 30:
        score -= 15
        flags.append("Housing costs above 30% of income")
    if housing_pct > 50:
        score -= 10
        flags.append("Housing costs above 50%")
    if user_cc_debt > 0:
        score -= 15
        flags.append(f"Credit card debt: €{user_cc_debt:,}")
    if user_cc_debt > monthly_income * 3:
        score -= 10
        flags.append("CC debt exceeds 3 months income")
    if debt_to_income > 40:
        score -= 15
        flags.append("Debt-to-income above 40%")
    elif debt_to_income > 20:
        score -= 10
        flags.append("Debt-to-income above 20%")
    if months_emergency < 3:
        score -= 15
        flags.append("Less than 3 months emergency fund")
    if months_emergency < 1:
        score -= 10
        flags.append("Less than 1 month emergency fund")
    score = max(score, 0)

    st.divider()
    if score >= 80:
        st.success(f"Financial Health Score: {score}/100")
    elif score >= 50:
        st.warning(f"Financial Health Score: {score}/100")
    else:
        st.error(f"Financial Health Score: {score}/100")

    if flags:
        for flag in flags:
            st.caption(f"  - {flag}")


def get_user_profile_context():
    """Build a text summary of the user's financial profile."""
    return f"""USER'S PERSONAL FINANCIAL PROFILE:
- Age: {user_age}
- Monthly salary: €{monthly_income:,.0f}
- Annual salary: €{annual_salary:,.0f}
- Monthly rent/housing cost: €{user_rent:,} ({housing_pct}% of income including mortgage)
- Total savings: €{user_total_savings:,}
- Monthly savings: €{user_monthly_savings:,} ({savings_rate_user}% savings rate)
- Annual savings: €{annual_savings:,}
- Emergency fund coverage: {months_emergency:.0f} months of expenses
- Mortgage balance: €{user_mortgage:,} (monthly payment: €{user_mortgage_payment:,})
- Credit card debt: €{user_cc_debt:,}
- Other debt (student/auto/personal): €{user_other_debt:,}
- Total debt: €{total_debt:,}
- Debt-to-income ratio: {debt_to_income}%
- Estimated net worth: €{net_worth:,}
- Investment style: {user_invest_style}
- Primary goal: {user_goal}
- Financial health score: {score}/100"""

# Helper: call Cortex LLM
def ask_cortex(prompt):
    """Call Snowflake Cortex LLM and return the response text."""
    conn = get_connection()
    cursor = conn.cursor()
    escaped = prompt.replace("'", "''")
    cursor.execute(f"SELECT SNOWFLAKE.CORTEX.COMPLETE('llama3.1-8b', '{escaped}')")
    result = cursor.fetchone()[0]
    cursor.close()
    return result


# Tabs
tab_overview, tab_inflation, tab_housing, tab_savings, tab_debt, tab_invest, tab_global, tab_chat = st.tabs(
    ["Overview", "Inflation", "Housing", "Savings", "Debt", "Investments", "Global", "Ask Advisor"]
)

# === OVERVIEW TAB ===
with tab_overview:
    st.title("Personal Finance Advisor")
    st.info(summary_map.get('headline', ''))

    # Load latest snapshot
    snapshot = query("SELECT * FROM DB_TEAM_3.INSIGHTS.ADVISOR_CURRENT_SNAPSHOT")

    col1, col2, col3 = st.columns(3)
    col1.metric("Inflation", f"{snapshot['CPI_ALL_YOY'].iloc[0]:.1f}%")
    col2.metric("Mortgage Rate", f"{snapshot['HOUSING_MORTGAGE_RATE'].iloc[0]:.2f}%")
    col3.metric("Savings Rate", f"{snapshot['SAVINGS_RATE'].iloc[0]:.1f}%")

    col4, col5, col6 = st.columns(3)
    col4.metric("Credit Card Rate", f"{snapshot['CREDIT_CARD_RATE'].iloc[0]:.1f}%")
    col5.metric("S&P 500 (12M)", f"{snapshot['SPY_12M_RETURN'].iloc[0]:.1f}%")
    col6.metric("Debt Service Ratio", f"{snapshot['DEBT_SERVICE_RATIO'].iloc[0]:.1f}%")

    # Personalized comparison
    st.divider()
    st.subheader("How You Compare")
    nat_savings = snapshot['SAVINGS_RATE'].iloc[0]
    comp1, comp2, comp3 = st.columns(3)
    comp1.metric(
        "Your Savings Rate",
        f"{savings_rate_user}%",
        delta=f"{savings_rate_user - float(nat_savings):.1f}% vs national avg" if nat_savings else None,
    )
    comp2.metric(
        "Your Housing Cost",
        f"{housing_pct}% of income",
        delta=f"{'Over' if housing_pct > 30 else 'Under'} 30% guideline",
        delta_color="inverse",
    )
    comp3.metric(
        "Annual Savings",
        f"€{annual_savings:,}",
        delta=f"{savings_rate_user}% of income",
    )

# === INFLATION TAB ===
with tab_inflation:
    st.header("Inflation Impact")
    st.info(summary_map.get('inflation', ''))

    df = query(
        "SELECT obs_month, cpi_all_yoy, cpi_food_yoy, cpi_energy_yoy, cpi_medical_yoy,"
        " cpi_education_yoy, cpi_transportation_yoy, cpi_rent_yoy, purchasing_power_index"
        " FROM DB_TEAM_3.MARTS.MART_INFLATION_IMPACT"
        " WHERE obs_month >= '2019-01-01'"
        " ORDER BY obs_month"
    )

    melt_cols = ['CPI_ALL_YOY', 'CPI_FOOD_YOY', 'CPI_ENERGY_YOY', 'CPI_MEDICAL_YOY', 'CPI_RENT_YOY']
    df_melt = df.melt(id_vars=['OBS_MONTH'], value_vars=melt_cols, var_name='Category', value_name='YoY %')
    df_melt['Category'] = df_melt['Category'].str.replace('CPI_', '').str.replace('_YOY', '').str.title()
    fig = px.line(
        df_melt, x='OBS_MONTH', y='YoY %', color='Category',
        title='CPI Year-over-Year Change by Category',
    )
    fig.update_layout(xaxis_title='', yaxis_title='YoY Change (%)', hovermode='x unified')
    st.plotly_chart(fig, use_container_width=True)

    fig2 = px.area(df, x='OBS_MONTH', y='PURCHASING_POWER_INDEX', title='Purchasing Power of $1 (Index)')
    fig2.update_layout(xaxis_title='', yaxis_title='Index (100 = baseline)')
    st.plotly_chart(fig2, use_container_width=True)

# === HOUSING TAB ===
with tab_housing:
    st.header("Housing Affordability")
    st.info(summary_map.get('housing', ''))

    df = query(
        "SELECT obs_month, median_home_price, mortgage_rate, monthly_mortgage_payment,"
        " home_price_to_income_ratio, mortgage_pct_of_income"
        " FROM DB_TEAM_3.MARTS.MART_HOUSING_AFFORDABILITY"
        " WHERE obs_month >= '2000-01-01' AND median_home_price IS NOT NULL"
        " ORDER BY obs_month"
    )

    col1, col2, col3 = st.columns(3)
    latest = df.iloc[-1]
    col1.metric("Median Home Price", f"${latest['MEDIAN_HOME_PRICE']:,.0f}")
    col2.metric("Monthly Payment", f"${latest['MONTHLY_MORTGAGE_PAYMENT']:,.0f}")
    col3.metric("Price/Income Ratio", f"{latest['HOME_PRICE_TO_INCOME_RATIO']:.1f}x")

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df['OBS_MONTH'], y=df['MEDIAN_HOME_PRICE'], name='Median Home Price', yaxis='y'))
    fig.add_trace(go.Scatter(
        x=df['OBS_MONTH'], y=df['MORTGAGE_RATE'], name='Mortgage Rate %',
        yaxis='y2', line=dict(dash='dash'),
    ))
    fig.update_layout(
        title='Home Prices vs Mortgage Rates',
        yaxis=dict(title='Home Price ($)', side='left'),
        yaxis2=dict(title='Mortgage Rate (%)', side='right', overlaying='y'),
        hovermode='x unified',
    )
    st.plotly_chart(fig, use_container_width=True)

    fig2 = px.line(df, x='OBS_MONTH', y='MORTGAGE_PCT_OF_INCOME', title='Mortgage Payment as % of Median Income')
    fig2.add_hline(y=28, line_dash="dash", line_color="red", annotation_text="28% guideline")
    fig2.update_layout(xaxis_title='', yaxis_title='% of Income')
    st.plotly_chart(fig2, use_container_width=True)

# === SAVINGS TAB ===
with tab_savings:
    st.header("Savings Health")
    st.info(summary_map.get('savings', ''))

    df = query(
        "SELECT obs_month, savings_rate, fed_funds_rate, treasury_10y, cpi_yoy,"
        " real_fed_funds, real_treasury_10y"
        " FROM DB_TEAM_3.MARTS.MART_SAVINGS_HEALTH"
        " WHERE obs_month >= '2000-01-01'"
        " ORDER BY obs_month"
    )

    fig = px.line(df, x='OBS_MONTH', y='SAVINGS_RATE', title='Personal Savings Rate')
    fig.update_layout(xaxis_title='', yaxis_title='Savings Rate (%)')
    st.plotly_chart(fig, use_container_width=True)

    fig2 = go.Figure()
    fig2.add_trace(go.Scatter(x=df['OBS_MONTH'], y=df['REAL_FED_FUNDS'], name='Real Fed Funds Rate'))
    fig2.add_trace(go.Scatter(x=df['OBS_MONTH'], y=df['REAL_TREASURY_10Y'], name='Real 10Y Treasury'))
    fig2.add_hline(y=0, line_dash="dash", line_color="gray")
    fig2.update_layout(
        title='Real Interest Rates (After Inflation)',
        xaxis_title='', yaxis_title='Real Rate (%)', hovermode='x unified',
    )
    st.plotly_chart(fig2, use_container_width=True)

# === DEBT TAB ===
with tab_debt:
    st.header("Debt Burden")
    st.info(summary_map.get('debt', ''))

    df = query(
        "SELECT obs_month, mortgage_rate, credit_card_rate, fed_funds_rate,"
        " debt_service_ratio, total_credit, revolving_credit, nonrevolving_credit"
        " FROM DB_TEAM_3.MARTS.MART_DEBT_BURDEN"
        " WHERE obs_month >= '2000-01-01'"
        " ORDER BY obs_month"
    )

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df['OBS_MONTH'], y=df['CREDIT_CARD_RATE'], name='Credit Card Rate'))
    fig.add_trace(go.Scatter(x=df['OBS_MONTH'], y=df['MORTGAGE_RATE'], name='Mortgage Rate'))
    fig.add_trace(go.Scatter(x=df['OBS_MONTH'], y=df['FED_FUNDS_RATE'], name='Fed Funds Rate'))
    fig.update_layout(
        title='Interest Rates Comparison',
        xaxis_title='', yaxis_title='Rate (%)', hovermode='x unified',
    )
    st.plotly_chart(fig, use_container_width=True)

    fig2 = px.line(df, x='OBS_MONTH', y='DEBT_SERVICE_RATIO', title='Household Debt Service Ratio')
    fig2.update_layout(xaxis_title='', yaxis_title='% of Disposable Income')
    st.plotly_chart(fig2, use_container_width=True)

    df_credit = df[df['REVOLVING_CREDIT'].notna()]
    fig3 = go.Figure()
    fig3.add_trace(go.Scatter(
        x=df_credit['OBS_MONTH'], y=df_credit['REVOLVING_CREDIT'],
        name='Revolving (Credit Cards)', stackgroup='one',
    ))
    fig3.add_trace(go.Scatter(
        x=df_credit['OBS_MONTH'], y=df_credit['NONREVOLVING_CREDIT'],
        name='Non-Revolving (Auto, Student)', stackgroup='one',
    ))
    fig3.update_layout(
        title='Total Consumer Credit (Billions $)',
        xaxis_title='', yaxis_title='Billions $', hovermode='x unified',
    )
    st.plotly_chart(fig3, use_container_width=True)

# === INVESTMENTS TAB ===
with tab_invest:
    st.header("Investment Performance")
    st.info(summary_map.get('investments', ''))

    df = query(
        "SELECT series_id, title, asset_class, month_key, cumulative_return_pct,"
        " rolling_12m_return_pct, drawdown_pct, vix_monthly_avg"
        " FROM DB_TEAM_3.MARTS.MART_INVESTMENT_PERFORMANCE"
        " WHERE series_id IN ('SPY', 'AGG', 'GLD', 'BTC-USD', 'VNQ')"
        " AND month_key >= '2016-01-01'"
        " ORDER BY month_key"
    )

    fig = px.line(
        df, x='MONTH_KEY', y='CUMULATIVE_RETURN_PCT', color='SERIES_ID',
        title='Cumulative Returns by Asset',
    )
    fig.update_layout(xaxis_title='', yaxis_title='Cumulative Return (%)', hovermode='x unified')
    st.plotly_chart(fig, use_container_width=True)

    fig2 = px.line(
        df, x='MONTH_KEY', y='DRAWDOWN_PCT', color='SERIES_ID',
        title='Drawdowns from Peak',
    )
    fig2.update_layout(xaxis_title='', yaxis_title='Drawdown (%)', hovermode='x unified')
    st.plotly_chart(fig2, use_container_width=True)

    vix = df[df['SERIES_ID'] == 'SPY'][['MONTH_KEY', 'VIX_MONTHLY_AVG']].drop_duplicates()
    fig3 = px.area(vix, x='MONTH_KEY', y='VIX_MONTHLY_AVG', title='VIX Fear Gauge')
    fig3.add_hline(y=20, line_dash="dash", line_color="orange", annotation_text="Normal threshold")
    fig3.update_layout(xaxis_title='', yaxis_title='VIX')
    st.plotly_chart(fig3, use_container_width=True)

# === GLOBAL TAB ===
with tab_global:
    st.header("Global Comparison")
    st.info(summary_map.get('global', ''))

    df = query(
        "SELECT * FROM DB_TEAM_3.MARTS.MART_GLOBAL_COMPARISON"
        " WHERE obs_year = ("
        "   SELECT MAX(obs_year) FROM DB_TEAM_3.MARTS.MART_GLOBAL_COMPARISON"
        "   WHERE gdp_per_capita IS NOT NULL AND country_code = 'USA'"
        " )"
        " ORDER BY gdp_per_capita DESC NULLS LAST"
    )

    fig = px.bar(
        df, x='GDP_PER_CAPITA', y='COUNTRY_NAME', orientation='h',
        title='GDP per Capita (PPP, USD)',
        color='GDP_PER_CAPITA', color_continuous_scale='Viridis',
    )
    fig.update_layout(yaxis=dict(autorange='reversed'), xaxis_title='USD', yaxis_title='')
    st.plotly_chart(fig, use_container_width=True)

    df_scatter = df[df['GINI_INDEX'].notna()]
    if not df_scatter.empty:
        fig2 = px.scatter(
            df_scatter, x='GDP_PER_CAPITA', y='GINI_INDEX', text='COUNTRY_CODE',
            size='LIFE_EXPECTANCY', title='Wealth vs Inequality',
            labels={
                'GDP_PER_CAPITA': 'GDP per Capita (USD)',
                'GINI_INDEX': 'Gini Index (higher = more unequal)',
            },
        )
        fig2.update_traces(textposition='top center')
        st.plotly_chart(fig2, use_container_width=True)

    st.subheader("Full Country Comparison")
    display_cols = [
        'COUNTRY_NAME', 'GDP_PER_CAPITA', 'INFLATION_RATE',
        'UNEMPLOYMENT_RATE', 'SAVINGS_RATE', 'GINI_INDEX', 'LIFE_EXPECTANCY',
    ]
    st.dataframe(df[display_cols].set_index('COUNTRY_NAME'), use_container_width=True)

# === ASK ADVISOR TAB ===
with tab_chat:
    st.header("Ask Your Personal Finance Advisor")
    st.caption("Powered by Snowflake Cortex AI with real economic data")

    # Auto-generated personal finance summary
    @st.cache_data(ttl=600, show_spinner=False)
    def get_personal_summary(_profile_key):
        """Generate a personalized finance summary via Cortex. Cached by profile."""
        profile_ctx = get_user_profile_context()
        prompt = f"""You are a friendly personal finance advisor. Based on this person's profile and current economic conditions, write a personalized financial summary.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

**Your Financial Snapshot**

**Strengths:**
- [1-2 bullet points about what they are doing well]

**Watch Out:**
- [1-2 bullet points about areas of concern]

**Top 3 Action Items:**
1. [Most important action based on their goal and situation]
2. [Second priority]
3. [Third priority]

RULES:
- Use their specific numbers (salary, savings, debt)
- Compare to national averages where relevant
- Tailor to their age, goal, and investment style
- Be encouraging but honest
- Keep each bullet point to 1 sentence

{profile_ctx}

Current economic conditions:
- Inflation: running around 2.7% annually
- Mortgage rates: around 6%
- Credit card rates: around 21%
- S&P 500 trailing 12-month return: around 17%
- National savings rate: around 4.5%"""

        return ask_cortex(prompt)

    # Build a cache key from profile inputs
    profile_key = f"{user_age}_{user_salary_monthly}_{user_rent}_{user_total_savings}_{user_monthly_savings}_{user_mortgage}_{user_mortgage_payment}_{user_cc_debt}_{user_other_debt}_{user_invest_style}_{user_goal}"

    # Clear cache when profile is updated
    if st.session_state.get("profile_updated"):
        get_personal_summary.clear()
        st.session_state.profile_updated = False

    with st.spinner("Generating your personalized summary..."):
        personal_summary = get_personal_summary(profile_key)
    with st.expander("Your Personalized Finance Summary", expanded=True):
        st.markdown(personal_summary)
        st.caption("_Update your profile in the sidebar to refresh this summary._")

    st.divider()

    # Load all current data for context
    @st.cache_data(ttl=300)
    def get_advisor_context():
        snapshot = query("SELECT * FROM DB_TEAM_3.INSIGHTS.ADVISOR_CURRENT_SNAPSHOT")
        row = snapshot.iloc[0]

        def fmt(val, fmt_str=""):
            if val is None or pd.isna(val):
                return "N/A"
            if fmt_str:
                return format(val, fmt_str)
            return str(val)

        context = f"""Current US Economic Data (latest available):

INFLATION:
- Overall inflation: {fmt(row.get('CPI_ALL_YOY'))}% year-over-year
- Food inflation: {fmt(row.get('CPI_FOOD_YOY'))}% YoY
- Energy inflation: {fmt(row.get('CPI_ENERGY_YOY'))}% YoY
- Medical inflation: {fmt(row.get('CPI_MEDICAL_YOY'))}% YoY
- Rent inflation: {fmt(row.get('CPI_RENT_YOY'))}% YoY
- Purchasing power index: {fmt(row.get('PURCHASING_POWER_INDEX'))} (100 = baseline)

HOUSING:
- Median home price: ${fmt(row.get('MEDIAN_HOME_PRICE'), ',.0f')}
- 30-year mortgage rate: {fmt(row.get('HOUSING_MORTGAGE_RATE'))}%
- Monthly mortgage payment (20% down): ${fmt(row.get('MONTHLY_MORTGAGE_PAYMENT'), ',.0f')}
- Home price to income ratio: {fmt(row.get('HOME_PRICE_TO_INCOME_RATIO'))}x
- Mortgage as % of median income: {fmt(row.get('MORTGAGE_PCT_OF_INCOME'))}%

SAVINGS:
- Personal savings rate: {fmt(row.get('SAVINGS_RATE'))}%
- Fed funds rate: {fmt(row.get('FED_FUNDS_RATE'))}%
- Real return on savings (after inflation): {fmt(row.get('REAL_FED_FUNDS'))}%
- Real 10-year Treasury yield: {fmt(row.get('REAL_TREASURY_10Y'))}%

DEBT:
- Credit card interest rate: {fmt(row.get('CREDIT_CARD_RATE'))}%
- Credit card spread over fed rate: {fmt(row.get('CREDIT_CARD_SPREAD'))} points
- Household debt service ratio: {fmt(row.get('DEBT_SERVICE_RATIO'))}%
- Consumer credit growth: {fmt(row.get('TOTAL_CREDIT_YOY'))}% YoY

INVESTMENTS:
- S&P 500 trailing 12-month return: {fmt(row.get('SPY_12M_RETURN'))}%
- Bond index (AGG) 12-month return: {fmt(row.get('AGG_12M_RETURN'))}%
- Gold 12-month return: {fmt(row.get('GLD_12M_RETURN'))}%
- Bitcoin 12-month return: {fmt(row.get('BTC_12M_RETURN'))}%
- VIX (volatility/fear gauge): {fmt(row.get('VIX_LATEST'))}

GLOBAL (US):
- GDP per capita (PPP): ${fmt(row.get('GDP_PER_CAPITA'), ',.0f')}
- Gini index (inequality): {fmt(row.get('GINI_INDEX'))}
- Gross savings rate: {fmt(row.get('GLOBAL_US_SAVINGS'))}%"""
        return context

    data_context = get_advisor_context()

    # Initialize chat history and pending question
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "pending_question" not in st.session_state:
        st.session_state.pending_question = None

    user_profile_context = get_user_profile_context()

    def process_question(question):
        """Send a question to Cortex and append both Q&A to chat history."""
        st.session_state.messages.append({"role": "user", "content": question})

        system_prompt = f"""You are a friendly, knowledgeable personal finance advisor speaking to a regular person (not a financial expert).

You know TWO things about this person:
1. Their personal financial profile (from the sidebar)
2. Current US economic data (from real government sources)

RULES:
- Use plain English, no jargon
- ALWAYS reference the user's specific numbers (their salary, savings, debt, age) alongside the national data
- Compare their situation to national averages (e.g. "Your savings rate of X% is above/below the national average of Y%")
- Tailor advice to their age, income level, goal, and investment style
- Give practical, actionable next steps specific to their situation
- Keep responses to 5-8 sentences
- End with a disclaimer that this is educational, not personalized financial advice

{user_profile_context}

{data_context}

The user asks: {question}

Provide personalized, data-backed financial guidance tailored to this specific person:"""

        response = ask_cortex(system_prompt)
        st.session_state.messages.append({"role": "assistant", "content": response})

    # Text input + send button — always at top
    input_col, btn_col = st.columns([5, 1])
    with input_col:
        user_question = st.text_input(
            "Ask your personal finance question",
            placeholder="e.g. Should I buy a house or keep renting?",
            key="chat_input",
            label_visibility="collapsed",
        )
    with btn_col:
        send_clicked = st.button("Ask", use_container_width=True, type="primary")

    # Example questions
    st.markdown("**Or try one of these:**")
    examples = [
        "Should I buy a house or keep renting?",
        "Is now a good time to invest in stocks?",
        "How is inflation affecting my purchasing power?",
        "I have credit card debt. What should I prioritize?",
        "How much should I be saving each month?",
        "How does the US economy compare to Europe?",
    ]
    example_cols = st.columns(3)
    for i, ex in enumerate(examples):
        col = example_cols[i % 3]
        if col.button(ex, key=f"example_{i}", use_container_width=True):
            st.session_state.pending_question = ex
            st.rerun()

    st.divider()

    # Process: either typed question or button click
    question_to_process = None
    if send_clicked and user_question:
        question_to_process = user_question
    elif st.session_state.pending_question:
        question_to_process = st.session_state.pending_question
        st.session_state.pending_question = None

    if question_to_process:
        with st.spinner("Analyzing your question with real economic data..."):
            process_question(question_to_process)
        st.rerun()

    # Display chat history — latest pair first, question before answer
    # Messages are stored as [user, assistant, user, assistant, ...]
    # Group into pairs and reverse the pairs
    messages = st.session_state.messages
    pairs = []
    for i in range(0, len(messages) - 1, 2):
        pairs.append((messages[i], messages[i + 1]))
    # Handle odd message (question without answer yet)
    if len(messages) % 2 == 1:
        pairs.append((messages[-1],))

    for pair in reversed(pairs):
        for message in pair:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
                if message["role"] == "assistant":
                    st.caption("_This is educational information based on public economic data, not personalized financial advice._")
