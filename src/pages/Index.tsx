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
    <StickyHeader />
    <HeroSection />
    <SocialProof />
    <MenuSection />
    <PitmasterSection />
    <LocationSection />
    <FooterSection />
    <CartDrawer />
    <MobileCartBar />
    <MobileBottomNav />
  </div>
);

export default Index;
