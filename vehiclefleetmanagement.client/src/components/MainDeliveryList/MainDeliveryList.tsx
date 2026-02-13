import React, { useState, useEffect } from 'react';
import {
    FaListOl,
    FaTruck,
    FaUser,
    FaInfoCircle,
    FaHourglassStart,
    FaMapMarkerAlt,
    FaHourglassEnd,
    FaCheckCircle,
    FaClipboardList
} from 'react-icons/fa';
import { MdDescription, MdOutlinePending } from 'react-icons/md';
import styles from './MainDeliveryList.module.css';

export interface Delivery {
    id: number;
    vehicleId: number;
    driverId: number;
    driverFirstName: string;
    driverLastName: string;
    loadDescription: string;
    orderId: number;
    status: number;
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    startAddress?: string;
    endAddress?: string;
    startedAt: string | null;
    completedAt: string | null;
    clientName?: string;
    clientPhone?: string;
}

export interface Order {
    id: number;
    isCompleted: boolean;
}

interface VehicleInfo {
    id: number;
    type: number;
}

type StatusMap = Record<number, string>;
const statusTextMap: StatusMap = {
    1: 'W trakcie realizacji',
    2: 'Oczekująca',
    3: 'Anulowana',
    4: 'Ukończona',
};

type TypeMap = Record<number, string>;
const typeTextMap: TypeMap = {
    3: 'Zestaw',
    4: 'Ciężarówka sztywna',
    5: 'Samochód dostawczy',
};

const MainDeliveryList: React.FC = () => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [vehiclesMap, setVehiclesMap] = useState<Record<number, VehicleInfo>>({});
    const [ordersMap, setOrdersMap] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [delRes, vehRes, ordRes] = await Promise.all([
                    fetch(`${API}/api/delivery`),
                    fetch(`${API}/api/vehicle`),
                    fetch(`${API}/api/order`),
                ]);
                if (!delRes.ok) throw new Error(`Dostawy HTTP ${delRes.status}`);
                if (!vehRes.ok) throw new Error(`Pojazdy HTTP ${vehRes.status}`);
                if (!ordRes.ok) throw new Error(`Zlecenia HTTP ${ordRes.status}`);

                const delData: Delivery[] = await delRes.json();
                const vehData: VehicleInfo[] = await vehRes.json();
                const ordData: Order[] = await ordRes.json();

                const vehMap: Record<number, VehicleInfo> = {};
                vehData.forEach(v => { vehMap[v.id] = v; });

                const oMap: Record<number, boolean> = {};
                ordData.forEach(o => { oMap[o.id] = o.isCompleted; });

                setDeliveries(delData);
                setVehiclesMap(vehMap);
                setOrdersMap(oMap);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError('Błąd podczas ładowania danych.');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    if (loading) return <div className={styles.deliveryContainer}><p className={styles.loading}></p></div>;
    if (error) return <div className={styles.deliveryContainer}><p className={styles.error}>{error}</p></div>;

    return (
        <div className={styles.deliveryContainer}>
            <h3 className={styles.title}>
                <FaListOl className={styles.titleIcon} />
                Dostawy
            </h3>
            {deliveries.length === 0 ? (
                <p className={styles.empty}>Nie znaleziono żadnych dostaw.</p>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th><FaTruck className={styles.icon} />Pojazd</th>
                                <th><FaUser className={styles.icon} />Kierowca</th>
                                <th><MdDescription className={styles.icon} />Ładunek</th>
                                <th><FaMapMarkerAlt className={styles.icon} />Start</th>
                                <th><FaMapMarkerAlt className={styles.icon} />Cel</th>
                                <th><FaClipboardList className={styles.icon} />Zlecenie</th>
                                <th><FaInfoCircle className={styles.icon} />Status</th>
                                <th><FaHourglassStart className={styles.icon} />Rozpoczęto</th>
                                <th><FaHourglassEnd className={styles.icon} />Zakończono</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map((d, idx) => {
                                const veh = vehiclesMap[d.vehicleId];
                                const typeText = veh ? typeTextMap[veh.type] : '';
                                const isDone = ordersMap[d.orderId];

                                return (
                                    <tr key={d.id} className={idx % 2 === 0 ? styles.evenRow : ''}>
                                        <td>{d.id}</td>
                                        <td>
                                            {String(d.vehicleId).padStart(3, '0')}{typeText ? ` – ${typeText}` : ''}
                                        </td>

                                        <td>
                                            {d.driverFirstName} {d.driverLastName}
                                        </td>

                                        <td>{d.loadDescription}</td>
                                        <td>{d.startAddress ?? '-'}</td>
                                        <td>{d.endAddress ?? '-'}</td>
                                        <td>
                                            {d.orderId}
                                            {isDone
                                                ? <FaCheckCircle className={`${styles.icon} ${styles.orderCompletedIcon}`} title="Ukończone" />
                                                : <MdOutlinePending className={`${styles.icon} ${styles.orderPendingIcon}`} title="Nieukończone" />
                                            }
                                        </td>
                                        <td>{statusTextMap[d.status] ?? d.status}</td>
                                        <td>{d.startedAt ? new Date(d.startedAt).toLocaleString() : '-'}</td>
                                        <td>{d.completedAt ? new Date(d.completedAt).toLocaleString() : '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MainDeliveryList;
