import { createBrowserRouter, RouterProvider } from 'react-router'
import './App.css'
// Supports weights 100-900
import '@fontsource-variable/inter/wght.css';
import { Home } from './Pages/home';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Home />
    }, 
    {
      path: '/map',
      element: <h1>Map Page</h1>
    }
  ]);
  return (
    <>
      <header>
        <div className="logo">
          <img src="/logo.png" alt="Logo" />
          <span>S-Halland</span>
        </div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/map">Map</a></li>
            <li><a href="/Explore">Explore</a></li>
            <li><a href="/Report">Report</a></li>
          </ul>
        </nav>
      </header>
    <RouterProvider router={router} />
    </>
    )
}

export default App
