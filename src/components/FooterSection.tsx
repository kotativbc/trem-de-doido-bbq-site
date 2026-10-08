import { Flame, Instagram, MessageCircle } from "lucide-react";
import { instagramUrl, whatsappChatUrl } from "@/config/business";
import { siteContent } from "@/config/siteContent";
import { useSettings } from "@/hooks/useSettings";

const iconLinkClass =
  "text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded";

const FooterSection = () => {
  const settings = useSettings();
  const { developer } = siteContent.footer;

  return (
    <footer className="border-t border-border py-8 bg-surface-dark">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-['Bebas_Neue'] text-lg tracking-wider text-foreground">{settings.name.toUpperCase()}</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <a
            href={whatsappChatUrl(settings.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className={iconLinkClass}
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          <a
            href={instagramUrl(settings.instagramHandle)}
            target="_blank"
            rel="noopener noreferrer"
            className={iconLinkClass}
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} {settings.name} — {settings.city} - Desenvolvido por{" "}
          <a
            href={whatsappChatUrl(developer.whatsappNumber, developer.message)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            {developer.name}
          </a>
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;
