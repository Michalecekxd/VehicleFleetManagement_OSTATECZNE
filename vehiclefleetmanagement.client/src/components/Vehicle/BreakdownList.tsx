import React, { useState } from "react";
import { FaCalendarAlt, FaClock, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import styles from './BreakdownList.module.css';
import AddBreakdownForm from './AddBreakdownForm';
import { IoMdAddCircle } from "react-icons/io";

interface Breakdown {
    id: number;
    occurredAt: string;
    description: string;
    endedAt: string | null;
    vehicleId: number;
    isSemiTrailer?: boolean;
}

interface BreakdownListProps {
    breakdowns: Breakdown[];
    vehicleId: number;
    semiTrailerId?: number;
    onBreakdownAdded?: (newBreakdown: Breakdown) => void;
    onVehicleUpdate?: (updatedVehicle: any) => void;
    vehicle: any;
}

const BreakdownList: React.FC<BreakdownListProps> = ({
    breakdowns,
    vehicleId,
    semiTrailerId,
    onBreakdownAdded,
    vehicle,
    onVehicleUpdate
}) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleFinishBreakdown = async (breakdownId: number) => {
        try {
            const response = await fetch(`/api/breakdown/${breakdownId}/end`, {
                method: 'PATCH',
            });
            if (!response.ok) {
                throw new Error('Failed to end breakdown');
            }
            const data = await response.json();

            let newBreakdowns: Breakdown[];

            if (semiTrailerId) {
                const breakdownForSemiTrailer = data.breakdowns.filter((b: Breakdown) => b.vehicleId === semiTrailerId);

                if (breakdownForSemiTrailer.length > 0) {
                    newBreakdowns = breakdowns.map((b: Breakdown) =>
                        b.id === breakdownId
                            ? { ...b, endedAt: data.breakdowns.find((newB: Breakdown) => newB.id === breakdownId)?.endedAt }
                            : b
                    );
                } else {
                    newBreakdowns = breakdowns.map((b: Breakdown) =>
                        b.id === breakdownId ? { ...b, endedAt: new Date().toISOString() } : b
                    );
                }
            } else {
                newBreakdowns = breakdowns.map((b: Breakdown) =>
                    b.id === breakdownId ? { ...b, endedAt: new Date().toISOString() } : b
                );
            }

            // Wywołaj callback update – nie aktualizujemy lokalnego stanu,
            // bo rodzic (VehicleDetails) powinien zaktualizować obiekt i przekazać nową listę breakdowns.
            const active = newBreakdowns.filter((b: Breakdown) => !b.endedAt);
            let updatedStatus = vehicle.status;
            if (active.length === 0) {
                if (vehicle.type === 1 || vehicle.type === 2) {
                    updatedStatus = null;
                } else {
                    updatedStatus = vehicle.driver ? 1 : null;
                }
            }
            if (onVehicleUpdate) {
                onVehicleUpdate({ ...vehicle, breakdowns: newBreakdowns, status: updatedStatus });
            }
        } catch (error) {
            console.error('Error ending breakdown:', error);
        }
    };

    const handleAddBreakdown = (newBreakdown: Breakdown) => {
        if (onBreakdownAdded) {
            onBreakdownAdded(newBreakdown);
        }
        // Po dodaniu awarii rodzic powinien zaktualizować obiekt vehicle,
        // co spowoduje zmianę przekazywanych props "breakdowns" i ponowne wyrenderowanie.
    };

    return (
        <div className={styles.failuresTab}>
            <div className={styles.headerContainer}>
                <h4>Historia awarii</h4>
                <IoMdAddCircle
                    className={styles.addIcon}
                    onClick={() => setIsAddModalOpen(true)}
                    title="Dodaj awarię"
                />
            </div>

            {breakdowns && breakdowns.length > 0 ? (
                <div className={styles.breakdownContainer}>
                    <h5>
                        <FaExclamationTriangle className={`${styles.icon} ${styles.activeIcon}`} />
                        Aktualne awarie
                    </h5>
                    {breakdowns.filter(b => !b.endedAt).length > 0 ? (
                        <ul className={styles.breakdownList}>
                            {breakdowns.filter(b => !b.endedAt).map(breakdown => {
                                const sourceLabel = semiTrailerId
                                    ? (breakdown.vehicleId === semiTrailerId ? "Awaria naczepy" : "Awaria ciągnika")
                                    : "";
                                return (
                                    <li key={breakdown.id} className={`${styles.breakdownItem} ${styles.activeBreakdown}`}>
                                        <div className={styles.timesContainer}>
                                            <div className={styles.timeRow}>
                                                <div className={styles.leftSide}>
                                                    <span className={styles.label}>Rozpoczęto:</span>
                                                    <div className={styles.dateGroup}>
                                                        <FaCalendarAlt className={styles.icon} />
                                                        <span className={styles.date}>
                                                            {new Date(breakdown.occurredAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={styles.rightSide}>
                                                    <FaClock className={styles.icon} />
                                                    <span className={styles.time}>
                                                        {new Date(breakdown.occurredAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {sourceLabel && (
                                            <div className={styles.breakdownSource}>
                                                <em>{sourceLabel}</em>
                                            </div>
                                        )}
                                        <div className={styles.breakdownDescription}>
                                            {breakdown.description}
                                        </div>
                                        <div className={styles.finishBreakdownContainer}>
                                            <button
                                                className={styles.finishBreakdownButton}
                                                onClick={() => handleFinishBreakdown(breakdown.id)}>
                                                Zakończ
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className={styles.noBreakdowns}>Brak aktualnych awarii</p>
                    )}

                    {/* Sekcja dla ukończonych awarii */}
                    <h5>
                        <FaCheckCircle className={styles.icon} />
                        Ukończone naprawy
                    </h5>
                    {breakdowns.filter(b => b.endedAt).length > 0 ? (
                        <ul className={styles.breakdownList}>
                            {breakdowns.filter(b => b.endedAt).map(breakdown => {
                                const sourceLabel = semiTrailerId
                                    ? (breakdown.vehicleId === semiTrailerId ? "Awaria naczepy" : "Awaria ciągnika")
                                    : "";
                                return (
                                    <li key={breakdown.id} className={`${styles.breakdownItem} ${styles.completedBreakdown}`}>
                                        <div className={styles.timesContainer}>
                                            <div className={styles.timeRow}>
                                                <div className={styles.leftSide}>
                                                    <span className={styles.label}>Zakończono:</span>
                                                    <div className={styles.dateGroup}>
                                                        <FaCalendarAlt className={styles.icon} />
                                                        <span className={styles.date}>
                                                            {new Date(breakdown.endedAt!).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={styles.rightSide}>
                                                    <FaClock className={styles.icon} />
                                                    <span className={styles.time}>
                                                        {new Date(breakdown.endedAt!).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {sourceLabel && (
                                            <div className={styles.breakdownSource}>
                                                <em>{sourceLabel}</em>
                                            </div>
                                        )}
                                        <div className={styles.breakdownDescription}>
                                            {breakdown.description}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className={styles.noBreakdowns}>Brak ukończonych napraw</p>
                    )}
                </div>
            ) : (
                <p className={styles.noBreakdowns}>Brak zapisanych awarii.</p>
            )}
            {isAddModalOpen && (
                <AddBreakdownForm
                    vehicleId={vehicleId}
                    semiTrailerId={semiTrailerId}
                    onClose={() => setIsAddModalOpen(false)}
                    onBreakdownAdded={handleAddBreakdown}
                    isSemiTrailerTruck={!!semiTrailerId}
                />
            )}
        </div>
    );
};

export default BreakdownList;
