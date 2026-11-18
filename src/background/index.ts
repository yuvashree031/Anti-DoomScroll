import { MLClassificationEngine } from './classifier';
import { StorageService } from '../services/storage';
import {
  BaseRuntimeMessage,
  ClassificationRequestPayload,
  ClassificationResult,
  ExtensionSettings,
  FilterStatusPayload,
  IncrementBlockedPayload,
  RuntimeResponse,
  StatisticsData,
} from '../types';

const classifier = MLClassificationEngine.getInstance();

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Anti-Doomscroll] Service Worker installed. Initializing storage defaults.');
  StorageService.getSettings();
  StorageService.getStatistics();
});

chrome.runtime.onMessage.addListener(
  (
    message: BaseRuntimeMessage<unknown>,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: RuntimeResponse<unknown>) => void
  ) => {
    handleMessage(message)
      .then((res) => sendResponse(res))
      .catch((err) => {
        console.error('[Anti-Doomscroll] Error handling runtime message:', err);
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return true;
  }
);

async function handleMessage(message: BaseRuntimeMessage<unknown>): Promise<RuntimeResponse<unknown>> {
  if (!message || !message.type) {
    return { success: false, error: 'Invalid message envelope' };
  }

  switch (message.type) {
    case 'CLASSIFY_TEXT': {
      const payload = message.payload as ClassificationRequestPayload;
      const settings = await StorageService.getSettings();

      if (!settings.filterEnabled) {
        return {
          success: true,
          data: {
            sequence: payload.text,
            labels: MLClassificationEngine.CANDIDATE_LABELS,
            scores: [0, 0, 0, 0, 0],
            topLabel: 'informative educational guide or technical tutorial',
            topScore: 0,
            isFlagged: false,
            isInformative: true,
            confidence: 0,
          } as ClassificationResult,
        };
      }

      const classification = await classifier.classify(
        payload.text,
        settings.sensitivityMode || 'balanced'
      );

      if (classification.isFlagged) {
        await StorageService.incrementBlockedCount(1);
      }

      return {
        success: true,
        data: classification,
      };
    }

    case 'GET_FILTER_STATUS': {
      const settings = await StorageService.getSettings();
      return {
        success: true,
        data: { enabled: settings.filterEnabled },
      };
    }

    case 'SET_FILTER_STATUS': {
      const payload = message.payload as FilterStatusPayload;
      const updated = await StorageService.updateSettings({ filterEnabled: payload.enabled });
      return {
        success: true,
        data: { enabled: updated.filterEnabled },
      };
    }

    case 'GET_SETTINGS': {
      const settings = await StorageService.getSettings();
      return {
        success: true,
        data: settings,
      };
    }

    case 'UPDATE_SETTINGS': {
      const payload = message.payload as Partial<ExtensionSettings>;
      const updated = await StorageService.updateSettings(payload);
      return {
        success: true,
        data: updated,
      };
    }

    case 'GET_STATISTICS': {
      const stats: StatisticsData = await StorageService.getStatistics();
      return {
        success: true,
        data: stats,
      };
    }

    case 'INCREMENT_BLOCKED_COUNT': {
      const payload = message.payload as IncrementBlockedPayload;
      const stats = await StorageService.incrementBlockedCount(payload.count || 1);
      return {
        success: true,
        data: stats,
      };
    }

    default:
      return {
        success: false,
        error: `Unhandled message type: ${message.type}`,
      };
  }
}
