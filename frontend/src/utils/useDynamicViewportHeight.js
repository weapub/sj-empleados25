import { useEffect } from 'react';

export function useDynamicViewportHeight(varName = '--app-dvh') {
  useEffect(() => {
    const setDvh = () => {
      const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty(varName, `${height}px`);
    };

    setDvh();
    window.addEventListener('resize', setDvh);
    window.addEventListener('orientationchange', setDvh);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setDvh);
    }

    return () => {
      window.removeEventListener('resize', setDvh);
      window.removeEventListener('orientationchange', setDvh);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setDvh);
      }
    };
  }, [varName]);
}