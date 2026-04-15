import { MapPin, Clock, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const hours = [
  { day: "Segunda", time: "FECHADO", open: false },
  { day: "Terça-feira", time: "FECHADO", open: false },
  { day: "Quarta", time: "18:00 – 23:00", open: true },
  { day: "Quinta", time: "18:00 – 23:00", open: true },
  { day: "Sexta", time: "18:00 – 23:00", open: true },
  { day: "Sábado", time: "18:00 – 23:00", open: true },
  { day: "Domingo", time: "18:00 – 23:00", open: true },
];

const LocationSection = () => (
  <section id="localizacao" className="py-20">
    <div className="container mx-auto px-4">
      <h2 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-foreground text-center mb-12">LOCALIZAÇÃO & HORÁRIOS</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        <div>
          <div className="flex items-start gap-3 mb-6">
            <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="text-foreground font-semibold">Endereço</p>
              <p className="text-muted-foreground">Av. João Pinheiro, 107 — Sarzedo, MG</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => window.open("https://maps.google.com/?q=Av.+João+Pinheiro,+107,+Sarzedo,+MG", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir no Google Maps
          </Button>
        </div>

        <div id="horarios">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-primary" />
            <p className="text-foreground font-semibold">Horários de Funcionamento</p>
          </div>
          <div className="space-y-2">
            {hours.map((h) => (
              <div key={h.day} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{h.day}</span>
                <span className={`flex items-center gap-1 ${h.open ? "text-green-400" : "text-destructive"}`}>
                  {h.open ? "✅" : <X className="h-4 w-4" />}
                  {h.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LocationSection;
