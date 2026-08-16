import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function TrustSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <div className="text-[1.1vw] font-semibold tracking-widest text-primary uppercase mb-[2vh]">Trust and visibility</div>
        <h2 className="font-display font-extrabold tracking-tight text-[3.8vw] leading-[1.1] text-text max-w-[62vw]" style={{ textWrap: 'balance' }}>
          Users always know what ran, and what didn't
        </h2>
        <div className="mt-[5vh] grid grid-cols-2 gap-x-[3vw] gap-y-[3vh] max-w-[74vw]">
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] bg-primary/15 flex items-center justify-center shrink-0 text-primary text-[1.4vw] font-bold">✓</div>
            <div>
              <div className="text-[1.5vw] font-bold text-text">Personal access keys</div>
              <p className="text-[1.3vw] text-muted leading-relaxed">Each user, each template — revocable at any time</p>
            </div>
          </div>
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] bg-primary/15 flex items-center justify-center shrink-0 text-primary text-[1.4vw] font-bold">✓</div>
            <div>
              <div className="text-[1.5vw] font-bold text-text">Run history everywhere</div>
              <p className="text-[1.3vw] text-muted leading-relaxed">Every run recorded, visible on web and mobile</p>
            </div>
          </div>
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] bg-accent/15 flex items-center justify-center shrink-0 text-accent text-[1.4vw] font-bold">✓</div>
            <div>
              <div className="text-[1.5vw] font-bold text-text">Weekly digests</div>
              <p className="text-[1.3vw] text-muted leading-relaxed">A summary of activity delivered by email</p>
            </div>
          </div>
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-[0.6vw] bg-accent/15 flex items-center justify-center shrink-0 text-accent text-[1.4vw] font-bold">✓</div>
            <div>
              <div className="text-[1.5vw] font-bold text-text">No silent failures</div>
              <p className="text-[1.3vw] text-muted leading-relaxed">Errors surface honestly instead of disappearing</p>
            </div>
          </div>
        </div>
      </div>
      <Footer page="06" />
    </div>
  );
}
