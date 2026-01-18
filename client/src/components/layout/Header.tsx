import { useTheme } from '@/hooks/useTheme'
import { Menu, ChevronsLeft, MessageSquareText, Sun, Moon } from '@/components/shared/Icons'

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <header className="relative bg-gradient-to-r from-[#1869E8] via-[#2563eb] to-[#3b82f6] text-white px-4 py-4 shadow-lg">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
      <div className="relative flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 -ml-2 hover:bg-white/20 rounded-xl active:scale-95 transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? (
            <ChevronsLeft className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Chat Assistant</h1>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2.5 hover:bg-white/20 rounded-xl active:scale-95 transition-colors"
          aria-label={resolvedTheme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  )
}
