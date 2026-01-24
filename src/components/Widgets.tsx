import { 
  TickerTape, 
  AdvancedRealTimeChart, 
  TechnicalAnalysis, 
  Timeline,
  EconomicCalendar,
  StockHeatmap,
  ForexCrossRates,
  CryptoCurrencyMarket,
  CompanyProfile,
  FundamentalData,
  Screener
} from "react-ts-tradingview-widgets";

export const TickerTapeWidget = () => {
  return (
    <TickerTape 
      colorTheme="dark" 
      displayMode="adaptive"
      isTransparent={true}
      showSymbolLogo={true}
      symbols={[
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
        { proName: "FX_IDC:EURUSD", title: "EUR/USD" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
        { proName: "BITSTAMP:ETHUSD", title: "Ethereum" }
      ]}
    />
  );
};

export const AdvancedChartWidget = ({ symbol }: { symbol: string }) => {
  return (
    <AdvancedRealTimeChart 
      theme="dark"
      autosize
      symbol={symbol}
      timezone="Europe/Rome"
      style="1"
      locale="it"
      toolbar_bg="#000000"
      enable_publishing={false}
      hide_side_toolbar={false}
      // IMPEDIAMO IL CAMBIO DENTRO IL GRAFICO PER MANTENERE IL SYNC
      allow_symbol_change={false} 
      details={true}
      hotlist={false} 
      calendar={false}
      width="100%"
      height="100%"
    />
  );
};

export const TechnicalWidget = ({ symbol }: { symbol: string }) => {
  return (
    <TechnicalAnalysis 
      colorTheme="dark" 
      symbol={symbol}
      width="100%"
      height="100%"
      isTransparent={false} 
      autosize
    />
  );
};

export const NewsWidget = ({ symbol }: { symbol: string }) => {
  return (
    <Timeline 
      colorTheme="dark" 
      feedMode="symbol" 
      symbol={symbol}
      width="100%"
      height="100%"
      isTransparent={false}
      displayMode="compact" 
      locale="it"
      autosize
    />
  );
};

export const CalendarWidget = () => {
  return (
    <EconomicCalendar 
      colorTheme="dark" 
      width="100%"
      height="100%"
      locale="it"
      importanceFilter="-1,0,1"
      autosize
    />
  );
};

export const HeatmapWidget = ({ type }: { type: 'stock' | 'crypto' }) => {
  if (type === 'crypto') {
    return (
      <CryptoCurrencyMarket 
        colorTheme="dark" 
        width="100%" 
        height="100%" 
        locale="it"
        autosize
      />
    );
  }
  return (
    <StockHeatmap 
      colorTheme="dark" 
      width="100%" 
      height="100%" 
      locale="it"
      autosize
    />
  );
};

export const ForexRatesWidget = () => {
  return (
    <ForexCrossRates 
      colorTheme="dark" 
      width="100%" 
      height="100%" 
      locale="it"
      autosize
    />
  );
};

export const CompanyProfileWidget = ({ symbol }: { symbol: string }) => {
  return (
    <CompanyProfile 
      symbol={symbol} 
      colorTheme="dark" 
      width="100%" 
      height="100%" 
      autosize
      locale="it"
    />
  );
};

export const FundamentalDataWidget = ({ symbol }: { symbol: string }) => {
  return (
    <FundamentalData 
      symbol={symbol} 
      colorTheme="dark" 
      width="100%" 
      height="100%" 
      autosize
      locale="it"
    />
  );
};

export const ScreenerWidget = () => {
  return (
    <Screener 
      width="100%"
      height="100%"
      defaultColumn="overview"
      defaultScreen="general"
      market="forex"
      showToolbar={true}
      colorTheme="dark"
      locale="it"
      autosize
    />
  );
};