import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function SolutionSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <div className="text-[1.1vw] font-semibold tracking-widest text-primary uppercase mb-[2vh]">The solution</div>
        <h2 className="font-display font-extrabold tracking-tight text-[3.8vw] leading-[1.1] text-text max-w-[60vw]" style={{ textWrap: 'balance' }}>
          A gallery of ready-made automations
        </h2>
        <div className="mt-[5vh] grid grid-cols-3 gap-[2vw]">
          <div className="bg-card border border-white/10 rounded-[1vw] p-[2vw]">
            <div className="w-[3vw] h-[3vw] rounded-[0.7vw] bg-primary/15 flex items-center justify-center mb-[2.5vh]">
              <div className="w-[1.3vw] h-[1.3vw] rounded-[0.3vw] bg-primary" />
            </div>
            <div className="text-[1.6vw] font-bold text-text mb-[1.2vh]">Curated gallery</div>
            <p className="text-[1.3vw] text-muted leading-relaxed">Browse a catalogue of business automations, each one built and tested by the platform owner</p>
          </div>
          <div className="bg-card border border-white/10 rounded-[1vw] p-[2vw]">
            <div className="w-[3vw] h-[3vw] rounded-[0.7vw] bg-accent/15 flex items-center justify-center mb-[2.5vh]">
              <div className="w-[1.3vw] h-[1.3vw] rounded-full bg-accent" />
            </div>
            <div className="text-[1.6vw] font-bold text-text mb-[1.2vh]">One click to run</div>
            <p className="text-[1.3vw] text-muted leading-relaxed">No coding, no setup wizards — pick a template, connect it, and it works</p>
          </div>
          <div className="bg-card border border-white/10 rounded-[1vw] p-[2vw]">
            <div className="w-[3vw] h-[3vw] rounded-[0.7vw] bg-primary/15 flex items-center justify-center mb-[2.5vh]">
              <div className="w-[1.5vw] h-[0.9vw] rounded-full border-[0.2vw] border-primary" />
            </div>
            <div className="text-[1.6vw] font-bold text-text mb-[1.2vh]">Personal access key</div>
            <p className="text-[1.3vw] text-muted leading-relaxed">Every user gets their own key per template — secure, revocable, and tracked</p>
          </div>
        </div>
      </div>
      <Footer page="03" />
    </div>
  );
}
