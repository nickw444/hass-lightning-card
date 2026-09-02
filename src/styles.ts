import { css } from "lit";

export const cardStyles = css`
  :host {
    display: block;
  }

  ha-card {
    padding: 16px;
    overflow: hidden;
    min-width: 0;
  }

  .card-inner {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    min-height: 36px;
  }

  .header-icon {
    width: 22px;
    height: 22px;
    fill: var(--primary-color, #03a9f4);
    flex-shrink: 0;
  }

  .header-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color, rgba(0, 0, 0, 0.87));
    line-height: 1.2;
  }

  .axis-container {
    position: relative;
    width: 100%;
    min-height: 120px;
    margin: -4px 0 0;
    padding: 0;
  }

  .axis-svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .axis-bar {
    fill: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    fill-opacity: 0.35;
    stroke: none;
  }

  .tick-line {
    stroke: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    stroke-opacity: 0.3;
    stroke-width: 1;
  }

  .tick-label {
    fill: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    font-size: 11px;
    text-anchor: middle;
  }

  .home-icon {
    fill: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    fill-opacity: 0.7;
  }

  .marker-dot {
    fill: var(--primary-color, #03a9f4);
    stroke: var(--primary-color, #03a9f4);
    cursor: pointer;
    transition: opacity 0.2s ease;
    outline: none;
  }

  .marker-hit {
    fill: transparent;
    stroke: none;
    cursor: pointer;
    pointer-events: all;
  }

  .strike-marker {
    outline: none;
  }

  .marker-dot.outlined {
    fill: transparent;
    stroke-width: 2;
  }

  .marker-dot.latest {
    stroke-width: 0;
  }

  .marker-dot.live {
    animation: live-strike-color 10s linear both;
    fill: #f44336;
    stroke: #f44336;
  }

  .marker-rings {
    pointer-events: none;
  }

  .marker-rings.live .marker-ring-group {
    animation: live-strike-ring 2.5s ease-out infinite;
    transform-origin: 0 0;
  }

  .marker-rings.live .marker-ring-group.delayed {
    animation-delay: 1.25s;
  }

  .marker-rings.fading {
    animation: live-strike-rings-fadeout 1.5s ease-out forwards;
  }

  .marker-rings.fading .marker-ring-group {
    animation-play-state: paused;
    transform-origin: 0 0;
  }

  .marker-ring {
    fill: none;
    stroke: #f44336;
    stroke-width: 2;
    pointer-events: none;
  }

  .marker-stem {
    stroke: var(--primary-color, #03a9f4);
    stroke-width: 1;
    stroke-dasharray: 3 2;
    opacity: 0.5;
  }

  .marker-bolt {
    fill: var(--primary-color, #03a9f4);
    cursor: pointer;
  }

  .marker-bolt.live {
    animation: live-strike-fill 10s linear both;
    fill: #f44336;
  }

  .cluster-count {
    fill: var(--primary-color, #03a9f4);
    font-size: 10px;
    font-weight: 600;
    text-anchor: middle;
  }

  .label-group {
    pointer-events: none;
  }

  .label-distance {
    fill: var(--primary-color, #03a9f4);
    font-size: 12px;
    font-weight: 500;
    text-anchor: middle;
  }

  .label-distance.latest {
    font-weight: 600;
  }

  .label-age {
    fill: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    font-size: 11px;
    text-anchor: middle;
  }

  .label-compact {
    fill: var(--primary-color, #03a9f4);
    font-size: 11px;
    text-anchor: middle;
  }

  .empty-message {
    fill: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    font-size: 13px;
    text-anchor: middle;
    font-style: italic;
  }

  .history-warning {
    font-size: 11px;
    color: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    text-align: center;
    font-style: italic;
    margin-top: -4px;
  }

  .footer-divider {
    border: none;
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    margin: 4px 0 0;
  }

  .footer {
    display: grid;
    grid-template-columns: 1fr 1fr 1.4fr;
    gap: 8px;
    padding-top: 8px;
    min-height: 52px;
  }

  .footer.narrow {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
  }

  .footer-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
  }

  .footer-value-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .footer-icon {
    width: 18px;
    height: 18px;
    fill: var(--primary-color, #03a9f4);
    flex-shrink: 0;
  }

  .footer-value {
    font-size: 20px;
    font-weight: 500;
    color: var(--primary-text-color, rgba(0, 0, 0, 0.87));
    line-height: 1;
  }

  .footer-label {
    font-size: 12px;
    color: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    text-align: center;
  }

  .trend-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .trend-icon {
    width: 20px;
    height: 20px;
    fill: var(--primary-color, #03a9f4);
    flex-shrink: 0;
  }

  .trend-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--primary-text-color, rgba(0, 0, 0, 0.87));
    line-height: 1.2;
  }

  .trend-subtext {
    font-size: 11px;
    color: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    text-align: center;
    line-height: 1.3;
  }

  .trend-item {
    align-items: center;
  }

  .tooltip {
    position: absolute;
    z-index: 10;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 4px;
    padding: 8px 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    max-width: 220px;
    font-size: 12px;
    color: var(--primary-text-color, rgba(0, 0, 0, 0.87));
    transform: translate(-50%, calc(-100% - 10px));
  }

  .tooltip-title {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .tooltip-line {
    color: var(--secondary-text-color, rgba(0, 0, 0, 0.54));
    line-height: 1.4;
  }

  @media (prefers-reduced-motion: reduce) {
    .marker-dot.live,
    .marker-bolt.live,
    .marker-rings.live .marker-ring-group,
    .marker-rings.fading {
      animation: none !important;
    }
  }

  @keyframes live-strike-color {
    0% {
      fill: #f44336;
      stroke: #f44336;
    }
    100% {
      fill: #03a9f4;
      stroke: #03a9f4;
    }
  }

  @keyframes live-strike-fill {
    0% {
      fill: #f44336;
    }
    100% {
      fill: #03a9f4;
    }
  }

  @keyframes live-strike-ring {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    100% {
      transform: scale(3);
      opacity: 0;
    }
  }

  @keyframes live-strike-rings-fadeout {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

export const LIGHTNING_BOLT_PATH =
  "M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z";

export const HOME_PATH =
  "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z";

export const TREND_APPROACHING_PATH =
  "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z";

export const TREND_RECEDING_PATH =
  "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z";

export const TREND_VARIABLE_PATH =
  "M22 12l-4-4v3H3v2h15v3z";
