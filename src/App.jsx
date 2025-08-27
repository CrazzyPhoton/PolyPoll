import { RouterProvider, createBrowserRouter } from "react-router-dom"
import {AppKitProvider} from './components/AppKitProvider.jsx';
import { Layout } from './Layout.jsx';
import {Home} from './pages/Home.jsx';
import { AllPolls } from './pages/AllPolls.jsx';
import { MyPolls } from './pages/MyPolls.jsx';
import { ErrorPage } from "./pages/ErrorPage.jsx";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage/>,
    children: [
      { index: true, element: <Home /> },
      { path: 'all-polls', element: <AllPolls /> },
      { path: 'my-polls', element: <MyPolls /> }
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