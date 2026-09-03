import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Controls the 3 collapsible panels
// persist = saved to localStorage, survives refresh
interface UIState {
  sidebarExpanded: boolean
  caseListVisible: boolean
  aiPanelVisible:  boolean
  toggleSidebar:   () => void
  toggleCaseList:  () => void
  toggleAIPanel:   () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarExpanded: false,
      caseListVisible: true,
      aiPanelVisible:  true,
      toggleSidebar:   () => set(s => ({ sidebarExpanded: !s.sidebarExpanded })),
      toggleCaseList:  () => set(s => ({ caseListVisible: !s.caseListVisible  })),
      toggleAIPanel:   () => set(s => ({ aiPanelVisible:  !s.aiPanelVisible   })),
    }),
    { name: 'clausio-ui' }
  )
)

// Stores who is logged in
interface AuthState {
  userName:  string
  userRole:  string
  isLoggedIn: boolean
  login:  (name: string, role: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userName:   'Parth Bindra',
      userRole:   'Senior Adv.',
      isLoggedIn: false,
      login:  (name, role) => set({ userName: name, userRole: role, isLoggedIn: true }),
      logout: () => set({ isLoggedIn: false }),
    }),
    { name: 'clausio-auth' }
  )
)
