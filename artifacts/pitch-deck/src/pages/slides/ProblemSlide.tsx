import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function ProblemSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex items-center px-[8vw] gap-[6vw]">
        <div className="w-[42vw]">
          <div className="text-[1.1vw] font-semibold tracking-widest text-primary uppercase mb-[2vh]">The problem</div>
          <h2 className="font-display font-extrabold tracking-tight text-[3.8vw] leading-[1.1] text-text" style={{ textWrap: 'balance' }}>
            Small teams drown in repetitive work
          </h2>
          <div className="mt-[4vh] flex flex-col gap-[2.5vh]">
            <div className="flex items-start gap-[1vw]">
              <div className="mt-[1vh] w-[0.6vw] h-[0.6vw] rounded-full bg-primary shrink-0" />
              <p className="text-[1.5vw] text-muted leading-relaxed">Manual tasks eat hours every week — copying data, chasing documents, sending the same reports</p>
            </div>
            <div className="flex items-start gap-[1vw]">
              <div className="mt-[1vh] w-[0.6vw] h-[0.6vw] rounded-full bg-primary shrink-0" />
              <p className="text-[1.5vw] text-muted leading-relaxed">Tools are scattered — nothing talks to anything else without a developer</p>
            </div>
            <div className="flex items-start gap-[1vw]">
              <div className="mt-[1vh] w-[0.6vw] h-[0.6vw] rounded-full bg-primary shrink-0" />
              <p className="text-[1.5vw] text-muted leading-relaxed">No visibility — when something breaks, nobody notices until it matters</p>
            </div>
          </div>
        </div>
        <div className="w-[36vw] bg-card border border-white/10 rounded-[1vw] p-[2vw]">
          <div className="flex items-center gap-[0.5vw] mb-[2.5vh]">
            <div className="w-[0.7vw] h-[0.7vw] rounded-full bg-white/20" />
            <div className="w-[0.7vw] h-[0.7vw] rounded-full bg-white/20" />
            <div className="w-[0.7vw] h-[0.7vw] rounded-full bg-white/20" />
          </div>
          <div className="flex items-center justify-between bg-white/5 rounded-[0.6vw] px-[1.2vw] py-[1.5vh] mb-[1.5vh]">
            <span className="text-[1.2vw] text-white/80">Copy invoices into spreadsheet</span>
            <span className="text-[1vw] text-white/40">every day</span>
          </div>
          <div className="flex items-center justify-between bg-white/5 rounded-[0.6vw] px-[1.2vw] py-[1.5vh] mb-[1.5vh]">
            <span className="text-[1.2vw] text-white/80">Retype PDF data by hand</span>
            <span className="text-[1vw] text-white/40">hours lost</span>
          </div>
          <div className="flex items-center justify-between bg-white/5 rounded-[0.6vw] px-[1.2vw] py-[1.5vh] mb-[1.5vh]">
            <span className="text-[1.2vw] text-white/80">Compile the weekly report</span>
            <span className="text-[1vw] text-white/40">again</span>
          </div>
          <div className="flex items-center justify-between border border-primary/40 bg-primary/10 rounded-[0.6vw] px-[1.2vw] py-[1.5vh]">
            <span className="text-[1.2vw] text-white">Did it actually run?</span>
            <span className="text-[1vw] text-primary font-semibold">unknown</span>
          </div>
        </div>
      </div>
      <Footer page="02" />
    </div>
  );
}
