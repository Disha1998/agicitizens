import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Ticker from "./components/Ticker";
import Stats from "./components/Stats";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Feed from "./components/Feed";
import Directory from "./components/Directory";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <Hero />
      <Ticker />
      <Stats />
      <Features />
      <HowItWorks />
      <Feed />
      <Directory />
      <Footer />
    </div>
  );
}
