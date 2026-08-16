import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function WhyNowSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <div className="text-[1.1vw] font-semibold tracking-widest text-primary uppercase mb-[2vh]">Why now</div>
        <h2 className="font-display font-extrabold tracking-tight text-[3.8vw] leading-[1.1] text-text max-w-[64vw]" style={{ textWrap: 'balance' }}>
          AI made automation possible — nobody made it simple
        </h2>
        <div className="mt-[5vh] grid grid-cols-3 gap-[2.5vw]">
          <div>
            <div className="text-[1.7vw] font-bold text-primary mb-[1.2vh]">AI is ready</div>
            <p className="text-[1.35vw] text-muted leading-relaxed">Document extraction and workflow AI now work reliably enough for real business use</p>
          </div>
          <div>
            <div className="text-[1.7vw] font-bold text-accent mb-[1.2vh]">Small teams are priced out</div>
            <p className="text-[1.35vw] text-muted leading-relaxed">Enterprise automation suites are built and priced for big companies</p>
          </div>
          <div>
            <div className="text-[1.7vw] font-bold text-primary mb-[1.2vh]">Nobody wants to build</div>
            <p className="text-[1.35vw] text-muted leading-relaxed">DIY workflow tools still demand technical skill — most people just want it done</p>
          </div>
        </div>
      </div>
      <Footer page="09" />
    </div>
  );
}
