---
name: aiw3-backtester
description: Natural language → strategy code → backtest report (no client API key) — powered by AIW3 AI Trade
version: 1.0.0
homepage: https://aitrading.aiw3.ai
metadata:
  clawdbot:
    emoji: "🧪"
    requires:
      env: []
    files: ["plugin.ts"]
tags: [backtest, trading, quant, finance, strategy, aiw3, ai-trade, report]
---

# AIW3 Backtester

Turn a human strategy idea into runnable strategy code, then instantly get a backtest report (equity curve, Sharpe, drawdown, trades).

This skill is designed for publishing on third‑party skill platforms:

- **No client API key needed**: callers do **not** pass `X-API-KEY`. The server uses its own `.env` config to reach the backtest engine.
- **Two-step or one-step**: generate strategy code only, or generate + backtest in a single request.

## What it does

- **Write strategy code from natural language**: `prompt` → `strategy_code`
- **Backtest report**: run backtest and return structured report JSON
- **LLM selectable**: `gemini` / `openai` / `claude` (server-side)

## Setup

You need an AIW3 AI Trade server running (local or hosted).

### Server requirements (self-host)

- Start the server (default port `3008`)
- Ensure your server has these env configured (server-side):
  - `BACKTEST_API_V2_URL` (backtest engine)
  - `BACKTEST_API_V2_KEY` (server → backtest engine key)
  - Your LLM provider keys (e.g. `GOOGLE_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`)

### Skill client config

Optional environment variables for the skill client:

| Variable | Required | Description | Default |
|---|---|---|---|
| `AIW3_BACKTESTER_BASE_URL` | No | AIW3 AI Trade base URL | `http://localhost:3008` |

## Usage examples

### 1) Natural language → strategy code

```bash
curl -s -X POST "$AIW3_BACKTESTER_BASE_URL/open/aiw3-backtester/strategy-code" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write an EMA(20) / EMA(60) crossover strategy for BTC/USDT with 2% stop loss and 4% take profit. Output only strategy code.",
    "llm": "gemini"
  }'
```

### 2) Natural language → strategy code → backtest report (one call)

```bash
curl -s -X POST "$AIW3_BACKTESTER_BASE_URL/open/aiw3-backtester/backtest" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write an EMA(20) / EMA(60) crossover strategy for BTC/USDT with 2% stop loss and 4% take profit. Output only strategy code.",
    "llm": "gemini",
    "symbol": "BTC/USDT",
    "timeframe": "1h",
    "limit": 1000,
    "exchange": "Binance",
    "market_type": "perpetual"
  }'
```

### 3) Backtest from existing strategy code (skip LLM)

```bash
curl -s -X POST "$AIW3_BACKTESTER_BASE_URL/open/aiw3-backtester/backtest" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_code": "class MyStrategy(BaseStrategy): ...",
    "symbol": "BTC/USDT",
    "timeframe": "1h",
    "limit": 1000,
    "exchange": "Binance",
    "market_type": "perpetual"
  }'
```

### 4) TypeScript SDK usage (`plugin.ts`)

`skills/aiw3-backtester/plugin.ts` is a tiny client wrapper around the two HTTP endpoints above. It exists so skill platforms (or your own apps) can call the skill with typed methods instead of hand-written `curl`.

```ts
import { Aiw3BacktesterPlugin } from './plugin';

const aiw3 = new Aiw3BacktesterPlugin(process.env.AIW3_BACKTESTER_BASE_URL);

// 1) prompt -> strategy code
const codeRes = await aiw3.strategyCode({
  prompt: 'Write an EMA(20)/EMA(60) BTC/USDT strategy with 2% SL and 4% TP. Output only code.',
  llm: 'gemini',
});
console.log(codeRes.strategy_code);

// 2) prompt -> code -> backtest report
const btRes = await aiw3.backtest({
  prompt: 'Same strategy as above, output only code.',
  llm: 'gemini',
  symbol: 'BTC/USDT',
  timeframe: '1h',
  limit: 1000,
  exchange: 'Binance',
  market_type: 'perpetual',
});
console.log(btRes.backtest_report.performance_stats);
```

## API reference (skill endpoints)

### `POST /open/aiw3-backtester/strategy-code`

**Body**

- `prompt` (string, required): natural language strategy description
- `llm` (string, optional): `gemini` / `openai` / `claude` (default `gemini`)
- `conversation` (array, optional): chat history passed to the LLM

**Response**

- `data.strategy_code` (string): generated strategy code
- `data.raw` (any): raw LLM response payload

### `POST /open/aiw3-backtester/backtest`

**Body (either `prompt` or `strategy_code`)**

- `prompt` (string, optional): natural language strategy description
- `strategy_code` (string, optional): strategy code string
- `llm` (string, optional): `gemini` / `openai` / `claude` (default `gemini`)
- `conversation` (array, optional)
- `symbol` (string, required): e.g. `BTC/USDT`
- `timeframe` (string, optional): default `1h`
- `limit` (number, optional): default `1000`
- `exchange` (string, optional): e.g. `Binance`
- `market_type` (string, optional): `spot` / `perpetual`
- `start_date` / `end_date` (number, optional): unix ms timestamps
- `initial_balance` (number, optional)
- `fee` (number, optional)
- `input_parameters` / `attribute_parameters` (any, optional)

**Response**

- `data.strategy_code` (string)
- `data.backtest_report` (object): includes `equity_curve`, `performance_stats`, `risk_performance`, `trades`, etc.

## External endpoints (server-side)

This skill calls your AIW3 AI Trade server only:

| Endpoint | Purpose | Data Sent |
|---|---|---|
| `/open/aiw3-backtester/strategy-code` | LLM strategy code generation | Prompt + optional conversation |
| `/open/aiw3-backtester/backtest` | Backtest execution | Strategy code (or prompt), symbol/timeframe |

Your server may call external services internally (LLM providers + backtest engine). The client never sends backtest engine API keys.

## Security & Privacy

- **No client API key** is required to call these endpoints.
- Do **not** expose this server publicly without rate limiting / auth if you run it on the internet.
- Strategy prompts and code may be sent to your configured LLM provider (server-side).
- Backtest requests are sent to your configured backtest engine (server-side).

