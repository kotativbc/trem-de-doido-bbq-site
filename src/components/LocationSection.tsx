import { MapPin, Clock, Phone, Instagram } from "lucide-react";

const infoBlocks: {
  id?: string;
  icon: typeof MapPin;
  title: string;
  lines: { text: string; className: string }[];
}[] = [
  {
    icon: MapPin,
    title: "ENDEREÇO",
    lines: [{ text: "Av. João Pinheiro, 107 - Sarzedo/MG", className: "text-muted-foreground" }],
  },
  {
    id: "horarios",
    icon: Clock,
    title: "HORÁRIO DE FUNCIONAMENTO",
    lines: [
      { text: "Quarta a Domingo: 18:00 – 23:00", className: "text-muted-foreground" },
      { text: "Fechado às segundas e terças-feiras", className: "text-red-500 text-sm" },
    ],
  },
  {
    icon: Phone,
    title: "CONTATO",
    lines: [{ text: "(31) 99703-6657", className: "text-primary" }],
  },
  {
    icon: Instagram,
    title: "REDES SOCIAIS",
    lines: [{ text: "@tremdedoidobbq", className: "text-muted-foreground" }],
  },
];

const LocationSection = () => (
  <section id="localizacao" className="py-20 bg-[#0A0A0A]">
    <div className="container mx-auto px-4">
      <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-primary text-center mb-12">
        LOCALIZAÇÃO & HORÁRIOS
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
        {/* Left Column - Google Maps */}
        <div className="rounded-2xl overflow-hidden h-[350px] lg:h-full min-h-[350px]">
          <iframe
            title="Localização Trem de Doido BBQ"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3750.8!2d-44.1346707!3d-20.0453441!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa6c70ea0bf6bb5%3A0x4ddb7497a92a1beb!2sTrem%20de%20Doido%20Barbecue!5e0!3m2!1spt-BR!2sbr!4v1"
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
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-['Bebas_Neue'] text-xl text-foreground tracking-wide">{title}</p>
                {lines.map((line, i) => (
                  <p key={i} className={line.className}>{line.text}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default LocationSection;
