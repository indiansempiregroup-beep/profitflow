import { InternalEventBus } from '@/exchanges/market-data/event-bus.js';
import { NormalizedMarketStore } from '@/exchanges/market-data/store.js';
import { ProviderHealthMonitor } from '@/exchanges/market-data/health-monitor.js';
import { StaleDataDetector } from '@/exchanges/market-data/stale-detector.js';
import { ScannerEngine } from '@/scanner/scanner-engine.js';
import { OpportunityEvaluationService } from './opportunity-evaluation-service.js';
import type { ValidatedOpportunity } from '@profitflow/shared';
import {
  SimpleConfidenceScorer,
  SimpleFeeAnalyzer,
  SimpleLiquidityAnalyzer,
  SimpleSlippageEstimator,
} from './evaluation-services.js';

interface OpportunityEngineOptions {
  eventBus?: InternalEventBus;
  store?: NormalizedMarketStore;
  healthMonitor?: ProviderHealthMonitor;
  staleDetector?: StaleDataDetector;
}

export class OpportunityEngine {
  private readonly eventBus: InternalEventBus;
  private readonly store: NormalizedMarketStore;
  private readonly healthMonitor: ProviderHealthMonitor;
  private readonly staleDetector: StaleDataDetector;
  private readonly scanner: ScannerEngine;
  private readonly evaluationService: OpportunityEvaluationService;

  constructor(options: OpportunityEngineOptions = {}) {
    this.eventBus = options.eventBus ?? new InternalEventBus();
    this.store = options.store ?? new NormalizedMarketStore();
    this.healthMonitor = options.healthMonitor ?? new ProviderHealthMonitor();
    this.staleDetector = options.staleDetector ?? new StaleDataDetector(5000);

    this.scanner = new ScannerEngine({
      eventBus: this.eventBus,
      store: this.store,
      staleDetector: this.staleDetector,
    });

    this.evaluationService = new OpportunityEvaluationService({
      eventBus: this.eventBus,
      store: this.store,
      staleDetector: this.staleDetector,
      feeAnalyzer: new SimpleFeeAnalyzer(),
      liquidityAnalyzer: new SimpleLiquidityAnalyzer(),
      slippageEstimator: new SimpleSlippageEstimator(),
      confidenceScorer: new SimpleConfidenceScorer(),
    });
  }

  start(): void {
    this.scanner.start();
    this.evaluationService.start();
  }

  stop(): void {
    this.scanner.stop();
    this.evaluationService.stop();
  }

  getEventBus(): InternalEventBus {
    return this.eventBus;
  }

  getStore(): NormalizedMarketStore {
    return this.store;
  }

  getHealthMonitor(): ProviderHealthMonitor {
    return this.healthMonitor;
  }

  getValidatedOpportunities(): ValidatedOpportunity[] {
    return this.evaluationService.getValidatedOpportunities();
  }
}
