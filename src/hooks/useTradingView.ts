import { useEffect, useRef } from 'react';

interface TVWidgetConfig {
  containerId?: string;
  scriptSrc: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; 
}

export const useTradingView = ({ scriptSrc, data }: TVWidgetConfig) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ''; // Cleanup
    }

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.style.height = '100%';
    widgetContainer.style.width = '100%';
    
    containerRef.current?.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify(data);

    containerRef.current?.appendChild(script);
  }, [JSON.stringify(data)]); // Ricarica solo se i dati cambiano

  return containerRef;
};