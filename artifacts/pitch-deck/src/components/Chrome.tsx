export function Backdrop() {
  return (
    <>
      <div className="absolute -top-[20vh] -right-[10vw] w-[50vw] h-[50vw] rounded-full bg-primary opacity-5 blur-[8vw]" />
      <div className="absolute -bottom-[30vh] -left-[15vw] w-[60vw] h-[60vw] rounded-full bg-accent opacity-5 blur-[10vw]" />
      <div className="deck-grid absolute inset-0 opacity-50 pointer-events-none" />
    </>
  );
}

export function Header() {
  return (
    <>
      <div className="absolute top-[5vh] left-[5vw] flex items-center gap-[1vw] z-10">
        <div className="w-[2vw] h-[2vw] bg-primary rounded-[0.4vw]" />
        <div className="text-[1.2vw] font-bold tracking-tight text-text">AI Automation Hub</div>
      </div>
      <div className="absolute top-[5vh] right-[5vw] text-[1vw] text-white/50 z-10">2026</div>
    </>
  );
}

export function Footer({ page }: { page: string }) {
  return (
    <>
      <div className="absolute bottom-[5vh] left-[5vw] text-[0.9vw] text-white/40 tracking-widest">
        AI AUTOMATION HUB
      </div>
      <div className="absolute bottom-[5vh] right-[5vw] text-[0.9vw] text-white/40 tracking-widest">
        {page}
      </div>
    </>
  );
}
