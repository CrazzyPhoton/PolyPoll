import { ScrollRestoration, Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar.jsx'
import { Footer } from './components/Footer.jsx'

export function Layout() {
  return (
    <div className="bg-info-subtle">
      <Navbar />
      <Outlet />
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
