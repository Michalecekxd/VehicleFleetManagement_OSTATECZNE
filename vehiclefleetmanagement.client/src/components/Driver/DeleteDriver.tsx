import React, { useState } from 'react';
import styles from './DeleteDriver.module.css';
import { AiOutlineUserDelete } from "react-icons/ai";

interface DeleteDriverProps {
    driverId: number;
    driverName: string;
    onDeleteSuccess: () => void;
    isBusy?: boolean;
}

const DeleteDriver: React.FC<DeleteDriverProps> = ({ driverId, driverName, onDeleteSuccess, isBusy = false }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/api/driver/${driverId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete driver');
            }

            onDeleteSuccess();
            setIsModalOpen(false);
        } catch (error) {
            setError('Wystąpił błąd przy usuwaniu kierowcy.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <AiOutlineUserDelete
                className={`${styles.deleteIcon} ${isBusy ? styles.disabledIcon : ""}`}
                onClick={() => !isBusy && setIsModalOpen(true)}
                title={isBusy ? "Nie można usunąć kierowcy, który jest w trasie." : "Usuń kierowcę"}
            />
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3 className={styles.title}>Czy na pewno chcesz usunąć tego kierowcę?</h3>
                        <p className={styles.driverInfo}>
                            <strong>Kierowca:</strong> {driverName}
                        </p>
                        {error && <p className={styles.failMessage}>{error}</p>}
                        <div className={styles.modalActions}>
                            <button onClick={() => setIsModalOpen(false)} className={styles.cancelButton}>
                                Anuluj
                            </button>
                            <button onClick={handleDelete} className={styles.confirmButton} disabled={isDeleting}>
                                {isDeleting ? 'Usuwanie...' : 'Usuń'}
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DeleteDriver;
