export default function KpiCard({ roman, label, value, sub }) {
  return (
    <div className="border border-ink/80 bg-paper relative p-5 flex flex-col">
      {/* registration corner dot */}
      <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-ocre" />
      <div className="font-title text-ink text-[14px] tracking-[0.18em] uppercase mb-1 pl-3">
        <span className="text-ocre-d mr-2">{roman}</span>{label}
      </div>
      <div className="font-title text-ink text-[44px] leading-none mt-2">
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] uppercase tracking-widest text-grey mt-2">
          {sub}
        </div>
      )}
    </div>
  )
}
