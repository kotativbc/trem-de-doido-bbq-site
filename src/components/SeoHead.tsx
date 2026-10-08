import { useEffect } from "react";
import { buildRestaurantJsonLd } from "@/domain/seo";
import { useSettings } from "@/hooks/useSettings";

const SCRIPT_ID = "ld-restaurant";

/** Injeta os dados estruturados do restaurante, sempre sincronizados com as configurações. */
const SeoHead = () => {
  const settings = useSettings();

  useEffect(() => {
    const json = buildRestaurantJsonLd(settings, { siteUrl: window.location.origin });
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(json);
    return () => script?.remove();
  }, [settings]);

  return null;
};

export default SeoHead;
