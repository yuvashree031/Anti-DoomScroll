export type ClassificationCategory =
  | 'informative educational guide or technical tutorial'
  | 'documentary, scientific analysis, or factual review'
  | 'sensational clickbait or exaggerated hype'
  | 'rage bait, angry controversy, or dramatic conflict'
  | 'viral prank, challenge, or mindless entertainment';

export interface ClassificationScore {
  label: ClassificationCategory;
  score: number;
}

export interface ClassificationResult {
  sequence: string;
  labels: ClassificationCategory[];
  scores: number[];
  topLabel: ClassificationCategory;
  topScore: number;
  isFlagged: boolean;
  flaggedReason?: 'clickbait' | 'rage-bait' | 'toxicity' | 'distraction' | 'music' | 'trailer' | 'gossip' | 'reaction' | 'beauty';
  isInformative: boolean;
  confidence: number;
}

export type TargetPlatform = 'twitter' | 'youtube' | 'instagram' | 'generic';

export interface ClassificationRequestPayload {
  nodeId: string;
  text: string;
  platform: TargetPlatform;
}

export type SensitivityMode = 'study_only' | 'balanced' | 'strict' | 'aggressive';

export interface ExtensionSettings {
  filterEnabled: boolean;
  sensitivityMode: SensitivityMode;
  blockShortsAndReels: boolean;
  blurOnly: boolean;
  sensitivityThreshold: number;
}

export type RuntimeMessageType =
  | 'CLASSIFY_TEXT'
  | 'GET_FILTER_STATUS'
  | 'SET_FILTER_STATUS'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'INCREMENT_BLOCKED_COUNT'
  | 'GET_STATISTICS';

export interface BaseRuntimeMessage<T = unknown> {
  type: RuntimeMessageType;
  payload: T;
}

export interface ClassifyTextMessage extends BaseRuntimeMessage<ClassificationRequestPayload> {
  type: 'CLASSIFY_TEXT';
}

export interface FilterStatusPayload {
  enabled: boolean;
}

export interface IncrementBlockedPayload {
  count: number;
}

export interface StatisticsData {
  blockedToday: number;
  blockedTotal: number;
  lastResetDate: string;
}

export interface RuntimeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
