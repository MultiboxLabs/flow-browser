import { useEffect } from "react";

export const UmamiScriptLoader = () => {
  // Umami Analytics
  // Very simple, does not collect or store personal data
  // Does not log what websites you visit, or anything similar
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const script = document.createElement('script');
    script.src = '/umami.js';
    script.defer = true;
    script.setAttribute('data-host-url', 'https://umami.iamevan.dev');
    script.setAttribute('data-website-id', '846df382-cb68-4e59-a97e-76df33a73e90');

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};
