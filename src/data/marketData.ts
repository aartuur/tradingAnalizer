export type MarketSymbol = [string, string];

export interface CategoryData {
  label: string;
  symbols: MarketSymbol[];
  type: 'index' | 'forex' | 'crypto' | 'commodity' | 'stock';
}

export type MarketCategories = {
  [key: string]: CategoryData;
};

export const marketCategories: MarketCategories = {
  indices: {
    label: "Indici Globali",
    type: 'index',
    symbols: [
      ["S&P 500", "FOREXCOM:SPXUSD"],
      ["Nasdaq 100", "FOREXCOM:NSXUSD"],
      ["Dow Jones", "FOREXCOM:DJI"],
      ["DAX 40", "XETR:DAX"],
      ["FTSE 100", "LSE:UK100"],
      ["Nikkei 225", "TVC:NI225"],
    ],
  },
  forex: {
    label: "Forex Majors",
    type: 'forex',
    symbols: [
      ["EUR/USD", "FX:EURUSD"],
      ["GBP/USD", "FX:GBPUSD"],
      ["USD/JPY", "FX:USDJPY"],
      ["USD/CHF", "FX:USDCHF"],
      ["AUD/USD", "FX:AUDUSD"],
      ["USD/CAD", "FX:USDCAD"],
    ],
  },
  crypto: {
    label: "Criptovalute",
    type: 'crypto',
    symbols: [
      ["Bitcoin", "BINANCE:BTCUSDT"],
      ["Ethereum", "BINANCE:ETHUSDT"],
      ["Solana", "BINANCE:SOLUSDT"],
      ["Ripple", "BINANCE:XRPUSDT"],
      ["Cardano", "BINANCE:ADAUSDT"],
      ["Dogecoin", "BINANCE:DOGEUSDT"],
    ],
  },
  commodities: {
    label: "Materie Prime",
    type: 'commodity',
    symbols: [
      ["Oro", "TVC:GOLD"],
      ["Argento", "TVC:SILVER"],
      ["Petrolio WTI", "TVC:USOIL"],
      ["Petrolio Brent", "TVC:UKOIL"],
      ["Gas Naturale", "TVC:NG1!"],
      ["Rame", "COMEX:HG1!"],
    ],
  },
  tech_stocks: {
    label: "Azioni Tech",
    type: 'stock',
    symbols: [
      ["Apple", "NASDAQ:AAPL"],
      ["Microsoft", "NASDAQ:MSFT"],
      ["Nvidia", "NASDAQ:NVDA"],
      ["Google", "NASDAQ:GOOGL"],
      ["Amazon", "NASDAQ:AMZN"],
      ["Tesla", "NASDAQ:TSLA"],
    ],
  },
};