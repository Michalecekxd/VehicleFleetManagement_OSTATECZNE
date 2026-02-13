import React, { useEffect, useState } from "react";
import styles from "./DriverInfo.module.css";
import { FcInfo } from "react-icons/fc";
import { FaUser, FaEnvelope, FaPhoneAlt, FaCalendarAlt, FaTruck } from "react-icons/fa";

interface VehicleDto {
    id: number;
    typeName: string;
}

interface DriverDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateJoined: string;
    vehicle?: VehicleDto;
}

const DriverInfo: React.FC = () => {
    const [info, setInfo] = useState<DriverDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetch(`${API}/api/driver/driverinfo`, { credentials: "include" })
            .then((res) => {
                if (!res.ok) throw new Error(`Błąd: ${res.status}`);
                return res.json();
            })
            .then((data: DriverDto) => setInfo(data))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className={styles.container}>Ładowanie…</div>;
    if (error) return <div className={styles.container}>Błąd: {error}</div>;
    if (!info) return <div className={styles.container}>Brak danych</div>;

    const date = new Date(info.dateJoined);

    const joinedDate = `${date.toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })}, ${date.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
    })}`;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                <FcInfo className={styles.titleIcon} />
                <span className={styles.titleText}>Informacje o kierowcy</span>
                <span className={styles.driverId}>#{info.id}</span>
            </h1>
            <div className={styles.card}>
                <div className={styles.field}>
                    <FaUser className={styles.icon} />
                    <span className={styles.label}>Imię</span>
                    <span className={styles.value}>{info.firstName}</span>
                </div>
                <div className={styles.field}>
                    <FaUser className={styles.icon} />
                    <span className={styles.label}>Nazwisko</span>
                    <span className={styles.value}>{info.lastName}</span>
                </div>
                <div className={styles.field}>
                    <FaEnvelope className={styles.icon} />
                    <span className={styles.label}>Email</span>
                    <span className={styles.value}>{info.email}</span>
                </div>
                <div className={styles.field}>
                    <FaPhoneAlt className={styles.icon} />
                    <span className={styles.label}>Telefon</span>
                    <span className={styles.value}>{info.phoneNumber}</span>
                </div>
                <div className={styles.field}>
                    <FaCalendarAlt className={styles.icon} />
                    <span className={styles.label}>Dołączył</span>
                    <span className={styles.value}>{joinedDate}</span>
                </div>
                <div className={styles.field}>
                    <FaTruck className={styles.icon} />
                    <span className={styles.label}>Pojazd</span>
                    <span className={styles.value}>
                        {info.vehicle
                            ? `#${String(info.vehicle.id).padStart(3, '0')}- ${info.vehicle.typeName}`
                            : "Brak przypisanego pojazdu"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DriverInfo;
