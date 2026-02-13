import React, { useState } from 'react';
import styles from './SplitSemiTrailerTruck.module.css';

interface SplitSemiTrailerTruckProps {
    vehicleId: number;
    vehicleStatus: number;  
    onSplitSuccess: () => void;
}

const SplitSemiTrailerTruck: React.FC<SplitSemiTrailerTruckProps> = ({
    vehicleId,
    vehicleStatus, 
    onSplitSuccess
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const API = import.meta.env.VITE_API_URL;

    const handleSplit = async () => {
        try {
            const response = await fetch(`${API}/api/vehicle/split/${vehicleId}`, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Nie udało się rozdzielić zestawu');
            }

            onSplitSuccess();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Błąd podczas rozdzielania zestawu:', error);
            setError('Wystąpił błąd podczas rozdzielania zestawu');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={vehicleStatus === 2 ? styles.disabledButton : styles.confirmButton}
                disabled={vehicleStatus === 2} 
                title={vehicleStatus === 2 ? "Nie można rozdzielić zestawu z obecnym statusem" : ""}
            >
                Rozdziel zestaw
            </button>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Czy na pewno chcesz rozdzielić ten zestaw?</h3>
                        {error && <p className={styles.failMessage}>{error}</p>}
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setError(null);
                                }}
                                className={styles.cancelButton}
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleSplit}
                                className={styles.confirmSplitSemiTrailerTruckButton}
                            >
                                Rozdziel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SplitSemiTrailerTruck;
