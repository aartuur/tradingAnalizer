import { useEffect, useRef } from 'react';

export interface TVWidgetConfig {
  scriptSrc: string;
  containerIdPrefix: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; 
}

export const useTradingView = ({ scriptSrc, data }: TVWidgetConfig) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Riferimento locale per la cleanup function
    const refValue = containerRef.current;

    if (refValue) {
      // 1. PULIZIA TOTALE: Rimuove tutto il contenuto precedente
      refValue.innerHTML = '';

      // 2. CREAZIONE DEL CONTAINER SPECIFICO DI TRADINGVIEW
      // TradingView richiede esattamente questa classe
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container__widget';
      widgetContainer.style.width = '100%';
      widgetContainer.style.height = '100%'; // Fondamentale
      refValue.appendChild(widgetContainer);

      // 3. CREAZIONE DELLO SCRIPT
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.type = 'text/javascript';
      script.async = true;
      
      // La configurazione deve essere una stringa JSON valida
      script.innerHTML = JSON.stringify(data);

      // 4. INIEZIONE
      refValue.appendChild(script);
      
      // 5. AGGIUNTA LOGO/COPYRIGHT (Opzionale ma evita warning di layout)
      const copyright = document.createElement('div');
      copyright.className = "tradingview-widget-copyright";
      copyright.style.display = "none"; // Lo nascondiamo per pulizia
      refValue.appendChild(copyright);
    }

    // Cleanup function
    return () => {
      if (refValue) {
        refValue.innerHTML = '';
      }
    };
  }, [scriptSrc, JSON.stringify(data)]); // Rilancia solo se cambia la config

  return containerRef;
};