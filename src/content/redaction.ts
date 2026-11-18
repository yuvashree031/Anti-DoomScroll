export class DOMRedactor {
  private static readonly STYLE_ID = 'anti-doomscroll-redaction-styles';

  public static ensureStylesInjected(): void {
    if (document.getElementById(this.STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = this.STYLE_ID;
    style.textContent = `
      .anti-doomscroll-redacted-card {
        position: relative !important;
        overflow: hidden !important;
        border-radius: 12px !important;
      }

      .anti-doomscroll-redacted-card > *:not(.anti-doomscroll-redaction-overlay) {
        filter: blur(24px) grayscale(85%) !important;
        opacity: 0.10 !important;
        pointer-events: none !important;
        user-select: none !important;
        transition: filter 0.2s ease, opacity 0.2s ease !important;
      }

      .anti-doomscroll-revealed-card,
      .anti-doomscroll-revealed-card * {
        filter: none !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        user-select: auto !important;
      }

      .anti-doomscroll-redaction-overlay {
        position: absolute !important;
        inset: 4px !important;
        z-index: 2147483647 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        background-color: rgba(9, 14, 26, 0.95) !important;
        backdrop-filter: blur(14px) !important;
        border: 1px solid rgba(239, 68, 68, 0.45) !important;
        border-radius: 10px !important;
        padding: 14px !important;
        color: #f8fafc !important;
        text-align: center !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6) !important;
        pointer-events: auto !important;
      }

      .anti-doomscroll-reveal-btn {
        font-size: 11px !important;
        font-weight: 600 !important;
        background-color: #1e293b !important;
        color: #f1f5f9 !important;
        border: 1px solid #475569 !important;
        border-radius: 6px !important;
        padding: 6px 16px !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        position: relative !important;
        z-index: 2147483647 !important;
        transition: background-color 0.2s, transform 0.1s !important;
      }

      .anti-doomscroll-reveal-btn:hover {
        background-color: #334155 !important;
        color: #ffffff !important;
      }

      .anti-doomscroll-reveal-btn:active {
        transform: scale(0.96) !important;
      }
    `;

    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    }
  }

  public static applyRedaction(
    element: HTMLElement,
    reason: string = 'Non-Study Distraction',
    confidenceScore: number = 0
  ): void {
    this.ensureStylesInjected();

    if (element.dataset.antiDoomscrollUserRevealed === 'true') {
      return;
    }

    if (element.classList.contains('anti-doomscroll-redacted-card')) {
      return;
    }

    element.classList.remove('anti-doomscroll-revealed-card');
    element.classList.add('anti-doomscroll-redacted-card');
    element.dataset.antiDoomscrollRedacted = 'true';
    element.dataset.antiDoomscrollReason = reason;

    const existingOverlay = element.querySelector('.anti-doomscroll-redaction-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'anti-doomscroll-redaction-overlay';

    const percentage = Math.round(confidenceScore * 100);
    const friendlyReason = this.formatReason(reason);

    overlay.innerHTML = `
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #f87171; font-weight: 700; margin-bottom: 4px;">
        Anti-Doomscroll Purifier
      </div>
      <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">
        ${this.escapeHtml(friendlyReason)} ${percentage > 0 ? `(${percentage}%)` : ''}
      </div>
      <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px; max-width: 260px; line-height: 1.35;">
        Filtered to keep your feed strictly focused on informative & study content.
      </div>
      <button type="button" class="anti-doomscroll-reveal-btn">
        Show Video
      </button>
    `;

    const revealBtn = overlay.querySelector('.anti-doomscroll-reveal-btn') as HTMLButtonElement | null;
    if (revealBtn) {
        const handleReveal = (e: Event) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();

          element.dataset.antiDoomscrollUserRevealed = 'true';
          element.classList.remove('anti-doomscroll-redacted-card');
      element.classList.add('anti-doomscroll-revealed-card');

      overlay.remove();
    };

    revealBtn.addEventListener('click', handleReveal, true);
    revealBtn.addEventListener('pointerdown', handleReveal, true);
    revealBtn.addEventListener('mousedown', handleReveal, true);
  }

    element.appendChild(overlay);
}

  private static formatReason(reason: string): string {
  switch (reason.toLowerCase()) {
    case 'music':
    case 'song':
      return 'Music / Song Video';
    case 'trailer':
    case 'promo':
      return 'Movie Promo / Teaser';
    case 'gossip':
    case 'drama':
      return 'Celebrity Drama / Gossip';
    case 'reaction':
      return 'Movie / Video Reaction';
    case 'beauty':
      return 'Skincare / Beauty Fluff';
    case 'clickbait':
      return 'Sensational Clickbait';
    case 'rage-bait':
      return 'Emotional Rage-Bait';
    case 'distraction':
    default:
      return 'Non-Study Distraction';
  }
}

  private static escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
}
