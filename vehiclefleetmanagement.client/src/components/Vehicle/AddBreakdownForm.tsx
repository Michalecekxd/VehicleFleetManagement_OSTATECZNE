import React, { useState } from 'react';
import styles from './AddBreakdownForm.module.css';
import { FaInfoCircle } from 'react-icons/fa';

interface AddBreakdownFormProps {
    vehicleId: number;
    semiTrailerId?: number;
    onClose: () => void;
    onBreakdownAdded: (newBreakdown: any) => void;
    isSemiTrailerTruck?: boolean;
}

const AddBreakdownForm: React.FC<AddBreakdownFormProps> = ({ vehicleId, semiTrailerId, onClose, onBreakdownAdded, isSemiTrailerTruck }) => {
    const [description, setDescription] = useState('');
    const [occurredAt, setOccurredAt] = useState('');
    const [error, setError] = useState('');
    const [dateError, setDateError] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(vehicleId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (occurredAt && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(occurredAt)) {
                setDateError('Upewnij się, że podałeś odpowiednią datę oraz godzinę');
                return;
            }

            const dateToValidate = occurredAt ? new Date(occurredAt) : new Date();
            const minDate = new Date('2000-01-01');
            const maxDate = new Date();

            if (isNaN(dateToValidate.getTime()) || dateToValidate < minDate || dateToValidate > maxDate) {
                setDateError('Upewnij się, że podałeś odpowiednią datę oraz godzinę');
                return;
            }

            setDateError('');
            setError('');

            const response = await fetch(`/api/breakdown?vehicleId=${selectedVehicle}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    occurredAt: dateToValidate.toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add breakdown');
            }

            const newBreakdown = await response.json();
            onBreakdownAdded({
                ...newBreakdown,
                isSemiTrailer: selectedVehicle === semiTrailerId
            });
            onClose();
        } catch (error) {
            console.error('Error adding breakdown:', error);
            setError('Wystąpił błąd podczas dodawania awarii.');
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <button className={styles.closeButton} onClick={onClose}>X</button>
                <h3>➕ Dodaj awarię</h3>

                {(error || dateError) && <span className={styles.errorText}>{error || dateError}</span>}
                <br />

                <form onSubmit={handleSubmit} className={styles.formContainer}>
                    {isSemiTrailerTruck && (
                        <>
                            <label className={styles.labelField}>Wybierz pojazd:</label>
                            <select
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(Number(e.target.value))}
                                className={styles.selectField}
                            >
                                <option value={vehicleId}>Ciągnik siodłowy</option>
                                {semiTrailerId && <option value={semiTrailerId}>Naczepa</option>}
                            </select>
                        </>
                    )}

                    <label className={styles.labelField}>Opis awarii:</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className={styles.textareaField} />

                    <div className={styles.dateContainer}>
                        <label className={styles.labelField}>Data i godzina wystąpienia:</label>
                        <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className={styles.dateInput} />
                        <FaInfoCircle className={styles.infoIcon} title="Jeśli pole nie zostanie wypełnione, zostanie użyta aktualna data i godzina." />
                    </div>

                    <button type="submit" className={styles.addButton}>Dodaj</button>
                </form>
            </div>
        </div>
    );
};

export default AddBreakdownForm;
