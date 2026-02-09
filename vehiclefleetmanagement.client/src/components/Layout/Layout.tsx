// src/components/Layout/Layout.tsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import MapView from "../MapView/MapView";
import Footer from "../Footer/Footer";
import styles from "./Layout.module.css";

interface Delivery {
    id: number;
    loadDescription: string;
    orderId: number;
    status: number;
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    startedAt: string;
    completedAt: string | null;
    clientName: string;
    clientPhone: string;
}

export interface Vehicle {
    id: number;
    status: number;
    latitude: number;
    longitude: number;
    registrationNumber: string;
    brand: string;
    model: string;
    yearOfProduction: number;
    bodyworkType: number | null;
    capacity: number | null;
    type: number;
    driver?: {
        id: number;
        firstName: string;
        lastName: string;
        phoneNumber: string;
    };
    lastModified?: string;
    deliveries: Delivery[];
}

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const selectedVehicleRef = useRef<Vehicle | null>(selectedVehicle);
    useEffect(() => {
        selectedVehicleRef.current = selectedVehicle;
    }, [selectedVehicle]);

    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [vehicleStatuses, setVehicleStatuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef<WebSocket | null>(null);
    const [baseLocation, setBaseLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // Pokazuje szczegóły pojazdu w panelu
    const handleShowVehicleDetails = async (vehicleId: number) => {
        // Otwórz menu pojazdów
        setActiveMenu("vehicles");
        // Pobierz szczegóły i ustaw stan
        try {
            const res = await fetch(`/api/vehicle/${vehicleId}`);
            if (!res.ok) throw new Error(`Błąd pobierania pojazdu ${vehicleId}`);
            const data: Vehicle = await res.json();
            setSelectedVehicle(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Aktualizuje stan pojazdów po operacjach (np. odpinanie kierowcy)
    const handleVehicleUpdate = (updated: Vehicle) => {
        setVehicles(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
        setSelectedVehicle(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
    };

    // Auth & role
    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("userRole");
        setIsLoggedIn(!!token);
        setUserRole(role);
        if (!token && location.pathname.startsWith("/panel")) {
            navigate("/login", { replace: true });
        }
    }, [location, navigate]);

    // Inicjalizacja WebSocket i aktualizacja listy pojazdów
    useEffect(() => {
        if (wsRef.current) return;
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host; // zwraca domenę np. https://flotapojazdow-dxa4g9hrejb0dfd0.germanywestcentral-01.azurewebsites.net/
        const ws = new WebSocket(`${protocol}//${host}/ws`);
        wsRef.current = ws;

        ws.onopen = () => setLoading(false);
        // Klient odbiera dane z serwera
        ws.onmessage = event => {
            try {
                const raw: any[] = JSON.parse(event.data);
                if (Array.isArray(raw)) {
                    const vehicles = raw.map(v => ({
                        id: v.Id,
                        status: v.Status,
                        latitude: v.Latitude,
                        longitude: v.Longitude,
                        registrationNumber: v.RegistrationNumber,
                        brand: v.Brand,
                        model: v.Model,
                        yearOfProduction: v.YearOfProduction,
                        bodyworkType: v.BodyworkType,
                        capacity: v.Capacity,
                        type: v.Type,
                        lastModified: v.LastModified,
                        driver: v.DriverId ? {
                            id: v.DriverId,
                            firstName: v.DriverFirstName,
                            lastName: v.DriverLastName,
                            phoneNumber: v.DriverPhoneNumber
                        } : undefined,
                        deliveries: v.Deliveries?.map((d: any) => ({
                            id: d.Id,
                            status: d.Status,
                            loadDescription: d.LoadDescription,
                            startLatitude: d.StartLatitude,
                            startLongitude: d.StartLongitude,
                            endLatitude: d.EndLatitude,
                            endLongitude: d.EndLongitude,
                            startedAt: d.StartedAt,
                            completedAt: d.CompletedAt,
                            clientName: d.ClientName,
                            clientPhone: d.ClientPhone
                        })) || []
                    }));
                    setVehicles(vehicles);
                    setVehicleStatuses(vehicles.map(v => ({ id: v.id, status: v.status })));
                }
            } catch (err) {
                console.error(err);
            }
        };
        ws.onerror = err => console.error(err);
        ws.onclose = () => setTimeout(() => window.location.reload(), 2000);

        return () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
        };
    }, []);

    // Pobranie lokalizacji bazowej
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/config");
                if (res.ok) setBaseLocation(await res.json());
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        navigate("/login", { replace: true });
    };

    const isPanel = location.pathname.startsWith("/panel");
    const isDriver = userRole === "Driver";

    return (
        <div className={styles.body}>
            <Header isLoggedIn={isLoggedIn} userRole={userRole} onLogout={handleLogout} />

            {isPanel ? (
                <div className={styles.mainContainer}>
                    {!isDriver && (
                        <>
                            <Sidebar
                                vehicleStatuses={vehicleStatuses}
                                selectedVehicle={selectedVehicle}
                                setSelectedVehicle={setSelectedVehicle}
                                activeMenu={activeMenu}
                                setActiveMenu={setActiveMenu}
                                onShowVehicleDetails={handleShowVehicleDetails}
                                baseLocation={baseLocation}
                                onVehicleUpdate={handleVehicleUpdate}
                            />
                            <MapView
                                vehicles={vehicles}
                                loading={loading}
                                onShowVehicleDetails={handleShowVehicleDetails}
                                selectedVehicle={selectedVehicle}
                                baseLocation={baseLocation}
                            />
                        </>
                    )}

                    {isDriver && (
                        <div className={styles.driverMessage}>
                            <Outlet />
                        </div>
                    )}
                </div>
            ) : (
                <main className={styles.mainContent}>
                    <Outlet />
                </main>
            )}

            <Footer />
        </div>
    );
};

export default Layout;
