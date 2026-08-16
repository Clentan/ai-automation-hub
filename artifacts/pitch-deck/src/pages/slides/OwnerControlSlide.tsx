import { Backdrop, Header, Footer } from '../../components/Chrome';

export default function OwnerControlSlide() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg font-body">
      <Backdrop />
      <Header />
      <div className="absolute inset-0 flex flex-col justify-center px-[8vw]">
        <div className="text-[1.1vw] font-semibold tracking-widest text-primary uppercase mb-[2vh]">Owner control</div>
        <h2 className="font-display font-extrabold tracking-tight text-[3.8vw] leading-[1.1] text-text max-w-[62vw]" style={{ textWrap: 'balance' }}>
          One dashboard runs the whole platform
        </h2>
        <div className="mt-[5vh] grid grid-cols-3 gap-[2vw]">
          <div className="bg-card border border-white/10 rounded-[1vw] p-[2vw]">
            <div className="text-[1.6vw] font-bold text-text mb-[1.2vh]">Admin dashboard</div>
            <p className="text-[1.3vw] text-muted leading-relaxed">See users, keys, and activity across the platform at a glance</p>
          </div>
          <div className="bg-card border border-white/10 rounded-[1vw] p-[2vw]">
            <div className="text-[1.6vw] font-bold text-text mb-[1.2vh]">User and key management</div>
            <p className="text-[1.3vw] text-muted leading-relaxed">Issue, monitor, and revoke access keys without touching code</p>
          </div>
          <div className="bg-card border border-white/10 rounded-[1vw] p-[2vw]">
            <div className="text-[1.6vw] font-bold text-text mb-[1.2vh]">Template requests</div>
            <p className="text-[1.3vw] text-muted leading-relaxed">Users ask for the automations they need — the roadmap builds itself</p>
          </div>
        </div>
      </div>
      <Footer page="07" />
    </div>
  );
}
