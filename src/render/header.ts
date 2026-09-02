import { html, TemplateResult } from "lit";
import { LIGHTNING_BOLT_PATH } from "../styles";

export function renderHeader(title: string): TemplateResult {
  return html`
    <div class="header">
      <svg class="header-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="${LIGHTNING_BOLT_PATH}" />
      </svg>
      <span class="header-title">${title}</span>
    </div>
  `;
}
