import React, { useEffect, useState } from 'react';
import {
    FaClipboardList,
    FaMapMarkerAlt,
    FaHourglassStart,
    FaHourglassEnd,
    FaBox,
    FaInfoCircle,
    FaUser,
    FaPhoneAlt
} from 'react-icons/fa';
import styles from './InfoForDriver.module.css';

interface Delivery {
    id: number;
    loadDescription: string;
    orderId: number;
    status: number;
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    startAddress: string;
    endAddress: string;
    startedAt: string | null;
    completedAt: string | null;
    clientName: string | null;
    clientPhone: string | null;
}

const getStatusText = (status: number): string => {
    switch (status) {
        case 1: return 'W trakcie realizacji';
        case 2: return 'Oczekująca';
        case 3: return 'Anulowana';
        case 4: return 'Ukończona';
        default: return 'Nieznany';
    }
};

const InfoForDriver: React.FC = () => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        async function fetchDeliveries() {
            try {
                const res = await fetch('/api/delivery/driver', { credentials: 'include' });
                if (!res.ok) throw new Error('Nie udało się pobrać dostaw');
                const data: Delivery[] = await res.json();
                const sorted = data.sort((a, b) => b.orderId - a.orderId);
                setDeliveries(sorted);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Wystąpił błąd');
            } finally {
                setLoading(false);
            }
        }

        // pierwsze pobranie
        fetchDeliveries();
        // odpytywanie co 5 sekund
        intervalId = setInterval(fetchDeliveries, 3000);

        return () => clearInterval(intervalId);
    }, []);

    if (loading) return <div className={styles.container}>Ładowanie...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!deliveries.length) return <div className={styles.empty}>Brak przydzielonych dostaw</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Twoje dostawy</h1>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th><FaClipboardList className={styles.icon} /> Zlecenie</th>
                            <th><FaMapMarkerAlt className={styles.icon} /> Start</th>
                            <th><FaMapMarkerAlt className={styles.icon} /> Cel</th>
                            <th><FaHourglassStart className={styles.icon} /> Rozpoczęto</th>
                            <th><FaHourglassEnd className={styles.icon} /> Zakończono</th>
                            <th><FaBox className={styles.icon} /> Ładunek</th>
                            <th><FaInfoCircle className={styles.icon} /> Status</th>
                            <th><FaUser className={styles.icon} /> Klient</th>
                            <th><FaPhoneAlt className={styles.icon} /> Telefon klienta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveries.map(d => (
                            <tr key={d.id}>
                                <td>{d.id}</td>
                                <td>{d.orderId}</td>
                                <td>{d.startAddress}</td>
                                <td>{d.endAddress}</td>
                                <td>{d.startedAt ? new Date(d.startedAt).toLocaleString('pl-PL') : '-'}</td>
                                <td>{d.completedAt ? new Date(d.completedAt).toLocaleString('pl-PL') : '-'}</td>
                                <td>{d.loadDescription}</td>
                                <td>{getStatusText(d.status)}</td>
                                <td>{d.clientName || '-'}</td>
                                <td>{d.clientPhone || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InfoForDriver;
