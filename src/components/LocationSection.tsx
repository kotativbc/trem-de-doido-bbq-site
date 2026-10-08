import type { LucideIcon } from "lucide-react";
import { MapPin, Clock, Phone, Instagram } from "lucide-react";
import { instagramUrl, mapEmbedUrl, telUrl } from "@/config/business";
import { describeClosedDays, describeOpeningHours } from "@/domain/hours";
import { useSettings } from "@/hooks/useSettings";

interface InfoLine {
  text: string;
  className: string;
  href?: string;
}

interface InfoBlock {
  id?: string;
  icon: LucideIcon;
  title: string;
  lines: InfoLine[];
}

const LocationSection = () => {
  const settings = useSettings();

  const closedText = describeClosedDays(settings.hours);

  const infoBlocks: InfoBlock[] = [
    {
      icon: MapPin,
      title: "ENDEREÇO",
      lines: [{ text: settings.addressFull, className: "text-muted-foreground" }],
    },
    {
      id: "horarios",
      icon: Clock,
      title: "HORÁRIO DE FUNCIONAMENTO",
      lines: [
        ...describeOpeningHours(settings.hours).map((text) => ({ text, className: "text-muted-foreground" })),
        ...(closedText ? [{ text: closedText, className: "text-red-500 text-sm" }] : []),
      ],
    },
    {
      icon: Phone,
      title: "CONTATO",
      lines: [{ text: settings.phoneDisplay, className: "text-primary", href: telUrl(settings.whatsappNumber) }],
    },
    {
      icon: Instagram,
      title: "REDES SOCIAIS",
      lines: [
        {
          text: `@${settings.instagramHandle}`,
          className: "text-muted-foreground",
          href: instagramUrl(settings.instagramHandle),
        },
      ],
    },
  ];

  return (
    <section id="localizacao" className="py-20 bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-primary text-center mb-12">
          LOCALIZAÇÃO & HORÁRIOS
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Left Column - Google Maps */}
          <div className="rounded-2xl overflow-hidden h-[350px] lg:h-full min-h-[350px]">
            <iframe
              title={`Localização ${settings.name}`}
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Right Column - Info Blocks */}
          <div className="flex flex-col space-y-6">
            {infoBlocks.map(({ id, icon: Icon, title, lines }) => (
              <div key={title} id={id} className="flex items-start gap-4 scroll-mt-24">
                <div className="bg-[#1A1A1A] w-12 h-12 flex items-center justify-center rounded-full shrink-0">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-['Bebas_Neue'] text-xl text-foreground tracking-wide">{title}</p>
                  {lines.map((line) =>
                    line.href ? (
                      <p key={line.text}>
                        <a
                          href={line.href}
                          target={line.href.startsWith("http") ? "_blank" : undefined}
                          rel={line.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className={`${line.className} hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded`}
                        >
                          {line.text}
                        </a>
                      </p>
                    ) : (
                      <p key={line.text} className={line.className}>
                        {line.text}
                      </p>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
