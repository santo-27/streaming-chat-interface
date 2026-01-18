import { MessageSquareText } from '@/components/shared/Icons'

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#1869E8]/20 to-blue-500/10 blur-2xl"></div>
          </div>
          <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#1869E8] to-[#2563eb] flex items-center justify-center shadow-xl shadow-blue-500/25">
            <MessageSquareText className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          Start a conversation
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Ask me anything! I'm here to help with questions, creative tasks, analysis, and more.
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
            Explain a concept
          </span>
          <span className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
            Write code
          </span>
          <span className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
            Analyze data
          </span>
        </div>
      </div>
    </div>
  )
}
