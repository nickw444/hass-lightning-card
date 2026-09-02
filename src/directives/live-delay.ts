import { noChange } from "lit";
import { directive, Directive, type ElementPart } from "lit/directive.js";

class LiveDelayDirective extends Directive {
  private applied = false;

  render(delayMs: number) {
    return delayMs;
  }

  update(part: ElementPart, [delayMs]: [number]) {
    if (this.applied) {
      return noChange;
    }

    const element = part.element as SVGElement;
    element.style.animationDelay = `${delayMs}ms`;
    element.dataset.liveDelayApplied = "true";
    this.applied = true;
    return noChange;
  }
}

export const liveDelay = directive(LiveDelayDirective);
