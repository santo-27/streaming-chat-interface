export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      <span className="w-2 h-2 bg-[#1869E8] rounded-full animate-bounce" />
      <span className="w-2 h-2 bg-[#1869E8] rounded-full animate-bounce [animation-delay:0.15s]" />
      <span className="w-2 h-2 bg-[#1869E8] rounded-full animate-bounce [animation-delay:0.3s]" />
    </div>
  )
}
