import { createBrowserRouter, RouterProvider } from 'react-router'
import './App.css'

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <h1>Welcome to Vite</h1>
    }, 
    {
      path: '/about',
      element: <h1>About Page</h1>
    }
  ]);
  return (
    <>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    <RouterProvider router={router} />
    </>
  )
}

export default App
