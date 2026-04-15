import { Flame, Instagram, MessageCircle } from "lucide-react";

const FooterSection = () => (
  <footer className="border-t border-border py-8 bg-surface-dark">
    <div className="container mx-auto px-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-primary" />
        <span className="font-['Bebas_Neue'] text-lg tracking-wider text-foreground">TREM DE DOIDO BBQ</span>
      </div>
      <div className="flex items-center justify-center gap-4 mb-4">
        <a href="https://wa.me/5531997036657" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="h-5 w-5" />
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
          <Instagram className="h-5 w-5" />
        </a>
      </div>
      <p className="text-muted-foreground text-sm">© 2025 Trem de Doido BBQ — Sarzedo/MG</p>
    </div>
  </footer>
);

export default FooterSection;
