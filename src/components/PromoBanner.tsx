import { Megaphone } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

/** Faixa de promoção configurável no painel. Some quando desligada ou sem texto. */
const PromoBanner = () => {
  const { promoBanner } = useSettings();
  if (!promoBanner.enabled || !promoBanner.text.trim()) return null;

  return (
    <aside
      aria-label="Promoção"
      className="mb-8 flex items-center justify-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-center text-sm font-medium text-foreground"
    >
      <Megaphone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{promoBanner.text}</span>
    </aside>
  );
};

export default PromoBanner;
