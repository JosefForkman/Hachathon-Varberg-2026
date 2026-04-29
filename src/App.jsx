import Header from './Header.jsx'
import Footer from './Footer.jsx'
import { createBrowserRouter } from 'react-router'
import MapView from './Pages/MapView.jsx'
import { Home } from './Pages/home.jsx'
import { RouterProvider } from 'react-router/dom'

export default function App() {

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Home />,
    },
    {
      path: '/map',
      element: <MapView />,
    }
  ])

  return (
    <>
      <Header />
      <RouterProvider router={router} />
      <Footer />
    </>
  )
}
