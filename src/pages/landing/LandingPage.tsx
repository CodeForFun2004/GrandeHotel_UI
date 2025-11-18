import ImageSlider from "./components/HeroSlider"
import WelcomeSection from "./components/WelcomeSection"
import AboutUs from "../landing/AboutUs"
import Contact from "../landing/Contact"
import VoucherForm from "./components/VoucherForm"


const LandingPage = () => {
  return (
    <div>
      <ImageSlider/>
      <VoucherForm/>
      <WelcomeSection/>
      {/* Only map the requested sections on home */}
      <AboutUs showHero={false} showStats={false} showIntro={false} showServices showInstagram />
      <Contact showHero={false} />
    </div>
  )
}

export default LandingPage
