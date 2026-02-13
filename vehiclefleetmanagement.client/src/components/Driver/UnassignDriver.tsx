import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './UnassignDriver.module.css';
import { IoRemoveCircleSharp } from "react-icons/io5";

interface UnassignDriverProps {
    vehicleId: number;
    vehicleStatus: number;
    driverName: string;
    onUnassignSuccess: (updatedVehicle: any) => void;
}

const UnassignDriver: React.FC<UnassignDriverProps> = ({ vehicleId, vehicleStatus, driverName, onUnassignSuccess }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUnassigning, setIsUnassigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const API = import.meta.env.VITE_API_URL;

    const handleUnassign = async () => {
        setIsUnassigning(true);
        setError(null);

        try {
            const response = await fetch(`${API}/api/vehicle/unassign-driver/${vehicleId}`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Failed to unassign driver');
            }

            const updatedVehicleResponse = await fetch(`${API}/api/vehicle/${vehicleId}`);
            if (!updatedVehicleResponse.ok) {
                throw new Error('Failed to fetch updated vehicle data');
            }
            const updatedVehicle = await updatedVehicleResponse.json();

            onUnassignSuccess(updatedVehicle);
            setIsModalOpen(false);
        } catch (error) {
            setError('Wystąpił błąd przy usuwaniu przypisania kierowcy.');
        } finally {
            setIsUnassigning(false);
        }
    };

    return (
        <>
            {vehicleStatus !== 2 && vehicleStatus !== 3 && (
                <IoRemoveCircleSharp
                    className={styles.unassignIcon}
                    onClick={() => setIsModalOpen(true)}
                    title="Usuń przypisanie kierowcy"
                />
            )}
            {isModalOpen && ReactDOM.createPortal(
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3 className={styles.title}>Czy na pewno chcesz usunąć przypisanie kierowcy?</h3>
                        <p className={styles.driverInfo}>
                            <strong>Kierowca:</strong> <span className={styles.driverText}>{driverName}</span>
                        </p>
                        {error && <p className={styles.failMessage}>{error}</p>}
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsModalOpen(false)} className={styles.cancelButton}>
                                Anuluj
                            </button>
                            <button
                                onClick={handleUnassign}
                                className={styles.confirmButton}
                            >
                                {isUnassigning ? 'Usuwanie...' : 'Usuń'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default UnassignDriver;
