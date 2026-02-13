import React, { useEffect, useState } from 'react';
import styles from './Vehicle.module.css';

interface TractorUnitListProps {
    onSelect: (tractorUnit: any) => void;
}

const TractorUnitList: React.FC<TractorUnitListProps> = ({ onSelect }) => {
    const [tractorUnits, setTractorUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchTractorUnits = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API}/api/vehicle?type=TractorUnit`);
                if (!response.ok) {
                    throw new Error(`Error fetching TractorUnit: ${response.status}`);
                }
                const data = await response.json();

                const filteredTractorUnits = data.filter((tractorUnit: any) => tractorUnit.status !== 4);

                setTractorUnits(filteredTractorUnits);
            } catch (error: any) {
                setError(error.message || "Error fetching TractorUnit.");
            } finally {
                setLoading(false);
            }
        };

        fetchTractorUnits();
    }, []);

    if (loading) {
        return <p>Ładowanie ciągników siodłowych...</p>;
    }

    if (tractorUnits.length === 0) {
        return (
            <p className={styles.failMessage}>
                Brak dostępnych ciągników siodłowych.
            </p>
        );
    }

    if (error) {
        return <p>Błąd: {error}</p>;
    }



    return (
        <ul className={styles.vehicleList1}>
            <li className={styles.headerRow}>
                <div className={styles.headerItem}>
                    <strong>Id</strong>
                </div>
                <div className={styles.headerItem}>
                    <strong>Nr. Rejestracyjny</strong>
                </div>
                <div className={styles.headerItem}>
                    <strong>Marka</strong>
                </div>
                <div className={styles.headerItem}>
                    <strong>Model</strong>
                </div>
                <div className={styles.headerItem}>
                    <strong>Akcja</strong>
                </div>
            </li>
            {tractorUnits.map(tractorUnit => (
                <li key={tractorUnit.id} className={styles.item}>
                    <div className={styles.dataItem}>
                        {tractorUnit.id.toString().padStart(3, '0')}
                    </div>
                    <div className={styles.dataItem}>
                        {tractorUnit.registrationNumber}
                    </div>
                    <div className={styles.dataItem}>
                        {tractorUnit.brand}
                    </div>
                    <div className={styles.dataItem}>
                        {tractorUnit.model}
                    </div>
                    <div className={styles.dataItem}>
                        <button onClick={() => onSelect(tractorUnit)}>Wybierz</button>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default TractorUnitList;