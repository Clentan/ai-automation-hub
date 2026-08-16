import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function HowItWorksSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <div className="text-[1.1vw] font-semibold tracking-widest text-primary uppercase mb-[2vh]">How it works</div>
        <h2 className="font-display font-extrabold tracking-tight text-[3.8vw] leading-[1.1] text-text" style={{ textWrap: 'balance' }}>
          From browse to result in seconds
        </h2>
        <div className="mt-[5vh] grid grid-cols-4 gap-[1.8vw]">
          <div className="bg-card border border-white/10 rounded-[1vw] p-[1.8vw]">
            <div className="text-[3vw] font-extrabold text-primary/60 mb-[1.5vh]">1</div>
            <div className="text-[1.4vw] font-bold text-text mb-[1vh]">Browse</div>
            <p className="text-[1.2vw] text-muted leading-relaxed">Pick an automation from the gallery</p>
          </div>
          <div className="bg-card border border-white/10 rounded-[1vw] p-[1.8vw]">
            <div className="text-[3vw] font-extrabold text-primary/60 mb-[1.5vh]">2</div>
            <div className="text-[1.4vw] font-bold text-text mb-[1vh]">Connect</div>
            <p className="text-[1.2vw] text-muted leading-relaxed">Get your personal access key with one click</p>
          </div>
          <div className="bg-card border border-white/10 rounded-[1vw] p-[1.8vw]">
            <div className="text-[3vw] font-extrabold text-accent/70 mb-[1.5vh]">3</div>
            <div className="text-[1.4vw] font-bold text-text mb-[1vh]">Upload</div>
            <p className="text-[1.2vw] text-muted leading-relaxed">Send in your document or data</p>
          </div>
          <div className="bg-card border border-primary/40 rounded-[1vw] p-[1.8vw] bg-gradient-to-b from-primary/10 to-transparent">
            <div className="text-[3vw] font-extrabold text-primary mb-[1.5vh]">4</div>
            <div className="text-[1.4vw] font-bold text-text mb-[1vh]">Results</div>
            <p className="text-[1.2vw] text-muted leading-relaxed">Structured output back in seconds</p>
          </div>
        </div>
      </div>
      <Footer page="04" />
    </div>
  );
}
