import { ExtensionSettings, StatisticsData } from '../types';

export class StorageService {
  private static readonly SETTINGS_KEY = 'anti_doomscroll_settings';
  private static readonly STATS_KEY = 'anti_doomscroll_stats';

  public static async getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      chrome.storage.local.get([StorageService.SETTINGS_KEY], (result) => {
        const defaultSettings: ExtensionSettings = {
          filterEnabled: true,
          sensitivityMode: 'study_only',
          blockShortsAndReels: true,
          blurOnly: true,
          sensitivityThreshold: 0.45,
        };
        resolve(
          result[StorageService.SETTINGS_KEY]
            ? { ...defaultSettings, ...result[StorageService.SETTINGS_KEY] }
            : defaultSettings
        );
      });
    });
  }

  public static async updateSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const current = await this.getSettings();
    const updated: ExtensionSettings = { ...current, ...settings };
    return new Promise((resolve) => {
      chrome.storage.local.set({ [StorageService.SETTINGS_KEY]: updated }, () => {
        resolve(updated);
      });
    });
  }

  public static async getStatistics(): Promise<StatisticsData> {
    const today = new Date().toISOString().split('T')[0];
    return new Promise((resolve) => {
      chrome.storage.local.get([StorageService.STATS_KEY], (result) => {
        const stored: StatisticsData = result[StorageService.STATS_KEY] || {
          blockedToday: 0,
          blockedTotal: 0,
          lastResetDate: today,
        };

        if (stored.lastResetDate !== today) {
          stored.blockedToday = 0;
          stored.lastResetDate = today;
          chrome.storage.local.set({ [StorageService.STATS_KEY]: stored });
        }

        resolve(stored);
      });
    });
  }

  public static async incrementBlockedCount(amount: number = 1): Promise<StatisticsData> {
    const stats = await this.getStatistics();
    stats.blockedToday += amount;
    stats.blockedTotal += amount;
    return new Promise((resolve) => {
      chrome.storage.local.set({ [StorageService.STATS_KEY]: stats }, () => {
        resolve(stats);
      });
    });
  }
}
