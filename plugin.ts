import axios from 'axios';

export type LlmProvider = 'gemini' | 'openai' | 'claude';

export type StrategyCodeResult = {
  llm: LlmProvider;
  prompt: string;
  strategy_code: string;
  raw?: any;
};

export type BacktestResult = {
  symbol: string;
  timeframe: string;
  limit: number;
  exchange?: string;
  market_type?: string;
  llm?: LlmProvider;
  prompt?: string;
  strategy_code: string;
  backtest_report: any;
};

export class Aiw3BacktesterPlugin {
  private readonly baseUrl: string;

  constructor(baseUrl = process.env.AIW3_BACKTESTER_BASE_URL || 'http://localhost:3008') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async strategyCode(params: {
    prompt: string;
    llm?: LlmProvider;
    conversation?: any[];
  }): Promise<StrategyCodeResult> {
    const url = `${this.baseUrl}/open/aiw3-backtester/strategy-code`;
    const resp = await axios.post(url, params, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (resp.data?.code !== 200) {
      throw new Error(resp.data?.msg || 'strategyCode failed');
    }
    return resp.data.data as StrategyCodeResult;
  }

  async backtest(params: {
    prompt?: string;
    strategy_code?: string;
    llm?: LlmProvider;
    conversation?: any[];
    symbol: string;
    timeframe?: string;
    limit?: number;
    exchange?: string;
    market_type?: string;
    start_date?: number;
    end_date?: number;
    initial_balance?: number;
    fee?: number;
    input_parameters?: any;
    attribute_parameters?: any;
  }): Promise<BacktestResult> {
    const url = `${this.baseUrl}/open/aiw3-backtester/backtest`;
    const resp = await axios.post(url, params, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (resp.data?.code !== 200) {
      throw new Error(resp.data?.msg || 'backtest failed');
    }
    return resp.data.data as BacktestResult;
  }
}

