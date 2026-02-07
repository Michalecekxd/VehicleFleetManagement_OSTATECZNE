import React from "react";
import styles from "./ConfirmDelete.module.css";

interface ConfirmDeleteProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isSemiTrailerTruck: boolean;
    error: string | null;
}

const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({ isOpen, onClose, onConfirm, isSemiTrailerTruck, error }) => {
    if (!isOpen) return null;

    const title = isSemiTrailerTruck
        ? "Czy na pewno chcesz usunąć te pojazdy?"
        : "Czy na pewno chcesz usunąć ten pojazd?";

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>{title}</h3>
                {isSemiTrailerTruck && (
                    <p className={styles.warning}>
                        Uwaga: Ta operacja usunie zarówno ciągnik, jak i naczepę!              
                        <br /> <br />  
                    </p>
                )}
                {error && <p className={styles.failMessage}>{error}</p>}
                <div className={styles.modalActions}>
                    <button onClick={onClose} className={styles.cancelButton}>
                        Anuluj
                    </button>
                    <button onClick={onConfirm} className={styles.confirmButton}>
                        Usuń
                    </button>

                </div>
            </div>
        </div>
    );
};

export default ConfirmDelete;
