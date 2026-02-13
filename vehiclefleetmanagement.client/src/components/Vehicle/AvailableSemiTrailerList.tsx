import React, { useEffect, useState } from 'react';
import styles from './Vehicle.module.css';

interface SemiTrailerListProps {
    onSelect: (semiTrailer: any) => void;
}

const SemiTrailerList: React.FC<SemiTrailerListProps> = ({ onSelect }) => {
    const [semiTrailers, setSemiTrailers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchSemiTrailers = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API}/api/vehicle?type=SemiTrailer`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setSemiTrailers([]);
                        return;
                    }
                    throw new Error(`Error fetching SemiTrailers: ${response.status}`);
                }
                const allSemiTrailers = await response.json();

                const setsResponse = await fetch(`{API}/api/vehicle?type=SemiTrailerTruck`);
                let assignedSemiTrailerIds: number[] = [];

                if (setsResponse.ok) {
                    const sets = await setsResponse.json();
                    assignedSemiTrailerIds = sets
                        .map((set: any) => set.semiTrailerId)
                        .filter((id: any) => id != null && id !== undefined);
                }

                const availableSemiTrailers = allSemiTrailers.filter(
                    (semiTrailer: any) =>
                        semiTrailer.status !== 4 &&
                        !assignedSemiTrailerIds.includes(semiTrailer.id)
                );

                setSemiTrailers(availableSemiTrailers);
            } catch (error: any) {
                setError(error.message || "Error occured while fetching data.");
            } finally {
                setLoading(false);
            }
        };

        fetchSemiTrailers();
    }, []);

    if (loading) {
        return <p>Ładowanie naczep...</p>;
    }

    if (error) {
        return <p className={styles.failMessage}>Błąd: {error}</p>;
    }

    if (semiTrailers.length === 0) {
        return (
            <p className={styles.failMessage}>
                Brak dostępnych naczep.
            </p>
        );
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
                    <strong>Ładowność(t)</strong>
                </div>
                <div className={styles.headerItem}>
                    <strong>Akcja</strong>
                </div>
            </li>
            {semiTrailers.map(semiTrailer => (
                <li key={semiTrailer.id} className={styles.item}>
                    <div className={styles.dataItem}>
                        {semiTrailer.id.toString().padStart(3, '0')}
                    </div>
                    <div className={styles.dataItem}>
                        {semiTrailer.registrationNumber}
                    </div>
                    <div className={styles.dataItem}>
                        {semiTrailer.brand}
                    </div>
                    <div className={styles.dataItem}>
                        {semiTrailer.capacity}
                    </div>
                    <div className={styles.dataItem}>
                        <button onClick={() => onSelect(semiTrailer)}>Wybierz</button>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default SemiTrailerList;