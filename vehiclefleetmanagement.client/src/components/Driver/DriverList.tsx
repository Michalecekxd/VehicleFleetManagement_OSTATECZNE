import React from "react";
import styles from "./DriverList.module.css";
import { FaUser } from "react-icons/fa";
import { IoPersonAdd } from "react-icons/io5";
import DeleteDriver from "./DeleteDriver";
import { BsPersonFillCheck } from "react-icons/bs";
import { TbTruckDelivery } from "react-icons/tb";

interface Vehicle {
    id: number;
    type: number;
    typeName: string;
}

interface Driver {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isBusy: boolean;
    vehicle: Vehicle | null;
}

interface DriverListProps {
    drivers: Driver[];
    loading: boolean;
    onAddDriverClick: () => void;
    onDeleteSuccess: () => void;
}

const DriverList: React.FC<DriverListProps> = ({ drivers, loading, onAddDriverClick, onDeleteSuccess }) => {

    return (
        <div className={styles.driverListContainer}>
            <div className={styles.driverHeader}>
                <div className={styles.driverTitle}>
                    <FaUser className={styles.driverIcon} />
                    <span>Kierowcy</span>
                </div>
                <IoPersonAdd
                    className={styles.addPersonIcon}
                    onClick={onAddDriverClick}
                    title="Dodaj kierowcę"
                />
            </div>
            {loading ? (
                <p className={styles.loading}>Ładowanie listy kierowców...</p>
            ) : drivers.length === 0 ? (
                <p className={styles.failMessage}>Nie znaleziono żadnych kierowców.</p>
            ) : (
                <table className={styles.driverTable}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Imię</th>
                            <th>Nazwisko</th>
                            <th>Email</th>
                            <th>Numer telefonu</th>
                            <th>Status</th>
                            <th>Pojazd</th>
                            <th>Akcje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map((driver) => (
                            <tr key={driver.id} className={styles.driverRow}>
                                <td>{driver.id}</td>
                                <td>{driver.firstName}</td>
                                <td>{driver.lastName}</td>
                                <td>{driver.email}</td>
                                <td>{driver.phoneNumber}</td>
                                <td>
                                    <span className={styles.statusIcon}>
                                        {driver.isBusy ? (
                                            <TbTruckDelivery className={styles.busyIcon} style={{ marginRight: '15px' }} />
                                        ) : (
                                            <BsPersonFillCheck className={styles.availableIcon} style={{ marginRight: '15px' }} />
                                        )}
                                        <span
                                            className={`${styles.statusText} ${driver.isBusy ? styles.busyStatus : ""
                                                }`}
                                        >
                                            {driver.isBusy ? "W trasie" : "Dostępny"}
                                        </span>
                                    </span>
                                </td>
                                <td>
                                    {driver.vehicle
                                        ? `${driver.vehicle.id.toString().padStart(3, "0")} - ${driver.vehicle.typeName}`
                                        : "---"}
                                </td>
                                <td>
                                    <span className={styles.actionIcon}>
                                        <DeleteDriver
                                            driverId={driver.id}
                                            driverName={`${driver.firstName} ${driver.lastName}`}
                                            onDeleteSuccess={onDeleteSuccess}
                                            isBusy={driver.isBusy}
                                        />
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default DriverList;
