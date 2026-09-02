import "../src/lightning-proximity-card";
import {
  ALL_FIXTURES,
  ENTITY_COUNT,
  ENTITY_DISTANCE,
  createMockHass,
  type FixtureDefinition,
} from "./fixtures";
import { LiveStrikeSimulator, randomStrikeDistance } from "./live-simulator";

type LightningCard = HTMLElement & {
  hass?: unknown;
  setConfig: (config: unknown) => void;
};

class HaCard extends HTMLElement {
  connectedCallback(): void {
    this.style.display = "block";
    this.style.background =
      "var(--ha-card-background, var(--card-background-color, #fff))";
    this.style.borderRadius = "var(--ha-card-border-radius, 12px)";
    this.style.boxShadow =
      "var(--ha-card-box-shadow, 0 2px 2px rgba(0,0,0,0.1))";
    this.style.border = "1px solid var(--divider-color, rgba(0,0,0,0.12))";
  }
}

if (!customElements.get("ha-card")) {
  customElements.define("ha-card", HaCard);
}

const params = new URLSearchParams(window.location.search);
const fixtureId = params.get("fixture") ?? "sparse";
const theme = params.get("theme") ?? "light";
const width = Number(params.get("width") ?? "600");

document.documentElement.setAttribute("data-theme", theme);

if (theme === "dark") {
  document.body.style.setProperty("--primary-text-color", "rgba(255,255,255,0.87)");
  document.body.style.setProperty("--secondary-text-color", "rgba(255,255,255,0.6)");
  document.body.style.setProperty("--card-background-color", "#1c1c1c");
  document.body.style.setProperty("--ha-card-background", "#1c1c1c");
  document.body.style.setProperty("--divider-color", "rgba(255,255,255,0.12)");
  document.body.style.setProperty("--primary-color", "#03a9f4");
  document.body.style.background = "#111";
  document.body.style.color = "rgba(255,255,255,0.87)";
} else {
  document.body.style.setProperty("--primary-text-color", "rgba(0,0,0,0.87)");
  document.body.style.setProperty("--secondary-text-color", "rgba(0,0,0,0.54)");
  document.body.style.setProperty("--card-background-color", "#fff");
  document.body.style.setProperty("--ha-card-background", "#fff");
  document.body.style.setProperty("--divider-color", "rgba(0,0,0,0.12)");
  document.body.style.setProperty("--primary-color", "#03a9f4");
  document.body.style.background = "#f5f5f5";
  document.body.style.color = "rgba(0,0,0,0.87)";
}

const app = document.getElementById("app")!;
const controls = document.getElementById("controls")!;
const cardContainer = document.createElement("div");
cardContainer.className = "card-container";
cardContainer.style.maxWidth = `${width}px`;

function renderLiveControls(
  simulator: LiveStrikeSimulator,
  onStrike: (distance: number) => void
): void {
  const panel = document.createElement("div");
  panel.className = "live-controls";

  const distanceInput = document.createElement("input");
  distanceInput.type = "range";
  distanceInput.min = "2";
  distanceInput.max = "38";
  distanceInput.step = "0.1";
  distanceInput.value = String(simulator.lastDistance);
  distanceInput.id = "strike-distance";

  const distanceLabel = document.createElement("span");
  distanceLabel.id = "strike-distance-label";
  distanceLabel.textContent = `${distanceInput.value} km`;

  distanceInput.addEventListener("input", () => {
    distanceLabel.textContent = `${distanceInput.value} km`;
  });

  const randomBtn = document.createElement("button");
  randomBtn.type = "button";
  randomBtn.textContent = "Random distance";
  randomBtn.addEventListener("click", () => {
    const distance = randomStrikeDistance();
    distanceInput.value = String(distance);
    distanceLabel.textContent = `${distance} km`;
  });

  const fireBtn = document.createElement("button");
  fireBtn.type = "button";
  fireBtn.className = "primary";
  fireBtn.textContent = "Fire strike";
  fireBtn.addEventListener("click", () => {
    onStrike(Number.parseFloat(distanceInput.value));
  });

  const autoLabel = document.createElement("label");
  const autoToggle = document.createElement("input");
  autoToggle.type = "checkbox";
  autoToggle.id = "auto-strike-toggle";

  const intervalInput = document.createElement("input");
  intervalInput.type = "range";
  intervalInput.min = "3";
  intervalInput.max = "20";
  intervalInput.value = "8";
  intervalInput.id = "auto-strike-interval";
  intervalInput.disabled = true;

  const intervalLabel = document.createElement("span");
  intervalLabel.textContent = "every 8s";

  const startAuto = (): void => {
    const intervalMs = Number.parseInt(intervalInput.value, 10) * 1000;
    simulator.startAuto(
      intervalMs,
      () => {
        const distance = randomStrikeDistance();
        distanceInput.value = String(distance);
        distanceLabel.textContent = `${distance} km`;
        return distance;
      },
      onStrike
    );
  };

  intervalInput.addEventListener("input", () => {
    intervalLabel.textContent = `every ${intervalInput.value}s`;
    if (autoToggle.checked) {
      startAuto();
    }
  });

  autoToggle.addEventListener("change", () => {
    intervalInput.disabled = !autoToggle.checked;
    if (autoToggle.checked) {
      startAuto();
    } else {
      simulator.stopAuto();
    }
  });

  autoLabel.appendChild(autoToggle);
  autoLabel.append(" Auto-fire ");
  autoLabel.appendChild(intervalInput);
  autoLabel.appendChild(intervalLabel);

  const distanceField = document.createElement("label");
  distanceField.textContent = "Next distance: ";
  distanceField.appendChild(distanceInput);
  distanceField.appendChild(distanceLabel);

  panel.appendChild(distanceField);
  panel.appendChild(randomBtn);
  panel.appendChild(fireBtn);
  panel.appendChild(autoLabel);
  controls.appendChild(panel);

  window.addEventListener("beforeunload", () => simulator.stopAuto());
}

function renderControls(activeFixture: FixtureDefinition): void {
  controls.innerHTML = "";

  const fixtureSelect = document.createElement("select");
  fixtureSelect.id = "fixture-select";
  for (const f of ALL_FIXTURES) {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    if (f.id === activeFixture.id) opt.selected = true;
    fixtureSelect.appendChild(opt);
  }
  fixtureSelect.addEventListener("change", () => {
    const url = new URL(window.location.href);
    url.searchParams.set("fixture", fixtureSelect.value);
    window.location.href = url.toString();
  });

  const themeSelect = document.createElement("select");
  themeSelect.id = "theme-select";
  for (const t of ["light", "dark"]) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    if (t === theme) opt.selected = true;
    themeSelect.appendChild(opt);
  }
  themeSelect.addEventListener("change", () => {
    const url = new URL(window.location.href);
    url.searchParams.set("theme", themeSelect.value);
    window.location.href = url.toString();
  });

  const widthInput = document.createElement("input");
  widthInput.type = "range";
  widthInput.min = "320";
  widthInput.max = "1000";
  widthInput.value = String(width);
  widthInput.id = "width-slider";
  const widthLabel = document.createElement("span");
  widthLabel.id = "width-label";
  widthLabel.textContent = `${width}px`;
  widthInput.addEventListener("input", () => {
    const w = Number(widthInput.value);
    widthLabel.textContent = `${w}px`;
    cardContainer.style.maxWidth = `${w}px`;
  });

  const label1 = document.createElement("label");
  label1.textContent = "Fixture: ";
  label1.appendChild(fixtureSelect);

  const label2 = document.createElement("label");
  label2.textContent = " Theme: ";
  label2.appendChild(themeSelect);

  const label3 = document.createElement("label");
  label3.textContent = " Width: ";
  label3.appendChild(widthInput);
  label3.appendChild(widthLabel);

  controls.appendChild(label1);
  controls.appendChild(label2);
  controls.appendChild(label3);

  if (activeFixture.expectedTrend) {
    const expected = document.createElement("span");
    expected.className = "expected";
    expected.textContent = `Expected trend: ${activeFixture.expectedTrend}`;
    controls.appendChild(expected);
  }

  const desc = document.createElement("p");
  desc.className = "fixture-desc";
  desc.textContent = activeFixture.description;
  controls.appendChild(desc);
}

const activeFixture =
  ALL_FIXTURES.find((f) => f.id === fixtureId) ?? ALL_FIXTURES[0];

if (params.get("gallery") === "1") {
  app.innerHTML = "";
  const galleryControls = document.createElement("div");
  galleryControls.id = "controls";
  galleryControls.innerHTML = `<h2>Fixture Gallery</h2>`;
  app.appendChild(galleryControls);

  for (const fixture of ALL_FIXTURES) {
    const section = document.createElement("section");
    section.className = "gallery-section";

    const heading = document.createElement("h3");
    heading.textContent = fixture.name;
    section.appendChild(heading);

    const desc = document.createElement("p");
    desc.textContent = fixture.description;
    section.appendChild(desc);

    for (const w of [1000, 600, 400, 320]) {
      const container = document.createElement("div");
      container.className = "card-container";
      container.style.maxWidth = `${w}px`;

      const label = document.createElement("span");
      label.className = "width-tag";
      label.textContent = `${w}px`;
      container.appendChild(label);

      const c = document.createElement("lightning-proximity-card") as LightningCard;
      container.appendChild(c);
      c.setConfig({
        type: "custom:lightning-proximity-card",
        distance_entity: ENTITY_DISTANCE,
        count_entity: ENTITY_COUNT,
      });
      c.hass = createMockHass(fixture);
      section.appendChild(container);
    }

    app.appendChild(section);
  }
} else {
  app.appendChild(cardContainer);

  const card = document.createElement("lightning-proximity-card") as LightningCard;
  cardContainer.appendChild(card);

  card.setConfig({
    type: "custom:lightning-proximity-card",
    distance_entity: ENTITY_DISTANCE,
    count_entity: ENTITY_COUNT,
    title: "Lightning",
  });

  const simulator = new LiveStrikeSimulator(activeFixture);
  card.hass = simulator.hass;

  renderControls(activeFixture);

  const status = document.createElement("p");
  status.className = "live-status";
  status.textContent = `Count ${simulator.count} · ready to simulate live strikes`;
  controls.appendChild(status);

  const applyStrike = (distance: number): void => {
    card.hass = simulator.strike(distance);
    status.textContent = `Count ${simulator.count} · last strike ${distance.toFixed(1)} km`;
  };

  renderLiveControls(simulator, applyStrike);
}
