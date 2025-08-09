import { RouterProvider, createBrowserRouter } from "react-router-dom"
import {AppKitProvider} from './components/AppKitProvider.jsx';
import { Layout } from './Layout.jsx';
import {Home} from './pages/Home.jsx';
import { AllPolls } from './pages/AllPolls.jsx';
import { About } from './pages/About.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'all-polls', element: <AllPolls /> },
      { path: 'about', element: <About /> }
    ]
  }
])

export default function App() {
  return (
    <AppKitProvider>
      <RouterProvider router={router} />
    </AppKitProvider>
  )
}