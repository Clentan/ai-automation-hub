import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function TitleSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[12vw]">
        <div className="flex items-center gap-[0.6vw] bg-white/5 border border-white/10 rounded-full px-[1.4vw] py-[0.7vh] mb-[4vh]">
          <div className="w-[0.6vw] h-[0.6vw] rounded-full bg-primary" />
          <span className="text-[1.1vw] text-white/80 font-medium">One-click business automation</span>
        </div>
        <h1 className="font-display font-extrabold tracking-tighter text-[6.5vw] leading-[1.05] text-text" style={{ textWrap: 'balance' }}>
          AI Automation{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Hub</span>
        </h1>
        <p className="mt-[3.5vh] text-[1.8vw] text-muted max-w-[46vw] leading-relaxed" style={{ textWrap: 'pretty' }}>
          One-click automations for everyday business work
        </p>
        <div className="mt-[5vh] flex items-center gap-[2.5vw]">
          <div className="flex items-center gap-[0.6vw] text-[1.1vw] text-white/60">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-primary" />
            Curated template gallery
          </div>
          <div className="flex items-center gap-[0.6vw] text-[1.1vw] text-white/60">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-accent" />
            Web and mobile
          </div>
          <div className="flex items-center gap-[0.6vw] text-[1.1vw] text-white/60">
            <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-primary" />
            Live in production
          </div>
        </div>
      </div>
      <Footer page="01" />
    </div>
  );
}
