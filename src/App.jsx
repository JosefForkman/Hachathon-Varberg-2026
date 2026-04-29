import Header from "./component/Header.jsx";
import Footer from "./component/Footer.jsx";
import { Navigate, createBrowserRouter } from "react-router";
import MapView from "./Pages/MapView.jsx";
import { Home } from "./Pages/Home.jsx";
import { RouterProvider } from "react-router/dom";

function RequireEmail({ children }) {
    const email = localStorage.getItem("userEmail");

    if (!email) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Home />,
        },
        {
            path: "/map",
            element: (
                <RequireEmail>
                    <MapView />
                </RequireEmail>
            ),
        },
    ]);

    return (
        <>
            <Header />
            <RouterProvider router={router} />
            <Footer />
        </>
    );
}
