import { ContentExtractor, TargetPlatform } from './extractor';
import { DOMRedactor } from './redaction';
import { ShortsAndReelsBlocker } from './shorts-blocker';
import {
  BaseRuntimeMessage,
  ClassificationRequestPayload,
  ClassificationResult,
  ExtensionSettings,
  RuntimeResponse,
} from '../types';

export class DOMFeedPurifier {
  private platform: TargetPlatform;
  private observer: MutationObserver | null = null;
  private sweepInterval: number | null = null;
  private isProcessingSweep: boolean = false;
  private isFilterActive: boolean = true;
  private readonly SWEEP_INTERVAL_MS = 400;

  constructor() {
    this.platform = ContentExtractor.detectPlatform();
  }

  public async initialize(): Promise<void> {
    console.log(`[Anti-Doomscroll] Content script initialized on platform: ${this.platform}`);

    DOMRedactor.ensureStylesInjected();
    ShortsAndReelsBlocker.initialize();

    await this.fetchSettings();
    this.setupStorageListener();
    this.startObserver();
    this.startContinuousSweeper();
    this.runSweep();
  }

  private async fetchSettings(): Promise<void> {
    try {
      const response = await this.sendMessage<unknown, ExtensionSettings>({
        type: 'GET_SETTINGS',
        payload: {},
      });

      if (response && response.success && response.data) {
        this.isFilterActive = response.data.filterEnabled;
        if (response.data.blockShortsAndReels) {
          ShortsAndReelsBlocker.injectBlockingStyles();
        }
      }
    } catch (err) {
      console.warn('[Anti-Doomscroll] Failed to fetch settings, defaulting to active:', err);
      this.isFilterActive = true;
    }
  }

  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.anti_doomscroll_settings) {
        const newSettings: ExtensionSettings = changes.anti_doomscroll_settings.newValue;
        if (newSettings) {
          this.isFilterActive = newSettings.filterEnabled;
          if (newSettings.blockShortsAndReels) {
            ShortsAndReelsBlocker.injectBlockingStyles();
          } else {
            const style = document.getElementById('anti-doomscroll-block-shorts-styles');
            if (style) {
              style.remove();
            }
          }
          this.runSweep();
        }
      }
    });
  }

  private startContinuousSweeper(): void {
    if (this.sweepInterval !== null) {
      window.clearInterval(this.sweepInterval);
    }

    this.sweepInterval = window.setInterval(() => {
      this.runSweep();
    }, this.SWEEP_INTERVAL_MS);

    window.addEventListener('scroll', () => this.runSweep(), { passive: true });
  }

  private startObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver(() => {
      this.runSweep();
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  private async runSweep(): Promise<void> {
    if (this.isProcessingSweep || !this.isFilterActive) {
      return;
    }

    this.isProcessingSweep = true;

    try {
      const targetSelector = ContentExtractor.getTargetSelector(this.platform);
      const elements = document.querySelectorAll<HTMLElement>(targetSelector);

      const unanalyzed: HTMLElement[] = [];

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];

        if (el.dataset.antiDoomscrollUserRevealed === 'true') {
          continue;
        }

        if (el.dataset.antiDoomscrollEvaluated === 'true') {
          continue;
        }

        if (el.closest('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer, [is-shorts]')) {
          el.dataset.antiDoomscrollEvaluated = 'true';
          continue;
        }

        unanalyzed.push(el);
      }

      if (unanalyzed.length === 0) {
        return;
      }

      const batch = unanalyzed.slice(0, 10);

      await Promise.all(
        batch.map(async (element) => {
          await this.evaluateElement(element);
        })
      );
    } finally {
      this.isProcessingSweep = false;
    }
  }

  private async evaluateElement(element: HTMLElement): Promise<void> {
    if (element.dataset.antiDoomscrollUserRevealed === 'true') {
      return;
    }

    const text = ContentExtractor.extractText(element, this.platform);

    if (!text || text.trim().length < 4) {
      return;
    }

    element.dataset.antiDoomscrollEvaluated = 'true';

    try {
      const response = await this.sendMessage<ClassificationRequestPayload, ClassificationResult>({
        type: 'CLASSIFY_TEXT',
        payload: {
          nodeId: element.id || Math.random().toString(36).substring(7),
          text,
          platform: this.platform,
        },
      });

      if (response && response.success && response.data) {
        if (element.dataset.antiDoomscrollUserRevealed === 'true') {
          return;
        }

        if (response.data.isFlagged) {
          console.log(
            `[Anti-Doomscroll] Redacting post: "${text.slice(0, 45)}..." (${response.data.flaggedReason})`
          );
          DOMRedactor.applyRedaction(
            element,
            response.data.flaggedReason || 'distraction',
            response.data.confidence
          );
        }
      }
    } catch (err) {
      console.error('[Anti-Doomscroll] Evaluation error for element:', err);
    }
  }

  private sendMessage<TPayload, TResult>(
    message: BaseRuntimeMessage<TPayload>
  ): Promise<RuntimeResponse<TResult>> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response: RuntimeResponse<TResult>) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          resolve(response);
        }
      });
    });
  }
}

const purifier = new DOMFeedPurifier();
purifier.initialize();
