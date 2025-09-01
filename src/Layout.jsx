import { ScrollRestoration, Outlet } from 'react-router-dom'
import { Navbar } from './components/Navbar.jsx'

export function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
