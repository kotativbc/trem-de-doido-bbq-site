import { describe, expect, it } from "vitest";
import { defaultBusinessSettings } from "@/config/business";
import { buildRestaurantJsonLd } from "./seo";

describe("buildRestaurantJsonLd", () => {
  const json = buildRestaurantJsonLd(defaultBusinessSettings, { siteUrl: "https://exemplo.com.br" });

  it("usa os dados centrais do restaurante", () => {
    expect(json["@type"]).toBe("Restaurant");
    expect(json.name).toBe("Trem de Doido BBQ");
    expect(json.telephone).toBe("+5531997036657");
    expect(json.address).toMatchObject({
      streetAddress: "Av. João Pinheiro, 107",
      addressLocality: "Sarzedo",
      addressRegion: "MG",
      addressCountry: "BR",
    });
    expect(json.url).toBe("https://exemplo.com.br");
  });

  it("lista só os dias abertos (quarta a domingo, 18:00–23:00)", () => {
    const spec = json.openingHoursSpecification as { dayOfWeek: string; opens: string; closes: string }[];
    expect(spec.map((s) => s.dayOfWeek)).toEqual(["Sunday", "Wednesday", "Thursday", "Friday", "Saturday"]);
    expect(spec.every((s) => s.opens === "18:00" && s.closes === "23:00")).toBe(true);
  });

  it("acompanha alterações de configuração e omite url quando não informada", () => {
    const changed = buildRestaurantJsonLd({ ...defaultBusinessSettings, phoneDisplay: "x", whatsappNumber: "5531911112222" });
    expect(changed.telephone).toBe("+5531911112222");
    expect("url" in changed).toBe(false);
  });
});
