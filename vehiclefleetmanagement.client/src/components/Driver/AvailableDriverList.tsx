import React, { useState, useEffect } from "react";
import styles from "./AvailableDriverList.module.css";

interface Driver {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
}

interface AvailableDriverListProps {
    onDriverSelect: (updatedVehicle: any) => void; 
    onClose: () => void;
    vehicleId: number;
    onVehicleUpdate?: (updatedVehicle: any) => void;
}

const AvailableDriverList: React.FC<AvailableDriverListProps> = ({ onDriverSelect, onClose, vehicleId, onVehicleUpdate }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/driver")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const availableDrivers = data.filter((driver: any) => driver.vehicle === null);
                setDrivers(availableDrivers.sort((a: any, b: any) => a.id - b.id));
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching available drivers:", error);
                setError("Error fetching available drivers.");
                setLoading(false);
            });
    }, []);


    const handleDriverSelect = async (driverId: number) => {
        try {
            const response = await fetch(`/api/driver/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driverId: driverId,
                    vehicleId: vehicleId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to assign driver");
            }


            const updatedVehicleResponse = await fetch(`/api/vehicle/${vehicleId}`);
            const updatedVehicle = await updatedVehicleResponse.json();

            onDriverSelect(updatedVehicle);
            if (onVehicleUpdate) {
                onVehicleUpdate(updatedVehicle)
            }
            onClose();

        } catch (error: any) {
            console.error("Error:", error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("Wystąpił nieznany błąd.");
            }
        }
    };


    return (
        <div className={styles.chooseDriverModalContainer}>
            <button className={styles.closeButton} onClick={onClose}>X</button>
            <h3>Wybierz kierowcę (bez przypisanego pojazdu): </h3>
            <br />
            {loading ? (
                <p>Ładowanie listy dostępnych kierowców...</p>
            ) : error ? (
                <p>Błąd: {error}</p>
            ) : drivers.length === 0 ? (
                <p className={styles.failMessage}>Brak dostępnych kierowców.</p>
            ) : (
                <ul className={styles.vehicleList1}>
                    <li className={styles.headerRow}>
                        <div className={styles.headerItem}>ID</div>
                        <div className={styles.headerItem}>Imię</div>
                        <div className={styles.headerItem}>Nazwisko</div>
                        <div className={styles.headerItem}>Email</div>
                        <div className={styles.headerItem}>Numer telefonu</div>
                        <div className={styles.headerItem}>Akcja</div>
                    </li>
                    {drivers.map(driver => (
                        <li key={driver.id} className={styles.item}>
                            <div className={styles.dataItem}>{driver.id}</div>
                            <div className={styles.dataItem}>{driver.firstName}</div>
                            <div className={styles.dataItem}>{driver.lastName}</div>
                            <div className={styles.dataItem}>{driver.email}</div>
                            <div className={styles.dataItem}>{driver.phoneNumber}</div>
                            <div className={styles.dataItem}>
                                <button onClick={() => handleDriverSelect(driver.id)}>Wybierz</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AvailableDriverList;
