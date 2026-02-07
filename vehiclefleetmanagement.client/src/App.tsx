import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import RegisterForm from "./pages/RegisterForm/RegisterForm";
import NotFound from "./pages/NotFound/NotFound";
import InfoForDriver from "./components/DriverPanel/InfoForDriver";
import DriverInfo from "./components/DriverPanel/DriverInfo";

function App() {
    return (
        <Router>
            <Routes>
                {/* Publiczne */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RegisterForm />} />

                {/* Panel z Layout */}
                <Route path="/panel" element={<Layout />}>
                    {/* domyœlnie przekieruj do dostaw */}
                    <Route index element={<Navigate to="deliveries" replace />} />

                    {/* Dostawy (tabela) */}
                    <Route path="deliveries" element={<InfoForDriver />} />

                    {/* Informacje o kierowcy */}
                    <Route path="driverinfo" element={<DriverInfo />} />

                    {/* fallback */}
                    <Route path="*" element={<Navigate to="deliveries" replace />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
