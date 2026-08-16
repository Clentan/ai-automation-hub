import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function QcrScanSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex items-center px-[8vw] gap-[6vw]">
        <div className="w-[40vw]">
          <div className="flex items-center gap-[0.8vw] mb-[2vh]">
            <div className="flex items-center gap-[0.5vw] bg-primary/15 border border-primary/40 rounded-full px-[1.1vw] py-[0.5vh]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-primary" />
              <span className="text-[1vw] text-primary font-semibold">Live today</span>
            </div>
          </div>
          <h2 className="font-display font-extrabold tracking-tight text-[3.8vw] leading-[1.1] text-text">QCR Scan</h2>
          <p className="mt-[2.5vh] text-[1.6vw] text-muted leading-relaxed" style={{ textWrap: 'pretty' }}>
            Upload a PDF, get clean structured data back — no retyping, no copy-paste.
          </p>
          <div className="mt-[3.5vh] flex flex-col gap-[2vh]">
            <div className="flex items-start gap-[1vw]">
              <div className="mt-[1vh] w-[0.6vw] h-[0.6vw] rounded-full bg-primary shrink-0" />
              <p className="text-[1.4vw] text-muted leading-relaxed">Powered by a production automation pipeline</p>
            </div>
            <div className="flex items-start gap-[1vw]">
              <div className="mt-[1vh] w-[0.6vw] h-[0.6vw] rounded-full bg-primary shrink-0" />
              <p className="text-[1.4vw] text-muted leading-relaxed">Full run history for every user, on web and mobile</p>
            </div>
          </div>
        </div>
        <div className="w-[36vw] bg-card border border-white/10 rounded-[1vw] p-[2vw]">
          <div className="flex items-center justify-between mb-[2vh]">
            <span className="text-[1.2vw] font-semibold text-text">invoice-march.pdf</span>
            <span className="text-[1vw] text-primary font-semibold bg-primary/15 rounded-full px-[1vw] py-[0.4vh]">Processed</span>
          </div>
          <div className="bg-white/5 rounded-[0.6vw] p-[1.2vw] mb-[1.2vh]">
            <div className="text-[0.95vw] text-white/40 mb-[0.5vh]">Vendor</div>
            <div className="text-[1.2vw] text-white/90">Northwind Supplies Ltd</div>
          </div>
          <div className="grid grid-cols-2 gap-[1.2vw] mb-[1.2vh]">
            <div className="bg-white/5 rounded-[0.6vw] p-[1.2vw]">
              <div className="text-[0.95vw] text-white/40 mb-[0.5vh]">Amount</div>
              <div className="text-[1.2vw] text-white/90">R 14,280.00</div>
            </div>
            <div className="bg-white/5 rounded-[0.6vw] p-[1.2vw]">
              <div className="text-[0.95vw] text-white/40 mb-[0.5vh]">Date</div>
              <div className="text-[1.2vw] text-white/90">2026-03-14</div>
            </div>
          </div>
          <div className="bg-white/5 rounded-[0.6vw] p-[1.2vw]">
            <div className="text-[0.95vw] text-white/40 mb-[0.5vh]">Line items</div>
            <div className="text-[1.2vw] text-white/90">12 extracted</div>
          </div>
        </div>
      </div>
      <Footer page="05" />
    </div>
  );
}
