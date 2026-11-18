export class ShortsAndReelsBlocker {
  private static readonly STYLE_ID = 'anti-doomscroll-block-shorts-styles';

  public static initialize(): void {
    this.injectBlockingStyles();
    this.checkDirectUrlAccess();
    this.observeNavigationEvents();
  }

  public static injectBlockingStyles(): void {
    if (document.getElementById(this.STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = this.STYLE_ID;
    style.textContent = `
      /* YouTube Shorts Elimination */
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-rich-section-renderer:has(ytd-reel-shelf-renderer),
      ytd-reel-item-renderer,
      ytd-guide-entry-renderer:has(a[href*="/shorts"]),
      ytd-mini-guide-entry-renderer:has(a[href*="/shorts"]),
      ytd-notification-renderer:has(a[href*="/shorts"]),
      a[title="Shorts"],
      a[href^="/shorts"] {
        display: none !important;
        visibility: hidden !important;
      }

      /* Instagram Reels Elimination */
      a[href*="/reels/"],
      a[href^="/reels/"],
      div[role="navigation"] a:has(svg[aria-label="Reels"]) {
        display: none !important;
        visibility: hidden !important;
      }
    `;

    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        (document.head || document.documentElement).appendChild(style);
      });
    }
  }

  public static checkDirectUrlAccess(): void {
    const path = window.location.pathname.toLowerCase();
    const host = window.location.hostname.toLowerCase();

    if (host.includes('youtube.com') && path.startsWith('/shorts')) {
      this.renderFocusShield('YouTube Shorts', 'https://www.youtube.com/');
    } else if (host.includes('instagram.com') && (path.startsWith('/reels') || path.startsWith('/reel/'))) {
      this.renderFocusShield('Instagram Reels', 'https://www.instagram.com/');
    }
  }

  private static observeNavigationEvents(): void {
    let lastUrl = window.location.href;

    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        this.checkDirectUrlAccess();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('popstate', () => this.checkDirectUrlAccess());
  }

  private static renderFocusShield(platformLabel: string, homeUrl: string): void {
    const existing = document.getElementById('anti-doomscroll-focus-shield');
    if (existing) {
      return;
    }

    const videos = document.querySelectorAll('video');
    videos.forEach((v) => {
      try {
        v.pause();
        v.muted = true;
      } catch {}
    });

    const shield = document.createElement('div');
    shield.id = 'anti-doomscroll-focus-shield';
    shield.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483647 !important;
      background-color: #020617 !important;
      color: #f8fafc !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      text-align: center !important;
      padding: 24px !important;
    `;

    shield.innerHTML = `
      <div style="max-width: 480px; background: #0f172a; border: 1px solid #1e293b; padding: 36px 32px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #14b8a6; font-weight: 700; margin-bottom: 8px;">
          Anti-Doomscroll Shield
        </div>
        <h2 style="font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 12px 0;">
          ${platformLabel} Blocked
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
          Short-form algorithmic video streams are designed for endless doomscrolling. Your focus filter has blocked this feed so you can stay productive.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <a href="${homeUrl}" style="
            background: #0d9488;
            color: #ffffff;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: 8px;
            transition: background 0.2s;
            display: inline-block;
          ">
            Return to Feed
          </a>
          <button id="anti-doomscroll-bypass-btn" style="
            background: #1e293b;
            color: #64748b;
            border: 1px solid #334155;
            font-size: 12px;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
          ">
            Temporarily Allow
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(shield);

    const bypassBtn = shield.querySelector('#anti-doomscroll-bypass-btn');
    if (bypassBtn) {
      bypassBtn.addEventListener('click', () => {
        shield.remove();
      });
    }
  }
}
