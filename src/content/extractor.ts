import type { TargetPlatform } from '../types';

export type { TargetPlatform };

export class ContentExtractor {
  public static detectPlatform(): TargetPlatform {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('twitter.com') || host.includes('x.com')) {
      return 'twitter';
    }
    if (host.includes('youtube.com')) {
      return 'youtube';
    }
    if (host.includes('instagram.com')) {
      return 'instagram';
    }
    return 'generic';
  }

  public static getTargetSelector(platform: TargetPlatform): string {
    switch (platform) {
      case 'twitter':
        return 'article[data-testid="tweet"], div[data-testid="tweet"]';
      case 'youtube':
        return 'ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer';
      case 'instagram':
        return 'article';
      case 'generic':
        return 'article, [role="article"]';
    }
  }

  public static extractText(element: HTMLElement, platform: TargetPlatform): string {
    if (platform === 'twitter') {
      const tweetTextNode = element.querySelector('[data-testid="tweetText"]');
      if (tweetTextNode && tweetTextNode.textContent) {
        return tweetTextNode.textContent.trim();
      }
    }

    if (platform === 'youtube') {
      const titleSelectors = [
        '#video-title',
        '#video-title-link',
        'yt-formatted-string#video-title',
        'span#video-title',
        'h3 a#video-title-link',
        'h3.title-and-badge a',
      ];

      for (const selector of titleSelectors) {
        const titleEl = element.querySelector(selector) as HTMLElement | null;
        if (titleEl) {
          const directTitle = titleEl.getAttribute('title');
          if (directTitle && directTitle.trim().length > 3) {
            return directTitle.trim();
          }

          if (titleEl.textContent && titleEl.textContent.trim().length > 3) {
            return titleEl.textContent.trim();
          }

          const ariaLabel = titleEl.getAttribute('aria-label');
          if (ariaLabel && ariaLabel.trim().length > 3) {
            return ariaLabel.trim();
          }
        }
      }

      const thumbnailLink = element.querySelector('a#thumbnail, a#video-title-link') as HTMLElement | null;
      if (thumbnailLink) {
        const ariaLabel = thumbnailLink.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim().length > 5) {
          const splitBy = ariaLabel.split(' by ');
          if (splitBy.length > 0 && splitBy[0].trim().length > 3) {
            return splitBy[0].trim();
          }
        }
      }

      const h3 = element.querySelector('h3');
      if (h3 && h3.textContent && h3.textContent.trim().length > 3) {
        return h3.textContent.trim();
      }
    }

    if (platform === 'instagram') {
      const captionSelectors = ['h1', 'span', 'div'];
      for (const sel of captionSelectors) {
        const nodes = element.querySelectorAll(sel);
        for (const node of nodes) {
          const text = node.textContent?.trim();
          if (text && text.length > 20 && !text.includes('View all comments')) {
            return text.slice(0, 300);
          }
        }
      }
    }

    const fallbackSelectors = ['h1', 'h2', 'h3', 'p'];
    for (const sel of fallbackSelectors) {
      const node = element.querySelector(sel);
      if (node && node.textContent && node.textContent.trim().length > 10) {
        return node.textContent.trim();
      }
    }

    return element.innerText ? element.innerText.slice(0, 300).trim() : '';
  }
}
