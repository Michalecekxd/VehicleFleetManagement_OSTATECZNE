import React, { useState, useEffect, JSX } from "react";
import styles from "./AvailableVehicleList.module.css";
import VehicleIcon4 from "../Vehicle/VehicleIcon4";
import VehicleIcon5 from "../Vehicle/VehicleIcon5";

interface AvailableVehicleListProps {
    onSelect: (vehicle: any) => void;
    onClose: () => void;
}

const AvailableVehicleList: React.FC<AvailableVehicleListProps> = ({ onSelect, onClose }) => {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const semiTrailerBodyworkMap: Record<number, string> = {
        1: "Kurtynowa (firanka/plandeka)",
        2: "Wywrotka",
        3: "Platforma",
        4: "Burtowa",
        5: "Niskopodwoziowa",
        6: "Chłodnia",
        7: "Izoterma",
        8: "Kłonicowa",
    };

    const vehicleTypeMap: Record<number, string> = {
        4: "Ciężarówka sztywna",
        5: "Samochód dostawczy",
    };

    const vehicleIconMap: Record<number, JSX.Element> = {
        4: <div className={styles.icon}><VehicleIcon4 /></div>,
        5: <div className={styles.icon}><VehicleIcon5 /></div>,
    };

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await fetch("/api/vehicle?status=1");
                if (!response.ok) {
                    throw new Error("Błąd podczas pobierania dostępnych pojazdów.");
                }
                const data = await response.json();
                setVehicles(data);
            } catch (err: any) {
                setError(err.message || "Wystąpił błąd.");
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    if (loading) return <p>Ładowanie pojazdów...</p>;
    if (error) return <p>Błąd: {error}</p>;
    if (vehicles.length === 0) return <p>Brak dostępnych pojazdów.</p>;

    const regularVehicles = vehicles.filter(v => v.type !== 3);
    const semitrailertrucks = vehicles.filter(v => v.type === 3);

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <button className={styles.closeButton} onClick={onClose}>X</button>
                <h3>Wybierz pojazd</h3>
                {regularVehicles.length > 0 && (
                    <>
                        <h4>Pojazdy</h4>
                        <div className={styles.scrollableList}>
                            <ul>
                                <li className={styles.headerRow}>
                                    <div className={styles.headerItem}>
                                        <strong>ID</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Nr. rej.</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Marka</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Model</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Typ</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Ładowność(t)</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Akcja</strong>
                                    </div>
                                </li>
                                {regularVehicles.map(vehicle => (
                                    <li key={vehicle.id} className={styles.item}>
                                        <div className={styles.dataItem}>
                                            {String(vehicle.id).padStart(3, '0')}
                                        </div>
                                        <div className={styles.dataItem}>
                                            {vehicle.registrationNumber}
                                        </div>
                                        <div className={styles.dataItem}>
                                            {vehicle.brand}
                                        </div>
                                        <div className={styles.dataItem}>
                                            {vehicle.model}
                                        </div>
                                        <div className={styles.dataItem} title={vehicleTypeMap[vehicle.type] || "Nieznany typ"}>
                                            {vehicleIconMap[vehicle.type] || "❓"}
                                        </div>
                                        <div className={styles.dataItem}>
                                            {vehicle.capacity}
                                        </div>
                                        <div className={styles.dataItem}>
                                            <button onClick={() => onSelect(vehicle)}>Wybierz</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
                {semitrailertrucks.length > 0 && (
                    <>
                        <br />
                        <h4>Zestawy</h4>
                        <div className={styles.scrollableSetList}>
                            <ul>
                                <li className={styles.headerRow}>
                                    <div className={styles.headerItem}>
                                        <strong>ID</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Nr rej.</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Marka</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Model</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Naczepa</strong>
                                    </div>
                                    <div className={styles.headerItem}>
                                        <strong>Akcja</strong>
                                    </div>
                                </li>
                                {semitrailertrucks.map(truck => (
                                    <li key={truck.id} className={styles.item}>
                                        <div className={styles.dataItem}>
                                            {String(truck.id).padStart(3, '0')}
                                        </div>
                                        <div className={styles.dataItem}>
                                            {truck.registrationNumber}
                                        </div>
                                        <div className={styles.dataItem}>
                                            {truck.brand}
                                        </div>
                                        <div className={styles.dataItem}>
                                            {truck.model}
                                        </div>
                                        <div
                                            className={styles.dataItem}
                                            title={`ID: ${String(truck.semiTrailerId).padStart(3, '0')}, Nr. rej.: ${truck.semiTrailer?.registrationNumber || "Brak danych"}, Marka: ${truck.semiTrailer?.brand || "Brak danych"}, Typ nadwozia: ${semiTrailerBodyworkMap[truck.semiTrailer?.bodyworkType] || "Brak danych"}, Ładowność(t): ${truck.semiTrailer?.capacity || "Brak danych"}`}
                                        >
                                            {truck.semiTrailerId
                                                ? `${String(truck.semiTrailerId).padStart(3, '0')} (${truck.semiTrailer?.registrationNumber || "Brak danych"})`
                                                : "Brak naczepy"}
                                        </div>
                                        <div className={styles.dataItem}>
                                            <button onClick={() => onSelect(truck)}>Wybierz</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AvailableVehicleList;
