import { html, TemplateResult } from "lit";
import type { AggregateResult, LayoutMode, TrendResult } from "../types";
import {
  LIGHTNING_BOLT_PATH,
  TREND_APPROACHING_PATH,
  TREND_RECEDING_PATH,
  TREND_VARIABLE_PATH,
} from "../styles";

export function renderFooter(
  aggregates: AggregateResult,
  trend: TrendResult,
  layoutMode: LayoutMode,
  show: { today: boolean; lastHour: boolean; trend: boolean }
): TemplateResult {
  const narrow = layoutMode === "narrow";
  const showTrendSubtext = !narrow;

  return html`
    <hr class="footer-divider" />
    <div class="footer ${narrow ? "narrow" : ""}">
      ${show.today
        ? html`
            <div class="footer-item">
              <div class="footer-value-row">
                <svg class="footer-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="${LIGHTNING_BOLT_PATH}" />
                </svg>
                <span class="footer-value">${formatCount(aggregates.today)}</span>
              </div>
              <span class="footer-label">Today</span>
            </div>
          `
        : ""}
      ${show.lastHour
        ? html`
            <div class="footer-item">
              <div class="footer-value-row">
                <svg class="footer-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="${LIGHTNING_BOLT_PATH}" />
                </svg>
                <span class="footer-value">${formatCount(aggregates.lastHour)}</span>
              </div>
              <span class="footer-label">${narrow ? "1h" : "Last hour"}</span>
            </div>
          `
        : ""}
      ${show.trend
        ? html`
            <div class="footer-item trend-item">
              <div class="trend-row">
                ${trend.state !== "insufficient"
                  ? html`
                      <svg
                        class="trend-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="${trendIconPath(trend.state)}" />
                      </svg>
                    `
                  : ""}
                <span class="trend-label">${trend.label}</span>
              </div>
              ${showTrendSubtext && trend.subtext
                ? html`<span class="trend-subtext">${trend.subtext}</span>`
                : ""}
            </div>
          `
        : ""}
    </div>
  `;
}

function formatCount(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

function trendIconPath(state: TrendResult["state"]): string {
  switch (state) {
    case "approaching":
      return TREND_APPROACHING_PATH;
    case "receding":
      return TREND_RECEDING_PATH;
    case "variable":
      return TREND_VARIABLE_PATH;
    default:
      return "";
  }
}
