import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function ClosingSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex items-center justify-center px-[10vw]">
        <div className="w-[64vw] bg-white/5 border border-white/10 rounded-[1.4vw] px-[5vw] py-[8vh] text-center backdrop-blur">
          <div className="mx-auto w-[3.2vw] h-[3.2vw] bg-primary rounded-[0.7vw] mb-[3.5vh]" />
          <h2 className="font-display font-extrabold tracking-tighter text-[4.6vw] leading-[1.08] text-text" style={{ textWrap: 'balance' }}>
            Let's automate the{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">busywork</span>
          </h2>
          <p className="mt-[3vh] text-[1.6vw] text-muted leading-relaxed max-w-[42vw] mx-auto" style={{ textWrap: 'pretty' }}>
            AI Automation Hub — one-click automations for everyday business work. Live today, growing every week.
          </p>
        </div>
      </div>
      <Footer page="10" />
    </div>
  );
}
