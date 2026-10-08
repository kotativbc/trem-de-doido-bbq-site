import type { BusinessSettings } from "./settings";

const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export interface RestaurantJsonLdOptions {
  /** URL pública do site (sem barra final). Vazia = omite campos que dependem dela. */
  siteUrl?: string;
  imageUrl?: string;
  /** Modelo de entrega/retirada informado ao Google. */
  servesCuisine?: string;
}

/**
 * Dados estruturados schema.org/Restaurant montados a partir das configurações do restaurante,
 * para que endereço, telefone e horários nunca fiquem divergentes do site.
 */
export const buildRestaurantJsonLd = (
  settings: BusinessSettings,
  options: RestaurantJsonLdOptions = {},
): Record<string, unknown> => {
  const [locality, region] = settings.city.split("/").map((part) => part.trim());

  const openingHoursSpecification = settings.hours.flatMap((day, index) =>
    day.open
      ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: SCHEMA_DAYS[index], opens: day.from, closes: day.to }]
      : [],
  );

  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: settings.name,
    servesCuisine: options.servesCuisine ?? "American Barbecue",
    telephone: `+${settings.whatsappNumber}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine,
      addressLocality: locality,
      ...(region ? { addressRegion: region } : {}),
      addressCountry: "BR",
    },
    openingHoursSpecification,
    sameAs: [`https://instagram.com/${settings.instagramHandle}`],
  };

  if (options.siteUrl) json.url = options.siteUrl;
  if (options.imageUrl) json.image = options.imageUrl;
  return json;
};
