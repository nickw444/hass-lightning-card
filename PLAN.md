# Lightning Proximity Card — Implementation Plan

## 1. Objective

Build a purpose-built Home Assistant Lovelace card for lightning detectors such as the Ecowitt WH57.

The card must visually represent lightning strikes using a **one-dimensional distance-from-home axis**.

The detector does not provide bearing or geographic coordinates, so the card MUST NOT imply that the direction of a strike is known.

The primary visualization should answer, at a glance:

1. How far away have recent strikes occurred?
2. How recently did each strike occur?
3. How much lightning activity has there been?
4. Are recent strike distances generally getting closer or farther away?

The UI should feel like a native Home Assistant card:
- light/dark theme compatible
- Home Assistant theme variables
- compact
- restrained use of colour
- responsive
- minimal decorative elements
- no fake geographic information

Proposed card name:

    Lightning Proximity Card

Proposed custom element:

    lightning-proximity-card

Proposed Lovelace type:

    custom:lightning-proximity-card


---

# 2. Core visual concept

The central UI element is a horizontal distance axis.

Home is always at the left edge / zero point.

Distance increases toward the right.

Example:

    Lightning

    HOME                                                    40 km
     🏠
      │
      ├──────●────────●────────────○────────────────·────────┤
             │        │            │                 │
            8.4 km   13 km        21 km             34 km
            1m ago   8m ago       17m ago           31m ago

    ──────────────────────────────────────────────────────────

      12                   4                   ← Approaching
      Today                Last hour             Recent strikes
                                                 trending closer

The horizontal position of every strike MUST represent only:

    distance from home

Vertical displacement, where required for labels, is purely a layout mechanism and MUST NOT represent direction or geography.


---

# 3. Important UX decisions

## 3.1 Do not include an "Active" indicator

Do not render:

    ACTIVE

The existence and recency of visible strike markers already communicate activity.

An Active badge adds noise without meaningful information.


## 3.2 Do not render a separate history/trend trail

Do NOT render a secondary element such as:

    28 km → 17 km → 11 km → 8.4 km

The strike markers on the distance axis ARE the historical trail.

Duplicating the same information in a second representation makes the card harder to interpret.


## 3.3 Use "Approaching"

Use:

    Approaching

with optional secondary text:

    Recent strikes trending closer

Do not use:

    Getting closer

"Approaching" is shorter and works better as a status.

However, do not imply that the component has measured storm motion or direction.

The status is an interpretation of recent strike distances only.


## 3.4 Distance is the only spatial dimension

Never randomly distribute strikes above/below the axis as though they had geographic position.

Never render:

             ⚡

    🏠                 ⚡

                         ⚡

unless the visual treatment clearly keeps every strike anchored to the distance axis.

The component knows distance only.


---

# 4. Target card layout

Target a compact card approximately 200–260 px high at ordinary desktop dashboard widths.

Preferred structure:

    ┌─────────────────────────────────────────────────────────────┐
    │ ⚡ Lightning                                                │
    │                                                             │
    │ HOME                                                 40 km  │
    │  🏠                                                         │
    │   ├────●──────●──────────○────────────────·───────────────┤ │
    │        │      │          │                │                 │
    │      8.4 km  13 km      21 km            34 km              │
    │      1m ago  8m ago     17m ago          31m ago            │
    │                                                             │
    │ ─────────────────────────────────────────────────────────── │
    │                                                             │
    │  ⚡ 12              ⚡ 4               ← Approaching         │
    │    Today              Last hour          Recent strikes     │
    │                                          trending closer    │
    └─────────────────────────────────────────────────────────────┘


The card consists of three regions:

1. Header
2. Distance visualization
3. Aggregate summary footer


---

# 5. Header

Keep the header extremely simple.

Render:

    [lightning icon] Lightning

Do not render:
- Active badge
- detector model
- subtitle
- "newest on left"
- explanatory text
- permanent menu unless the menu actually performs an action

The phrase "newest on left" is incorrect because horizontal position represents distance, not chronology.

Recommended header height:

    ~40–48 px

Use a Home Assistant / Material Design lightning icon.

The title should use:

    var(--primary-text-color)

The icon should use:

    var(--primary-color)


---

# 6. Distance axis

## 6.1 Default scale

For an Ecowitt WH57 configuration, default to:

    0 → 40 km

Do not hardcode this internally as an immutable assumption.

Configuration should support:

    max_distance: 40

If no explicit max is supplied:

1. inspect the distance entity unit
2. if unit is km:
       default max = 40
3. if unit is mi:
       default max ≈ 25
4. otherwise require explicit configuration or provide a sensible generic fallback


## 6.2 Ticks

Default km ticks:

    0
    10
    20
    30
    40 km

Ticks must be visually subordinate to strike markers.

Use:
- neutral grey baseline
- neutral grey tick marks
- secondary-text colour labels

Never use the blue strike colour for scale ticks.

This is important because the original circular design suffered from the scale competing visually with the data.


## 6.3 Axis endpoints

Prefer a simple finite line:

    |────────────────────────|

rather than an arrow:

    |────────────────────────►

The detector has a practical maximum range, so an arrow unnecessarily implies an infinite scale.

The left endpoint is Home / 0.

The right endpoint is max distance.


## 6.4 Home marker

At x=0 render:

    HOME
     🏠
      |

Use a small home icon.

The house icon should be neutral rather than blue so that blue remains the semantic colour for lightning strikes.


---

# 7. Strike markers

Every reconstructed strike event should be represented at its measured distance.

For example:

    distance = 8.4 km
    max distance = 40 km

Horizontal position:

    xRatio = 8.4 / 40
           = 0.21

Place the marker 21% of the way along the usable distance axis.


## 7.1 Basic marker

Recommended form:

             ⚡
             ●
             │
           8.4 km
           1m ago

The dot is the actual position anchor.

The bolt identifies the event as lightning.

The stem connects the label to its exact distance.


## 7.2 Latest strike

Latest strike should receive the strongest visual emphasis.

Example:
- filled primary-colour dot
- 10–12 px diameter
- primary-colour bolt
- full-opacity label
- distance text slightly bolder

Example:

             ⚡
             ●
             │
           8.4 km
           1m ago


## 7.3 Historical strikes

Older strikes gradually reduce visual emphasis.

Example:

    newest       recent       older        ageing out

      ●            ●            ○             ·


Recommended encoding:
- latest: filled, opacity 1.0
- recent: filled, opacity 0.75–0.9
- older: outlined or reduced opacity
- near expiry: small/faint marker

Do not allow them to become so faint that they can be mistaken for axis ticks.

Maintain a minimum visible opacity around:

    0.25–0.35


## 7.4 Age fading

Default displayed history:

    60 minutes

Suggested opacity function:

    ageRatio = ageMinutes / displayMinutes

    opacity = clamp(
        1 - ageRatio * 0.75,
        0.25,
        1
    )

This should be configurable.

Example:

    display_minutes: 60


## 7.5 Do not encode distance severity using colour by default

Keep the main visualization mostly Home Assistant primary blue.

Do not make:

    <5 km red
    <10 km orange
    <20 km yellow

in the initial implementation.

That adds another visual language and works against the deliberately minimal design.

An optional warning-distance mode could be added later.


---

# 8. Historical strike density and de-cluttering

Dense lightning activity is a major design requirement.

The component must support situations such as:

    2.1
    3.7
    5.2
    6.8
    8.4
    9.9
    11.3
    12.6
    14.2
    16.5
    22.1
    29.4
    33.8
    37.2 km

without turning the card into a wall of overlapping text.


## 8.1 Always preserve strike positions

Every rendered strike should have an axis marker whenever practical.

Labels are optional.

This distinction is important:

    marker = data
    label  = annotation

It is acceptable to suppress some labels.

It is not acceptable to silently move strike markers horizontally to avoid overlap.


## 8.2 Never horizontally jitter markers

Do NOT move:

    8.4 km → 8.8 km

just to make the UI prettier.

That would alter the meaning of the visualization.


## 8.3 Label priority

Always label:

    newest strike

Then label as many additional recent strikes as can fit.

Priority order:

1. newest event
2. next newest event
3. next newest event
4. etc.

Older markers may become marker-only.


## 8.4 Label lanes

Use up to two label lanes below the axis.

Example:

                      ⚡ 13 km · 8m
                         │
       ⚡                 ●
       ●                 │
       │
    ───●─────────────────●──────────────────────────
       │
    8.4 km
    1m ago

The vertical lane carries NO data meaning.

It exists solely to prevent label collisions.


## 8.5 Label placement algorithm

After determining marker x coordinates:

1. sort label candidates newest-first
2. latest strike must always receive a label
3. attempt to place each label into lane 0
4. if it overlaps another label in lane 0, try lane 1
5. if both lanes collide, leave the marker unlabelled
6. tooltip/tap remains available for the unlabelled marker

Suggested minimum horizontal label spacing:

    ~70–90 px

This value should depend on rendered card width and selected label style.


## 8.6 Adaptive label style

Sparse data:

    8.4 km
    1m ago

Dense data:

    8.4 km · 1m

Automatically switch to the one-line form when density is high.

Possible rule:

    labelledEvents <= 5
        => two-line labels

    labelledEvents > 5
        => one-line labels


## 8.7 Identical / nearly identical strike distances

The Ecowitt distance value may be quantised, so repeated strikes can have identical values.

For example:

    8 km
    8 km
    8 km
    8 km

These cannot be shown as separate points horizontally.

Do NOT horizontally spread them.

Instead create an explicit visual cluster at the correct x position.

Example:

          ×4
          ●
          │
        8 km

Tooltip:

    4 strikes around 8 km

    1m ago
    3m ago
    6m ago
    11m ago


## 8.8 Pixel-level clustering

Cluster markers only when they are visually indistinguishable at the current rendered width.

Suggested threshold:

    cluster_threshold_px = 6–8 px

Do not cluster based solely on an arbitrary kilometre distance.

Reason:

At a 1200 px card width:

    1 km

is visually much larger than at a 320 px mobile card width.

Clustering should therefore operate on final pixel positions.


## 8.9 Cluster semantics

A cluster should preserve:

    member events
    total count delta
    min/max distance
    newest timestamp
    oldest timestamp

Do not discard the underlying events.

Clicking/tapping the cluster can show all members.


---

# 9. Responsive design

The card should use ResizeObserver to track available width.

Do not assume Lovelace column width.


## 9.1 Wide mode

Suggested threshold:

    >= 700 px

Allow:
- 8 labelled markers
- 2 label lanes
- full footer subtext
- full 0/10/20/30/40 scale


## 9.2 Medium mode

Suggested range:

    450–699 px

Allow:
- approximately 5 labelled markers
- 2 lanes
- compact event labels
- same basic axis


## 9.3 Narrow mode

Suggested range:

    <450 px

Allow:
- approximately 3–4 labelled markers
- marker dots for the remaining events
- abbreviated ages
- footer subtext may be hidden
- footer can use three compact columns

Example:

    ⚡ 12       ⚡ 4       ← Approaching
     Today       1h


## 9.4 Minimum supported width

Target:

    320 px

The card must not cause page-level horizontal scrolling.


---

# 10. Aggregate footer

Footer contains three logical metrics:

    Today
    Last hour
    Trend

Example:

    ⚡ 12              ⚡ 4               ← Approaching
      Today              Last hour          Recent strikes
                                            trending closer


Use a subtle divider above the footer.

Desktop layout:

    grid-template-columns:
        1fr 1fr 1.4fr

The trend receives slightly more horizontal space because its text is longer.


---

# 11. "Today" calculation

Do not assume the current lightning count entity is necessarily a daily counter.

The Ecowitt integration exposes a lightning count sensor representing detected strikes.

Derive daily activity from count changes.

Preferred calculation:

    todayCount =
        sum(all positive count deltas since local midnight)

This handles counter resets more robustly than:

    currentCount - midnightCount


## 11.1 Counter reset

Example:

    551
    552
    553
    0
    1
    2

Treat:

    553 → 0

as a reset, NOT -553 lightning strikes.

Then:

    0 → 1 = one strike
    1 → 2 = one strike


---

# 12. Last-hour calculation

Calculate from reconstructed strike events.

    lastHour =
        sum(event.countDelta)
        where event.timestamp >= now - 60 minutes

Do not derive this from the distance entity.


---

# 13. Trend / "Approaching" calculation

Trend should be based on recent strike distance observations.

Do NOT use aggregate strike count.

Use only events with a trustworthy distance measurement.


## 13.1 Default trend sample

Recommended:

    trend_sample_size: 4
    trend_window_minutes: 60

Use up to the most recent four observations occurring within the last hour.

Require at least:

    3 observations

before showing a directional trend.


## 13.2 Trend states

Internal enum:

    approaching
    receding
    variable
    insufficient


UI mappings:

    approaching
        label: Approaching
        subtext: Recent strikes trending closer
        icon: arrow toward Home / left

    receding
        label: Receding
        subtext: Recent strikes trending farther away
        icon: arrow right

    variable
        label: Variable
        subtext: Strike distances are mixed

    insufficient
        label: —
        subtext: Not enough recent strikes


## 13.3 Avoid overly sensitive trend switching

Strike position naturally varies.

Do not classify:

    20 → 19 → 21 → 19 km

as Approaching.

Require both:

1. meaningful net distance change
2. reasonable consistency between observations


## 13.4 Suggested simple algorithm

Given chronological distances:

    d0, d1, d2, d3

Where d0 is oldest and d3 newest.

Calculate:

    netChange = d3 - d0

Negative:

    distances became closer

Positive:

    distances became farther away

Also inspect consecutive movements:

    d1 - d0
    d2 - d1
    d3 - d2

For Approaching require:

    netChange <= -minimumNetChange

AND:

    at least 2 of the last 3 movements are negative

For Receding require:

    netChange >= minimumNetChange

AND:

    at least 2 of the last 3 movements are positive

Otherwise:

    Variable


## 13.5 Default meaningful change threshold

For kilometres:

    minimumNetChange = 5 km

For miles:

    equivalent ≈ 3 mi

Make this configurable.


## 13.6 Batch strike events

If one counter update represents multiple strikes but only one distance value exists:

    countDelta = 4
    distance = 11 km

Treat this as:

    one distance observation

for trend purposes.

Do not duplicate 11 km four times in the trend algorithm.


---

# 14. Historical data reconstruction

This is one of the most important parts of the implementation.

The detector exposes:

    lightning count
    latest lightning distance

It does NOT expose a frontend list of historical strike objects.

Therefore reconstruct strike events from Home Assistant recorder history.


## 14.1 Required configuration

Minimum configuration:

~~~yaml
type: custom:lightning-proximity-card
distance_entity: sensor.ecowitt_lightning_distance
count_entity: sensor.ecowitt_lightning_count
~~~


## 14.2 Internal event structure

Use something similar to:

~~~typescript
interface LightningStrikeEvent {
  id: string;
  timestamp: number;
  distance: number;
  countDelta: number;
  source: "history" | "live";
}
~~~


## 14.3 Fetch history using Home Assistant WebSocket

Use Home Assistant's history WebSocket command rather than issuing an unauthenticated external HTTP request.

Conceptually request:

~~~typescript
{
  type: "history/history_during_period",
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  entity_ids: [
    config.count_entity,
    config.distance_entity
  ],
  include_start_time_state: true,
  significant_changes_only: true,
  minimal_response: true,
  no_attributes: true
}
~~~

Call through the Home Assistant connection available to the card.

Do NOT import private Home Assistant frontend history utility modules.

Those internal implementation APIs may change.

Wrap WebSocket access in our own adapter.


---

# 15. History query range

The card needs:

1. enough data to render displayed strikes
2. enough data to calculate trend
3. count changes since midnight for Today

Calculate:

    displayStart =
        now - display_minutes

    trendStart =
        now - trend_window_minutes

    midnight =
        start of current day in Home Assistant timezone

    historyStart =
        earliest(displayStart, trendStart, midnight)

Query from:

    historyStart

through:

    now

This normally means no more than approximately 24 hours of two very low-frequency sensor entities.

That is small enough to be efficient.


---

# 16. Home Assistant timezone

"Today" must refer to the Home Assistant installation's configured timezone, not blindly to UTC.

Use:

    hass.config.time_zone

Provide a timezone utility that calculates the start of the current calendar day in that timezone.

Do not simply use:

    new Date().setHours(0, 0, 0, 0)

unless it is confirmed that the browser and Home Assistant timezones are identical.

This matters when viewing the dashboard remotely.


---

# 17. Strike reconstruction algorithm

Normalize history into two timelines:

    countSamples[]
    distanceSamples[]

Each sample:

~~~typescript
interface NumericSample {
  timestamp: number;
  value: number;
}
~~~


## 17.1 Count timeline

Example:

    10:00  125
    10:03  126
    10:08  127
    10:17  128


Calculate:

    delta = currentCount - previousCount

If:

    delta > 0

a strike event occurred.

If:

    delta == 0

ignore.

If:

    delta < 0

treat as counter reset.


## 17.2 Correlating a distance

For every positive count increment at timestamp T:

Look for a distance observation near T.

Preferred strategy:

1. find the nearest distance sample within ±5 seconds
2. if both before and after are equally near, prefer the newer sample
3. if no sample exists inside that window:
       use the most recent distance value at or before T
4. optionally accept a first sample shortly after T, e.g. within 10 seconds
5. if no reliable distance can be found:
       retain count information for aggregates
       but do not create a plotted strike marker


## 17.3 Why nearest-value correlation matters

Home Assistant may record:

    count updated at 10:03:12.100
    distance updated at 10:03:12.350

If we only take:

    last distance at-or-before count timestamp

we might accidentally assign the previous strike distance.

Therefore use a small correlation window around the count timestamp.


---

# 18. Multiple strikes in a single count increment

Possible history:

    125
    129

delta:

    +4

Only one current "last strike distance" is available.

Do NOT fabricate four strikes at four unknown positions.

Create:

~~~typescript
{
  timestamp: ...,
  distance: latestDistance,
  countDelta: 4
}
~~~

Render:

       ×4
       ●
       │
     8 km

The aggregate metrics count all four strikes.

The plotted event explicitly shows that several strikes were represented by one distance observation.


---

# 19. Same-distance repeated strikes

Another possible sequence:

    strike 1: 8 km
    strike 2: 8 km
    strike 3: 8 km

The distance sensor may not create a significant state change because its numeric value remains 8.

The count sensor still increments.

Historical reconstruction should therefore use:

    most recently known distance state

for each count change when no new nearby distance state exists.

This is essential.

Do NOT derive strike events from distance changes alone.


---

# 20. Live updates

Once initial history is loaded, the card must respond immediately to new strikes.

Track the current count state.

When it increases:

    newCount > previousCount

create a pending live strike event.


## 20.1 Delay final event creation very briefly

Count and distance states may arrive in separate Home Assistant updates.

Therefore do not immediately freeze the distance value at the exact first count update.

Suggested debounce:

    250–1000 ms

Recommended initial value:

    500 ms

After the delay:

1. reread count
2. reread distance
3. calculate delta
4. add live event
5. deduplicate against recorder/history events


## 20.2 Deduplication

A live event will later also exist in history.

Use a stable deduplication strategy.

Events can be considered equivalent when:

    timestamps within approximately 2–5 seconds
    AND
    distance approximately equal
    AND
    count delta compatible

Prefer the live event until a history refresh replaces it.


---

# 21. Current-time updates

The UI contains relative ages:

    1m ago
    8m ago
    31m ago

These must advance even when Home Assistant entity state has not changed.

Create a lightweight timer:

    every 30 or 60 seconds

that triggers a render.

Cleanup timer in:

    disconnectedCallback()

Respect component lifecycle.

Do not leak timers when navigating between Lovelace views.


---

# 22. Midnight handling

If the dashboard remains open across midnight:

    Today

must reset automatically.

The minute timer should detect that the Home Assistant calendar-day key has changed.

On change:

1. recompute Today from cached events
2. refresh history if required
3. ensure old yesterday events are not counted


---

# 23. No-recent-strike state

If no strikes exist inside the display window:

Do not show stale markers as though they were current.

Render a restrained empty state.

Example:

    Lightning

    HOME                                                 40 km
     🏠
      ├────────────────────────────────────────────────────┤

                  No strikes in the last hour

    ──────────────────────────────────────────────────────

      12 Today             0 Last hour             —


If zero today:

    0 Today

is acceptable.


---

# 24. Recorder/history unavailable

The card must fail gracefully if:
- Recorder is disabled
- entities are excluded from Recorder
- WebSocket history request fails
- history returns incomplete data

Do not crash the dashboard.

Fallback:

1. continue observing live state changes
2. render live strikes captured after the card loaded
3. show aggregate values as unavailable where they cannot be derived

Example:

    History unavailable

This message should be subtle rather than a large error panel.

The card should still function as a live lightning display.


---

# 25. Invalid/unavailable entity handling

Validate in setConfig():

Required:

    distance_entity
    count_entity

Throw a clear configuration error if either is missing.

At runtime handle:

    unknown
    unavailable
    null
    NaN
    missing entity

Do not render:

    NaN km
    undefined
    Infinity


---

# 26. Unit handling

Read:

    distanceState.attributes.unit_of_measurement

Likely values:

    km
    mi

The same unit must be used for:
- axis
- markers
- tooltip
- max distance
- trend threshold

Do not internally convert the plotted value unless necessary.

If max_distance is explicitly supplied, interpret it in the distance entity's displayed unit.


---

# 27. Distance formatting

Suggested precision:

    <10:
        one decimal where useful
        8.4 km

    >=10:
        one decimal only if input actually has useful fractional precision
        otherwise:
        13 km

Do not display meaningless precision such as:

    8.400000 km


---

# 28. Age formatting

Compact marker labels:

    <60 sec:
        now
        or 30s

    <60 min:
        1m
        8m
        31m

    >=60 min:
        1h
        2h

Full tooltip:

    1 minute ago
    31 minutes ago

Optional exact timestamp:

    10:42 AM


---

# 29. Marker tooltip / interaction

Markers should be interactive.

Desktop:

    hover or focus

Mobile:

    tap

Tooltip example:

    Lightning strike
    8.4 km away
    1 minute ago
    10:42 AM

For batch:

    4 lightning strikes
    Latest distance: 8 km
    3 minutes ago


## 29.1 Cluster tooltip

For a cluster containing several independently reconstructed events:

    4 strikes

    8.0 km · 1m ago
    8.0 km · 3m ago
    8.4 km · 6m ago
    8.0 km · 11m ago


---

# 30. Optional new-strike animation

Animation should be subtle and brief.

When a genuinely new live event appears:

    marker pulse once

Possible:

    scale 1 → 1.4 → 1
    opacity ring fades

Duration:

    ~500–800 ms

Do not continuously pulse the latest marker.

Respect:

    prefers-reduced-motion


---

# 31. Theme integration

Use Home Assistant CSS variables.

Recommended variables/fallbacks:

    --ha-card-background
    --card-background-color
    --primary-text-color
    --secondary-text-color
    --divider-color
    --primary-color
    --warning-color
    --error-color

Card surface:

    background:
        var(--ha-card-background, var(--card-background-color))

Primary text:

    var(--primary-text-color)

Secondary text:

    var(--secondary-text-color)

Strike markers:

    var(--primary-color)

Axis:

    var(--secondary-text-color)
    at reduced opacity

Divider:

    var(--divider-color)


## 31.1 Do not hardcode the mockup blue

The generated mockup uses a familiar Home Assistant blue.

The implementation should inherit:

    --primary-color

so that user themes work automatically.


---

# 32. Use ha-card

Root visual surface should be:

    <ha-card>

Do not recreate card border radius/shadow manually unless required.

Allow Home Assistant's theme to control:
- radius
- background
- shadow
- border


---

# 33. Rendering technology

Recommended:

    TypeScript
    Lit
    SVG for distance visualization

Use ordinary HTML/CSS for:

    header
    footer
    tooltip

Use SVG for:

    baseline
    ticks
    strike anchor positions
    marker stems
    marker circles
    optional bolt glyphs

SVG is preferable because:
- x positions are precise
- responsive scaling is straightforward
- axis rendering is deterministic
- collision layout can use measured pixel coordinates


---

# 34. Do not import Home Assistant private frontend modules

Avoid imports from internal Home Assistant frontend paths.

The card should only rely on the public/custom-card integration contract and ordinary browser APIs.

For icons either:

1. use standard HA icon elements where appropriate
2. or bundle Material Design SVG paths

For visualization SVG, bundling the relevant MDI SVG paths is likely cleaner.


---

# 35. Proposed source tree

~~~text
src/
  lightning-proximity-card.ts
  lightning-proximity-card-editor.ts

  config.ts
  types.ts

  data/
    history-client.ts
    history-normalizer.ts
    strike-reconstruction.ts
    live-strike-tracker.ts

  domain/
    aggregates.ts
    trend.ts
    units.ts
    time.ts

  layout/
    axis-layout.ts
    marker-clustering.ts
    label-layout.ts

  render/
    header.ts
    axis.ts
    footer.ts
    tooltip.ts

  styles.ts

test/
  strike-reconstruction.test.ts
  trend.test.ts
  aggregates.test.ts
  clustering.test.ts
  label-layout.test.ts
  units.test.ts
  time.test.ts

demo/
  index.html
  mock-hass.ts
  fixtures.ts
~~~

Do not put all logic in one large card class.


---

# 36. Core TypeScript types

Suggested:

~~~typescript
interface LightningProximityCardConfig {
  type: string;

  distance_entity: string;
  count_entity: string;

  title?: string;

  max_distance?: number;
  tick_interval?: number;

  display_minutes?: number;
  max_rendered_events?: number;
  max_labels?: number;

  trend?: {
    enabled?: boolean;
    sample_size?: number;
    window_minutes?: number;
    minimum_net_change?: number;
  };

  summary?: {
    today?: boolean;
    last_hour?: boolean;
    trend?: boolean;
  };

  animation?: boolean;
}
~~~

Internal:

~~~typescript
interface LightningStrikeEvent {
  id: string;
  timestamp: number;
  distance: number | null;
  countDelta: number;
  source: "history" | "live";
}

interface StrikeCluster {
  id: string;
  x: number;
  events: LightningStrikeEvent[];
  representativeDistance: number;
  newestTimestamp: number;
  count: number;
}

type TrendState =
  | "approaching"
  | "receding"
  | "variable"
  | "insufficient";
~~~


---

# 37. Recommended default configuration

~~~yaml
type: custom:lightning-proximity-card
distance_entity: sensor.lightning_distance
count_entity: sensor.lightning_count

title: Lightning

display_minutes: 60
max_distance: 40
tick_interval: 10
max_rendered_events: 40
max_labels: 8

trend:
  enabled: true
  sample_size: 4
  window_minutes: 60
  minimum_net_change: 5

summary:
  today: true
  last_hour: true
  trend: true

animation: true
~~~


---

# 38. Keep minimal YAML possible

The common configuration should ideally be only:

~~~yaml
type: custom:lightning-proximity-card
distance_entity: sensor.gw2000_lightning_distance
count_entity: sensor.gw2000_lightning_count
~~~

Everything else should have sensible defaults.


---

# 39. Component lifecycle

Card should:

## setConfig()

- validate configuration
- normalize defaults
- detect entity changes
- trigger history reload when relevant config changes

## connectedCallback()

- call superclass
- establish resize observer
- start relative-time timer
- fetch history when Home Assistant connection is available

## disconnectedCallback()

- remove ResizeObserver
- cancel timers
- cancel pending debounce
- remove subscriptions if any
- invalidate stale async requests


---

# 40. Async race protection

History responses may arrive after:
- card config changed
- card disconnected
- entity IDs changed

Assign every history request a generation ID.

Example:

    requestGeneration++

When response returns:

    if generation !== currentGeneration:
        discard result

Do not allow stale history to overwrite current state.


---

# 41. History caching

Avoid repeated history loads during ordinary state updates.

Fetch history when:

1. card initially connects
2. relevant entity IDs change
3. display/trend range changes
4. connection is restored after a failure if required
5. a deliberate refresh becomes necessary

Normal Home Assistant state changes should NOT trigger a history fetch.


---

# 42. Limit rendered events

Aggregate calculations may use all reconstructed events.

Rendering should have a cap.

Default:

    max_rendered_events: 40

If 100 strikes occur in the last hour:
- aggregate footer counts all 100
- visualization renders the newest 40
- dense positions can still cluster

Optionally show a subtle:

    +60 earlier strikes

but this is not required for MVP.


---

# 43. Accessibility

Root:

    aria-label="Lightning activity"

SVG:

    role="img"

Provide an accessible summary such as:

    "12 lightning strikes today. Four in the last hour.
     Latest strike 8.4 kilometres away one minute ago.
     Recent strikes are approaching."

Each interactive marker should expose:

    "Lightning strike, 8.4 kilometres, 1 minute ago"

Do not rely on colour alone.

Keyboard focus should activate marker detail the same way hover/tap does.


---

# 44. Light and dark theme support

Do not create separate hardcoded light/dark palettes.

The same component should inherit Home Assistant theme variables.

Verify specifically against:

    default light theme
    default dark theme

The current visual mockups represent the preferred light-theme appearance.


---

# 45. Visual density targets

Sparse example:

    HOME                                             40 km
     🏠
      ├────────●────────────○───────────────·─────────┤
               │            │               │
             8.4 km       21 km           34 km
             1m           17m             31m


Dense example:

    HOME                                             40 km
     🏠
      ├─●─●──●─●──●──●──●──●──○────○──────·────·────┤
        │    │    │      │       │
      2km  5km  8km    13km    18km

Only a subset receives labels.

All practical strike positions remain visible.


---

# 46. Visual distinction between scale and data

This was a major issue with the sonar concept.

Explicitly enforce:

## Scale

    thin
    neutral grey
    no circles except endpoints if needed
    low visual weight

## Strikes

    blue
    circular marker
    lightning symbol where space permits
    more visual weight
    age-based opacity

A user must be able to distinguish strike markers from scale ticks instantly.


---

# 47. Suggested dimensions

Approximate desktop values:

    card padding:         16 px
    header height:       36–40 px
    header/axis gap:     12 px

    axis left padding:   32–44 px
    axis right padding:  16–24 px

    axis line width:     1.5 px

    main marker:         10–12 px
    history marker:      7–9 px

    tick height:         6 px

    label font:          12–13 px
    distance font:       12–13 px medium
    age font:            11–12 px

    axis region:         95–125 px

    footer divider gap:  8–12 px
    footer height:       48–60 px

Overall desired height:

    approximately 210–250 px

depending on label density.


---

# 48. Tooltip should not affect card dimensions

Tooltip must be overlay-based.

Opening a tooltip must NOT cause the axis or footer to move.


---

# 49. Visual editor — Phase 2

MVP may initially support YAML configuration only.

Once stable, add a visual Lovelace editor.

Expose:

    Distance entity
    Lightning count entity
    Title
    Display period
    Maximum distance
    Tick interval
    Maximum labels
    Trend enabled
    Trend sample size
    Trend threshold


Do not expose every internal implementation constant.

Keep advanced collision thresholds internal.


---

# 50. Card picker registration

Register the custom card with Home Assistant's custom card registry.

Metadata:

    Name:
        Lightning Proximity Card

    Description:
        Visualises lightning strike distance and recent activity.

Do not make entity auto-suggestion a requirement for MVP because selecting either the count or distance sensor alone does not reliably identify its companion entity.


---

# 51. Standalone development harness

Create a small development/demo environment so the card can be developed without repeatedly installing bundles into Home Assistant.

Mock:

    hass.states
    hass.config
    hass.locale
    hass.callWS()

Provide deterministic fixture datasets.

This is important for testing dense strike layouts.


---

# 52. Required demo fixtures

Create fixtures for all of these.


## Fixture A — sparse / preferred mockup

    8.4 km  1m ago
    13 km   8m ago
    21 km   17m ago
    34 km   31m ago

Expected:

    Approaching


## Fixture B — dense activity

Example:

    2.1 km   30s
    3.7 km   1m
    5.2 km   2m
    6.8 km   3m
    8.4 km   4m
    9.9 km   6m
    11.3 km  7m
    12.6 km  9m
    14.2 km  11m
    16.5 km  14m
    22.1 km  22m
    29.4 km  28m
    33.8 km  34m
    37.2 km  41m

Expected:
- no horizontal distortion
- limited labels
- dots remain clearly visible
- no text collisions


## Fixture C — repeated distance

    8 km 1m
    8 km 3m
    8 km 5m
    8 km 9m

Expected:

    clustered visual at 8 km


## Fixture D — no recent strikes

Today count > 0, last event >2h ago.

Expected:

    empty distance trail
    Today remains populated
    Last hour = 0
    no directional trend


## Fixture E — receding

    6
    12
    21
    31 km

chronologically.

Expected:

    Receding


## Fixture F — noisy/variable

    15
    8
    17
    12 km

Expected:

    Variable


## Fixture G — counter reset

    count:
    500
    501
    502
    0
    1
    2

Expected:
- no negative strike count
- reset detected
- correct positive delta total


## Fixture H — batched count

    count:
    100
    104

    distance:
    12 km

Expected:
- single 12 km visual marker
- ×4 indication
- aggregate increment = 4


## Fixture I — distance update shortly after count

    count update:
        10:00:00.000

    distance update:
        10:00:00.300

Expected:

    event receives new distance, not previous distance


## Fixture J — unavailable Recorder

Expected:

    card continues operating in live-only mode


---

# 53. Unit tests

Use Vitest or equivalent.

The data reconstruction logic should have excellent unit coverage.

Tests should cover:

## strike-reconstruction

- simple +1 increments
- repeated identical distance
- nearby before-count distance update
- nearby after-count distance update
- counter reset
- delta >1
- invalid numeric values
- unavailable states
- missing distance


## aggregates

- Today
- last hour
- countDelta >1
- midnight boundary
- reset


## trend

- clearly approaching
- clearly receding
- mixed
- insufficient samples
- samples outside trend window
- batch observation treated once


## clustering

- identical pixel positions
- markers 3 px apart
- markers 20 px apart
- resize changing clustering outcome


## label layout

- newest always labelled
- collision lane selection
- maximum labels enforced
- narrow width
- dense fixture


---

# 54. Visual regression testing

Use Playwright screenshot tests against the demo harness if practical.

Capture at least:

    1000 px card width
    600 px card width
    400 px card width
    320 px card width

For:

    sparse fixture
    dense fixture
    no-strikes fixture
    cluster fixture

Also capture:

    light theme
    dark theme


---

# 55. Performance targets

History data is very small for these entities, but rendering should still be disciplined.

Targets:

- no history request on every hass update
- no unbounded event arrays
- no leaked timers
- no leaked ResizeObservers
- no layout loop
- no global state listeners
- no frame-by-frame animations

Label collision can be O(n²) because n is intentionally capped and small.


---

# 56. Suggested implementation sequence

## Step 1 — Scaffold card

Implement:
- TypeScript project
- Lit card class
- build output
- ha-card
- setConfig
- custom element registration
- customCards registration

Acceptance:

    type: custom:lightning-proximity-card

renders a basic empty Lightning card.


## Step 2 — Configuration

Implement:
- config types
- defaults
- validation
- entity lookup
- unit detection

Acceptance:

Missing entities produce useful configuration errors.


## Step 3 — Static axis

Implement:
- SVG
- home marker
- baseline
- ticks
- distance labels
- ResizeObserver

Acceptance:

Axis scales correctly from 320 px to wide layouts.


## Step 4 — Fixture strike rendering

Before touching Recorder history, render deterministic fixture events.

Implement:
- strike x positioning
- age opacity
- labels
- latest marker emphasis

Acceptance:

Sparse fixture visually matches intended mockup.


## Step 5 — Dense label layout

Implement:
- label priority
- two lanes
- label suppression
- compact labels
- clustering

Acceptance:

Dense fixture remains readable with no overlapping text.


## Step 6 — History WebSocket client

Implement:
- request wrapper
- request generation/race handling
- payload normalization
- error handling

Acceptance:

Can retrieve count + distance history from real Home Assistant.


## Step 7 — Strike reconstruction

Implement:
- count deltas
- reset detection
- distance correlation
- batch events
- deduplication

Acceptance:

Unit tests pass for all history reconstruction fixtures.


## Step 8 — Live strike tracking

Implement:
- count increase detection
- short distance correlation debounce
- event insertion
- one-time animation
- live/history dedupe

Acceptance:

New WH57 strike appears without dashboard refresh.


## Step 9 — Aggregate metrics

Implement:

    Today
    Last hour

Acceptance:

Both survive counter resets and batch deltas.


## Step 10 — Trend

Implement:

    Approaching
    Receding
    Variable
    Insufficient

Acceptance:

Fixture classifications match expected outcomes.


## Step 11 — Empty/error states

Implement:
- no recent strikes
- unavailable entity
- recorder unavailable
- incomplete history

Acceptance:

No state produces a broken or blank card.


## Step 12 — Responsive polish

Implement:
- wide/medium/narrow layouts
- label limits
- footer compaction

Acceptance:

320 px card remains usable.


## Step 13 — Accessibility

Implement:
- aria labels
- keyboard marker interaction
- reduced-motion handling

Acceptance:

Latest and labelled strike markers can be inspected without mouse hover.


## Step 14 — Demo and visual regression

Implement fixture gallery.

Acceptance:

All important visual states are easy to inspect without generating real lightning events.


## Step 15 — Visual editor

Only after the card itself is stable.

Implement basic Home Assistant card editor configuration.


---

# 57. MVP completion criteria

The first usable release is complete when all of the following are true:

- [ ] Card accepts count entity and distance entity.
- [ ] Card loads historical Home Assistant Recorder data.
- [ ] Historical strike events are reconstructed from count changes.
- [ ] Same-distance strikes are reconstructed correctly.
- [ ] Counter resets do not corrupt totals.
- [ ] Count jumps greater than one are represented honestly.
- [ ] Recent strikes appear along an accurate 0–40 km axis.
- [ ] Latest strike is visually prominent.
- [ ] Historical strikes fade with age.
- [ ] Scale and strike markers are immediately distinguishable.
- [ ] Dense strike activity does not produce overlapping unreadable text.
- [ ] Labels may be suppressed, but marker distances are never horizontally falsified.
- [ ] Repeated/overlapping strikes cluster explicitly.
- [ ] Today count works.
- [ ] Last-hour count works.
- [ ] Trend reports Approaching/Receding/Variable conservatively.
- [ ] No "Active" indicator exists.
- [ ] No duplicate history trail exists.
- [ ] No bearing/geographic position is implied.
- [ ] Card is compact.
- [ ] Card works in Home Assistant light theme.
- [ ] Card works in Home Assistant dark theme.
- [ ] Card works at 320 px width.
- [ ] New live strikes appear automatically.
- [ ] Relative timestamps update automatically.
- [ ] Component does not leak timers/listeners/observers.
- [ ] Recorder failure has a graceful fallback.


---

# 58. Explicit non-goals for the first version

Do NOT implement yet:

- Blitzortung integration
- maps
- geographic strike positions
- compass bearings
- radar animation
- storm polygons
- precipitation radar
- weather forecasts
- audio alerts
- notification automation
- strike danger scoring
- elaborate colour severity bands
- ApexCharts
- configurable arbitrary templates
- backend Home Assistant integration

Keep this component focused:

    Lightning distance history + activity summary.


---

# 59. Future enhancements

Once the base implementation is stable, possible additions include:

## Optional proximity warning

Example:

    strike <= 5 km

could use:

    --warning-color

or:

    --error-color

Do not make this the default visual language.


## Configurable display window

Examples:

    30 min
    60 min
    120 min


## Tap action

Possible card-wide action:

    open entity more-info
    navigate to weather dashboard
    fire Home Assistant action


## More detailed marker dialog

Could show:

    exact timestamp
    age
    distance
    nearby strike cluster members


## Additional aggregate

Potential:

    Closest today: 4.2 km

But only add this if there is enough footer space.

The card should remain visually minimal.


---

# 60. Final design principle

At all times preserve this hierarchy:

    PRIMARY:
        Where on the distance scale did strikes occur?

    SECONDARY:
        How recent are those strikes?

    TERTIARY:
        How much activity has occurred?

    INTERPRETATION:
        Are recent strike distances generally approaching or receding?


If a proposed feature makes the distance trail harder to understand, do not add it.

The desired finished card should feel more like a compact Home Assistant instrument than a weather analytics dashboard.