import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Network, Users, Globe, BarChart2
} from 'lucide-react'
import Dashboard    from './pages/Dashboard'
import NetworkPage  from './pages/NetworkPage'
import Influencers  from './pages/Influencers'
import Communities  from './pages/Communities'
import WhiteSpace   from './pages/WhiteSpace'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview'     },
  { to: '/network',     icon: Network,          label: 'Network Map'  },
  { to: '/influencers', icon: Users,            label: 'Influencers'  },
  { to: '/communities', icon: Globe,            label: 'Communities'  },
  { to: '/whitespace',  icon: BarChart2,        label: 'White Space'  },
]

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="px-5 py-5 border-b border-gray-800">
            <span className="text-lg font-bold text-indigo-400">📊 IG SNA</span>
            <p className="text-xs text-gray-500 mt-0.5">Social Network Analysis</p>
          </div>
          <nav className="flex-1 py-4 space-y-0.5 px-2">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
            v1.0.0 — Data Intelligence
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"            element={<Dashboard />}    />
            <Route path="/network"     element={<NetworkPage />}  />
            <Route path="/influencers" element={<Influencers />}  />
            <Route path="/communities" element={<Communities />}  />
            <Route path="/whitespace"  element={<WhiteSpace />}   />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
