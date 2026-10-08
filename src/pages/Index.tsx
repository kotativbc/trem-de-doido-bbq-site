import SeoHead from "@/components/SeoHead";
import StickyHeader from "@/components/StickyHeader";
import HeroSection from "@/components/HeroSection";
import SocialProof from "@/components/SocialProof";
import MenuSection from "@/components/MenuSection";
import PitmasterSection from "@/components/PitmasterSection";
import LocationSection from "@/components/LocationSection";
import FooterSection from "@/components/FooterSection";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileCartBar from "@/components/MobileCartBar";
import CartDrawer from "@/components/cart/CartDrawer";

const Index = () => (
  <div className="min-h-screen bg-background pb-[80px] md:pb-0">
    <a
      href="#conteudo"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
    >
      Pular para o conteúdo
    </a>
    <SeoHead />
    <StickyHeader />
    <main id="conteudo" tabIndex={-1} className="outline-none">
      <HeroSection />
      <SocialProof />
      <MenuSection />
      <PitmasterSection />
      <LocationSection />
    </main>
    <FooterSection />
    <CartDrawer />
    <MobileCartBar />
    <MobileBottomNav />
  </div>
);

export default Index;
