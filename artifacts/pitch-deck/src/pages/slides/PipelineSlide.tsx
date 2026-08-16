import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function PipelineSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex items-center px-[8vw] gap-[6vw]">
        <div className="w-[38vw]">
          <div className="text-[1.1vw] font-semibold tracking-widest text-primary uppercase mb-[2vh]">The template pipeline</div>
          <h2 className="font-display font-extrabold tracking-tight text-[3.8vw] leading-[1.1] text-text" style={{ textWrap: 'balance' }}>
            QCR Scan is only the first
          </h2>
          <p className="mt-[3vh] text-[1.5vw] text-muted leading-relaxed" style={{ textWrap: 'pretty' }}>
            The gallery grows with what users actually ask for — every new template ships to everyone at once.
          </p>
        </div>
        <div className="w-[40vw] flex flex-col gap-[1.6vh]">
          <div className="bg-card border border-white/10 rounded-[0.8vw] px-[1.6vw] py-[1.8vh] flex items-center justify-between">
            <span className="text-[1.4vw] text-white/90">Recurring email automation</span>
            <span className="text-[1vw] text-white/40">coming soon</span>
          </div>
          <div className="bg-card border border-white/10 rounded-[0.8vw] px-[1.6vw] py-[1.8vh] flex items-center justify-between">
            <span className="text-[1.4vw] text-white/90">Scheduled report generation</span>
            <span className="text-[1vw] text-white/40">coming soon</span>
          </div>
          <div className="bg-card border border-white/10 rounded-[0.8vw] px-[1.6vw] py-[1.8vh] flex items-center justify-between">
            <span className="text-[1.4vw] text-white/90">Invoice data extraction</span>
            <span className="text-[1vw] text-white/40">coming soon</span>
          </div>
          <div className="bg-card border border-white/10 rounded-[0.8vw] px-[1.6vw] py-[1.8vh] flex items-center justify-between">
            <span className="text-[1.4vw] text-white/90">Slack, Notion and Jira connectors</span>
            <span className="text-[1vw] text-white/40">coming soon</span>
          </div>
          <div className="border border-primary/40 bg-primary/10 rounded-[0.8vw] px-[1.6vw] py-[1.8vh] flex items-center justify-between">
            <span className="text-[1.4vw] text-white">Requested by users</span>
            <span className="text-[1vw] text-primary font-semibold">always open</span>
          </div>
        </div>
      </div>
      <Footer page="08" />
    </div>
  );
}
