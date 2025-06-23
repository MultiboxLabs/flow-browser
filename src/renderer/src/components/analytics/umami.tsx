export const UmamiScriptLoader = () => {
  if (process.env.NODE_ENV !== "production") return null;

  // Umami Analytics
  // Very simple, does not collect or store personal data
  // Does not log what websites you visit, or anything similar
  return (
    <script
      defer
      src="/umami.js"
      data-host-url="https://umami.iamevan.dev"
      data-website-id="846df382-cb68-4e59-a97e-76df33a73e90"
    />
  );
};
