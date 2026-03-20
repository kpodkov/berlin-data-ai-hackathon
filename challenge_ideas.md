# Challenge Ideas

These are starting points — not requirements. You're absolutely encouraged to come up with your own ideas and implementations. The best hacks often come from a question nobody asked.

---

## 1. Streaming Charts

JustWatch publishes [Streaming Charts](https://www.justwatch.com/de/Streaming-Charts) — weekly and monthly popularity rankings of movies and shows per country. This is a real product, widely cited by press and studios.

You have the raw signals to build your own version from scratch.

**The challenge:**
- Build weekly and monthly popularity charts, per country, separated by movies and shows (they have fundamentally different interaction and consumption patterns — don't mix them)
- Define a scoring model: how do you weight different signals? Is a clickout worth more than a watchlist add? Is a title click worth more than a page view?
- Data quality is critical: you'll need to detect and filter bot traffic, anomalous users, and noisy events before your chart is reliable
- Produce multiple chart flavours: by country, globally, by genre
- Track velocity: which titles are rising vs falling week over week?

**Why movies and shows are separate:** A movie gets a burst of clicks around release, then fades. A show accumulates engagement across seasons over months. Mixing them in one chart always favours one pattern over the other.

---

## 2. Content Similarity & Discovery

Given a title, what are the most similar titles — and can you visualise the content landscape?

**The challenge:**
- Build a similarity model using behavioural signals (users who interacted with title A also interacted with title B) and/or content features (genre, cast, language, IMDB score)
- Visualise the title space as a cluster map — group titles by similarity, see which clusters emerge naturally
- Given a seed title, return the top N most similar titles with an explanation of why
- Explore using Snowflake Cortex embeddings on title descriptions for semantic similarity

**Possible outputs:** An interactive cluster visualisation. A recommendation API. A "title DNA" profile.

---

## 3. Streaming Wars — Provider Competition Profile

Every clickout is a signal of purchase intent directed at a specific streaming provider. That's data streaming companies pay serious money for.

**The challenge:**
- Build a provider competition dashboard: market share by country, by genre, by monetization type
- Analyse the state of the streaming wars: who's winning in Germany vs France vs the US?
- Compare subscription (SVOD) vs ad-supported (AVOD) vs transactional (TVOD) — see [monetization types reference](events_library.md#monetization-types) for what these mean
- Track provider momentum: which services are gaining or losing share over the 2–3 month period?

**Why this matters:** JustWatch is the largest source of streaming intent data globally. This is the kind of analysis that appears in industry reports.

---

## 4. Holiday Season Viewing Patterns

The data covers November 2025 – January 2026 — Black Friday streaming deals, Christmas releases, New Year binge-watching season.

**The challenge:**
- Detect the "Christmas effect": how do viewing patterns change during the holiday period?
- Do content preferences shift? (more family content, more movies vs shows, different genres?)
- Compare holiday behaviour across markets — does Germany watch differently from the UK during Christmas?
- Identify release timing patterns: when do the biggest titles of the season land, and how does engagement respond?

---

## 5. Audience Segmentation for Targeting

Cluster users into meaningful audience segments based on their behaviour — the kind of segments a media company would use for targeted campaign planning.

**The challenge:**
- Build user profiles from interaction patterns: genres they engage with, platforms they use, session depth, clickout vs browse ratio
- Define and name audience segments (e.g. "binge watchers", "deal hunters", "genre loyalists")
- Which segments are growing? Which have the highest clickout rates?
- How would you use these segments for B2B targeting — e.g. if a studio is launching a new thriller, which audience segment should they target with trailer placements?

**Why this matters:** JustWatch works with studios and streaming services on content marketing. Real audience intelligence drives better targeting.

---

## Your Own Idea

The data is yours. Some prompts if you want to go your own direction:
- What does time of day tell you about content preferences?
- Can you detect binge-watching behaviour from session sequences?
- Is there a correlation between device type and monetization type?
- How does IMDB score correlate with actual user engagement — which titles are overrated or underrated?
- Can you build something useful with Snowflake Cortex (LLM functions, embeddings)?

---

## Tips

- **Start with T1** (Germany, 1 month) to prototype, then scale up
- **Data quality first** — detect bots and anomalies before building models
- **Movies and shows behave differently** — analyse them separately
- **The `QUALIFY` clause** is your friend for ranking within groups
- **`LATERAL FLATTEN`** unpacks genre and production_countries arrays
- **Semi-structured data** (cc_title, cc_clickout, cc_yauaa) uses colon notation: `cc_title:jwEntityId::TEXT`
- **Snowflake Cortex** is available on this account for AI/ML experiments
- **Lightdash** is connected to your team's database — use it for dashboards and visualisations (see [platforms/lightdash/](platforms/lightdash/) for setup)
