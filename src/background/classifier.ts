import { pipeline, env } from '@xenova/transformers';
import { ClassificationCategory, ClassificationResult, SensitivityMode } from '../types';

export class MLClassificationEngine {
  private static instance: MLClassificationEngine | null = null;
  private pipelineInstance: any = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  public static readonly CANDIDATE_LABELS: ClassificationCategory[] = [
    'informative educational guide or technical tutorial',
    'documentary, scientific analysis, or factual review',
    'sensational clickbait or exaggerated hype',
    'rage bait, angry controversy, or dramatic conflict',
    'viral prank, challenge, or mindless entertainment',
  ];

  private static readonly BEAUTY_PATTERNS = [
    /\b(fade tiny bumps|tiny bumps|comedones|dark lips|lip pigmentation|skin whitening|hair growth|hair fall|clear skin|acne treatment|glowing skin|makeup tutorial|grwm|get ready with me|outfit ideas|glow up)\b/i
  ];

  private static readonly REACTION_PATTERNS = [
    /\b(movie reaction|reaction\b|reacts to|reacting to|trailer reaction|teaser reaction|scene reaction|episode reaction)\b/i
  ];

  private static readonly MUSIC_PATTERNS = [
    /\b(video song|official video|full video|music video|lyric video|lyrical|audio song|song\b|remix|mashup|jukebox|ost|bgm)\b/i,
    /\b(mix\s*-\s*|kulam live|official music|t-series|muzik247|sonymusic|zeemusic)\b/i,
    /\b(singer|orchestra|acoustic version)\b/i
  ];

  private static readonly TRAILER_PATTERNS = [
    /\b(official trailer|official teaser|teaser|trailer|first look|promo|motion poster)\b/i,
    /\b(box office|movie scene|comedy scene|deleted scene|mass scene)\b/i
  ];

  private static readonly GOSSIP_PATTERNS = [
    /\b(wedding moments|press meet|got angry|mass speech|home tour|room tour|daily vlog|what i eat in a day|behind the scenes|celebrity interview|conversations|gossip)\b/i
  ];

  private static readonly DISTRACTION_PATTERNS = [
    /\b(ai serial|serial part|prank|roast|kadai kathai|pablobar|scariest)\b/i
  ];

  private static readonly CLICKBAIT_PATTERNS = [
    /you won't believe/i,
    /what happens next/i,
    /shocking truth/i,
    /secret (they|nobody|google|apple) (don't|doesn't) want you to know/i,
    /this changes everything/i,
    /gone wrong/i,
    /instant regret/i,
    /cops called/i,
    /free money glitch/i,
    /hack that actually works/i,
    /do not do this/i,
    /i spent \d+ (hours|days|weeks)/i,
    /i bought every/i,
    /100 days in/i,
    /in \d+ days/i,
    /insane trick/i,
    /mind blown/i,
    /and this happened/i,
    /\b(exposed|destroyed|meltdown|humiliated|slammed|canceling)\b/i
  ];

  private static readonly STUDY_PATTERNS = [
    /\b(context engineering|retrieval|hard filters|multi-turn memory)\b/i,
    /\b(docker|kubernetes|linux|devops|aws|cloud computing|system design|backend|frontend)\b/i,
    /\b(typescript|python|javascript|\breact(js)?\b|rust|golang|c\+\+|java|sql|nosql|database)\b/i,
    /\b(machine learning|data science|statistics|deep learning|neural networks|ai model|algorithms|data structures)\b/i,
    /\b(learn english|without classes|practical ways|vocabulary|pronunciation|grammar)\b/i,
    /\b(interview question|why should we hire you|job interview|career advice|resume tips|coding interview)\b/i,
    /\b(full course|crash course|one shot|beginners friendly|masterclass|lecture \d+|course \d+)\b/i,
    /\b(the psychology of|wasted potential|mental health|cognitive|neuroscience)\b/i,
    /\b(naturopathy|functional medicine|deep dive|case study|documentary|history of|macroeconomics)\b/i,
    /\b(model explained|explained|tutorial|how to build|code along)\b/i,
  ];

  private constructor() {
    this.configureEnvironment();
  }

  public static getInstance(): MLClassificationEngine {
    if (!MLClassificationEngine.instance) {
      MLClassificationEngine.instance = new MLClassificationEngine();
    }
    return MLClassificationEngine.instance;
  }

  private configureEnvironment(): void {
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
      env.backends.onnx.wasm.numThreads = 1;
    }
  }

  public async initialize(): Promise<void> {
    if (this.pipelineInstance) {
      return;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        console.log('[ML Engine] Initializing Xenova/distilbert-base-uncased-mnli (Quantized)');
        this.pipelineInstance = await pipeline(
          'zero-shot-classification',
          'Xenova/distilbert-base-uncased-mnli',
          {
            quantized: true,
          }
        );
        console.log('[ML Engine] Model pipeline ready.');
      } catch (error) {
        console.error('[ML Engine] Failed to load pipeline:', error);
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  public async classify(
    text: string,
    mode: SensitivityMode = 'study_only'
  ): Promise<ClassificationResult> {
    if (!text || text.trim().length === 0) {
      return {
        sequence: text,
        labels: MLClassificationEngine.CANDIDATE_LABELS,
        scores: [0, 0, 0, 0, 0],
        topLabel: 'informative educational guide or technical tutorial',
        topScore: 0,
        isFlagged: false,
        isInformative: true,
        confidence: 0,
      };
    }

    const trimmed = text.length > 512 ? text.slice(0, 512) : text;

    for (const pat of MLClassificationEngine.REACTION_PATTERNS) {
      if (pat.test(trimmed)) {
        return {
          sequence: trimmed,
          labels: MLClassificationEngine.CANDIDATE_LABELS,
          scores: [0.05, 0.05, 0.4, 0.1, 0.5],
          topLabel: 'viral prank, challenge, or mindless entertainment',
          topScore: 0.95,
          isFlagged: true,
          flaggedReason: 'reaction',
          isInformative: false,
          confidence: 0.95,
        };
      }
    }

    for (const pat of MLClassificationEngine.BEAUTY_PATTERNS) {
      if (pat.test(trimmed)) {
        return {
          sequence: trimmed,
          labels: MLClassificationEngine.CANDIDATE_LABELS,
          scores: [0.05, 0.05, 0.3, 0.1, 0.5],
          topLabel: 'viral prank, challenge, or mindless entertainment',
          topScore: 0.92,
          isFlagged: true,
          flaggedReason: 'beauty',
          isInformative: false,
          confidence: 0.92,
        };
      }
    }

    for (const pat of MLClassificationEngine.MUSIC_PATTERNS) {
      if (pat.test(trimmed)) {
        return {
          sequence: trimmed,
          labels: MLClassificationEngine.CANDIDATE_LABELS,
          scores: [0.05, 0.05, 0.2, 0.1, 0.6],
          topLabel: 'viral prank, challenge, or mindless entertainment',
          topScore: 0.9,
          isFlagged: true,
          flaggedReason: 'music',
          isInformative: false,
          confidence: 0.9,
        };
      }
    }

    for (const pat of MLClassificationEngine.TRAILER_PATTERNS) {
      if (pat.test(trimmed)) {
        return {
          sequence: trimmed,
          labels: MLClassificationEngine.CANDIDATE_LABELS,
          scores: [0.05, 0.05, 0.3, 0.1, 0.5],
          topLabel: 'viral prank, challenge, or mindless entertainment',
          topScore: 0.9,
          isFlagged: true,
          flaggedReason: 'trailer',
          isInformative: false,
          confidence: 0.9,
        };
      }
    }

    for (const pat of MLClassificationEngine.GOSSIP_PATTERNS) {
      if (pat.test(trimmed)) {
        return {
          sequence: trimmed,
          labels: MLClassificationEngine.CANDIDATE_LABELS,
          scores: [0.05, 0.05, 0.4, 0.2, 0.3],
          topLabel: 'sensational clickbait or exaggerated hype',
          topScore: 0.9,
          isFlagged: true,
          flaggedReason: 'gossip',
          isInformative: false,
          confidence: 0.9,
        };
      }
    }

    for (const pat of MLClassificationEngine.DISTRACTION_PATTERNS) {
      if (pat.test(trimmed)) {
        return {
          sequence: trimmed,
          labels: MLClassificationEngine.CANDIDATE_LABELS,
          scores: [0.05, 0.05, 0.3, 0.2, 0.4],
          topLabel: 'viral prank, challenge, or mindless entertainment',
          topScore: 0.88,
          isFlagged: true,
          flaggedReason: 'distraction',
          isInformative: false,
          confidence: 0.88,
        };
      }
    }

    for (const pat of MLClassificationEngine.CLICKBAIT_PATTERNS) {
      if (pat.test(trimmed)) {
        return {
          sequence: trimmed,
          labels: MLClassificationEngine.CANDIDATE_LABELS,
          scores: [0.05, 0.05, 0.6, 0.2, 0.1],
          topLabel: 'sensational clickbait or exaggerated hype',
          topScore: 0.92,
          isFlagged: true,
          flaggedReason: 'clickbait',
          isInformative: false,
          confidence: 0.92,
        };
      }
    }

    const isStudy = MLClassificationEngine.STUDY_PATTERNS.some((pat) => pat.test(trimmed));
    if (isStudy) {
      return {
        sequence: trimmed,
        labels: MLClassificationEngine.CANDIDATE_LABELS,
        scores: [0.65, 0.25, 0.05, 0.02, 0.03],
        topLabel: 'informative educational guide or technical tutorial',
        topScore: 0.95,
        isFlagged: false,
        isInformative: true,
        confidence: 0.95,
      };
    }

    if (mode === 'study_only') {
      return {
        sequence: trimmed,
        labels: MLClassificationEngine.CANDIDATE_LABELS,
        scores: [0.15, 0.15, 0.2, 0.2, 0.3],
        topLabel: 'viral prank, challenge, or mindless entertainment',
        topScore: 0.85,
        isFlagged: true,
        flaggedReason: 'distraction',
        isInformative: false,
        confidence: 0.85,
      };
    }

    await this.initialize();

    if (!this.pipelineInstance) {
      throw new Error('[ML Engine] Pipeline unavailable.');
    }

    const output = await this.pipelineInstance(trimmed, MLClassificationEngine.CANDIDATE_LABELS, {
      hypothesis_template: 'This video title represents {}.',
      multi_label: false,
    });

    const labels: ClassificationCategory[] = output.labels;
    const scores: number[] = output.scores;

    const topLabel = labels[0];
    const topScore = scores[0];

    const getScore = (label: ClassificationCategory): number => {
      const idx = labels.indexOf(label);
      return idx !== -1 ? scores[idx] : 0;
    };

    const educationalScore = getScore('informative educational guide or technical tutorial');
    const documentaryScore = getScore('documentary, scientific analysis, or factual review');
    const sensationalScore = getScore('sensational clickbait or exaggerated hype');
    const ragebaitScore = getScore('rage bait, angry controversy, or dramatic conflict');
    const viralScore = getScore('viral prank, challenge, or mindless entertainment');

    const totalInformative = educationalScore + documentaryScore;

    let isFlagged = false;
    let flaggedReason: 'clickbait' | 'rage-bait' | 'toxicity' | 'distraction' | undefined;
    let confidence = 0;

    if (mode === 'balanced') {
      if (sensationalScore >= 0.45 && sensationalScore > totalInformative) {
        isFlagged = true;
        flaggedReason = 'clickbait';
        confidence = sensationalScore;
      } else if (ragebaitScore >= 0.45 && ragebaitScore > totalInformative) {
        isFlagged = true;
        flaggedReason = 'rage-bait';
        confidence = ragebaitScore;
      }
    } else if (mode === 'strict') {
      if (sensationalScore >= 0.35 || ragebaitScore >= 0.35 || (viralScore >= 0.45 && totalInformative < 0.30)) {
        isFlagged = true;
        flaggedReason = sensationalScore >= ragebaitScore ? 'clickbait' : 'rage-bait';
        confidence = Math.max(sensationalScore, ragebaitScore, viralScore);
      }
    }

    return {
      sequence: text,
      labels,
      scores,
      topLabel,
      topScore,
      isFlagged,
      flaggedReason,
      isInformative: totalInformative >= 0.35,
      confidence: confidence || topScore,
    };
  }
}
