import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar, { Sidebar } from './components/layout/Navbar'
import Dashboard       from './pages/Dashboard'
import ReconTools      from './pages/ReconTools'
import VulnScanners    from './pages/VulnScanners'
import Exploits        from './pages/Exploits'
import AttackMap       from './pages/AttackMap'
import ScanHistory     from './pages/ScanHistory'
import AIAssistantPage from './pages/AIAssistantPage'
import ReportGenerator from './pages/ReportGenerator'
import EmailAnalyzer   from './pages/EmailAnalyzer'
import SSLChecker      from './pages/SSLChecker'
import Landing         from './pages/Landing'
import ProtectedRoute  from './components/auth/ProtectedRoute'
import DisclaimerModal from './components/ui/DisclaimerModal'

// Auth guard wrapper
const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col relative z-0">

      {/* Legal disclaimer on first visit */}
      <DisclaimerModal />

      {/* Background video — very subtle */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[-50] pointer-events-none"
        style={{ opacity: 0.05 }}
        src="/media/bg-video.mp4"
      />

      {/* Dark overlay */}
      <div className="fixed inset-0 z-[-40] bg-[#070B14]/55 bg-gradient-to-t from-[#070B14]/95 via-transparent to-[#070B14]/55 pointer-events-none" />

      <Routes>
        {/* Public — Login */}
        <Route path="/login" element={<Landing />} />

        {/* Protected — sidebar layout */}
        <Route path="*" element={
          <P>
            <div className="flex min-h-screen">

              {/* Sidebar */}
              <div
                className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                  md:translate-x-0 md:static md:z-auto md:w-60 xl:w-64 flex-shrink-0 bg-[#060a12]`}
              >
                <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
              </div>

              {/* Dark overlay behind sidebar on mobile when open */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-30 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              {/* Right column — mobile top bar + content */}
              <div className="flex-1 ml-0 flex flex-col min-w-0 overflow-x-hidden relative">

                {/* Top Navbar */}
                <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                {/* Page content */}
                <main className="flex-1 relative z-10">
                  <Routes>
                    <Route path="/"                    element={<Dashboard />} />
                    {/* Recon */}
                    <Route path="/recon/port-scanner"  element={<ReconTools />} />
                    <Route path="/recon/subdomain"     element={<ReconTools />} />
                    <Route path="/recon/whois"         element={<ReconTools />} />
                    <Route path="/recon/dns"           element={<ReconTools />} />
                    <Route path="/recon/network"       element={<ReconTools />} />
                    <Route path="/recon/ssl-checker"   element={<SSLChecker />} />
                    {/* VulnScan */}
                    <Route path="/vulnscan/password"   element={<VulnScanners />} />
                    <Route path="/vulnscan/website"    element={<VulnScanners />} />
                    <Route path="/vulnscan/wordpress"  element={<VulnScanners />} />
                    {/* Exploits */}
                    <Route path="/exploits/sqli"       element={<Exploits />} />
                    <Route path="/exploits/xss"        element={<Exploits />} />
                    {/* Other */}
                    <Route path="/attack-map"          element={<AttackMap />} />
                    <Route path="/history"             element={<ScanHistory />} />
                    <Route path="/ai"                  element={<AIAssistantPage />} />
                    <Route path="/reports"             element={<ReportGenerator />} />
                    <Route path="/intelligence/email"  element={<EmailAnalyzer />} />
                    {/* Fallback */}
                    <Route path="*"                    element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </P>
        } />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#101827',
            color: '#E2E8F0',
            border: '1px solid #1A2844',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#101827' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#101827' } },
        }}
      />
    </div>
  )
}
