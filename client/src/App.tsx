import { useState } from 'react'
import { ThemeProvider } from '@/context/ThemeContext'
import { ChatProvider } from '@/context/ChatContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MessageList } from '@/components/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'

export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ThemeProvider>
    <ChatProvider>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 flex flex-col min-w-0 relative z-0">
          <Header
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <MessageList />
          <ChatInput />
        </main>
      </div>
    </ChatProvider>
    </ThemeProvider>
  )
}
