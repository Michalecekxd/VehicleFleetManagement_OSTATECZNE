import React, { useEffect, useState } from "react";
import styles from "./AddVehicleForm.module.css";

interface AddVehicleFormProps {
    closeModal: () => void;
    onVehicleAdded: (newVehicle: any) => void;
    tractorUnitId?: number | null;
    openTractorUnitListModal: () => void;
    openSemiTrailerListModal: () => void;
    selectedTractorUnit?: any;
    selectedTractorUnitDetails?: any;
    baseLocation: { latitude: number; longitude: number } | null;
}

const AddVehicleForm: React.FC<AddVehicleFormProps> = ({
    closeModal,
    onVehicleAdded,
    tractorUnitId,
    openTractorUnitListModal,
    openSemiTrailerListModal,
    selectedTractorUnit,
    selectedTractorUnitDetails,
    baseLocation
}) => {
    const [vehicleType, setVehicleType] = useState("TractorUnit");
    const [formData, setFormData] = useState({
        registrationNumber: "",
        brand: "",
        yearOfProduction: "",
        model: "",
        capacity: "",
        tractorUnitId: tractorUnitId ? tractorUnitId.toString() : "",
        semiTrailerId: "",
        bodyworkType: "",
    });
    const [error, setError] = useState('');



    useEffect(() => {
        if (tractorUnitId || (selectedTractorUnitDetails && 'capacity' in selectedTractorUnitDetails)) {
            setVehicleType("SemiTrailerTruck");
            setFormData(prev => ({
                ...prev,
                tractorUnitId: tractorUnitId ? tractorUnitId.toString() : prev.tractorUnitId,
                semiTrailerId: selectedTractorUnitDetails && 'capacity' in selectedTractorUnitDetails
                    ? selectedTractorUnitDetails.id.toString()
                    : prev.semiTrailerId,
            }));
        }
    }, [tractorUnitId, selectedTractorUnitDetails]);

    const bodyworkOptions: Record<string, { value: number; label: string }[]> = {
        RigidTruck: [
            { value: 1, label: "Plandeka/firana" },
            { value: 2, label: "Furgon(sztywna zabudowa)" },
            { value: 3, label: "Wywrotka" },
            { value: 4, label: "Wywrotka z hds" },
            { value: 5, label: "Chłodnia" },
            { value: 6, label: "Izoterma" },
            { value: 7, label: "Autolaweta" },
        ],
        DeliveryVan: [
            { value: 1, label: "Plandeka/firana" },
            { value: 2, label: "Furgon(blaszak)" },
            { value: 3, label: "Kontener" },
            { value: 4, label: "Wywrotka" },
            { value: 5, label: "Doka" },
            { value: 6, label: "Chłodnia" },
            { value: 7, label: "Izoterma" },
            { value: 8, label: "Autolaweta" },
        ],
        SemiTrailer: [
            { value: 1, label: "Kurtynowa(firanka/plandeka)" },
            { value: 2, label: "Wywrotka" },
            { value: 3, label: "Platforma" },
            { value: 4, label: "Burtowa" },
            { value: 5, label: "Niskopodwoziowa" },
            { value: 6, label: "Chłodnia" },
            { value: 7, label: "Izoterma" },
            { value: 8, label: "Kłonicowa" },
        ],
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const vehicleTypeMapping: Record<string, number> = {
        TractorUnit: 1,
        SemiTrailer: 2,
        SemiTrailerTruck: 3,
        RigidTruck: 4,
        DeliveryVan: 5
    };

    const API = import.meta.env.VITE_API_URL;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (vehicleType === "SemiTrailerTruck") {
            const tractorUnitId = formData.tractorUnitId;
            const semiTrailerId = formData.semiTrailerId;

            if (!tractorUnitId || !semiTrailerId) {
                setError("Wybierz ciągnik oraz naczepę.");
                return;
            } else {
                setError('');
            }

            try {
                const response = await fetch(`${API}/api/vehicle/update/${tractorUnitId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        semiTrailerId: Number(semiTrailerId),
                        type: vehicleTypeMapping["SemiTrailerTruck"],
                        latitude: baseLocation ? Math.round(baseLocation.latitude * 1e6) / 1e6 : 52.25,
                        longitude: baseLocation ? Math.round(baseLocation.longitude * 1e6) / 1e6 : 21.0,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Error while update vehicle: ${response.status}`);
                }

                const updatedVehicle = await response.json();
                onVehicleAdded(updatedVehicle);
                closeModal();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
                setError(`Error occurred while updating vehicle: ${errorMessage}`);
            }
        } else {

            if (["RigidTruck", "DeliveryVan", "TractorUnit", "SemiTrailer"].includes(vehicleType)) {
                try {
                    const checkResponse = await fetch(`${API}/api/vehicle/check?registrationNumber=${formData.registrationNumber}`);
                    if (!checkResponse.ok) {
                        const backendText = await checkResponse.text();
                        throw new Error(backendText || "Błąd podczas weryfikacji numeru rejestracyjnego.");
                    }
                    const { exists } = await checkResponse.json();
                    if (exists) {
                        setError("Pojazd z podanym numerem rejestracyjnym już istnieje.");
                        return;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
                    setError(`Weryfikacja numeru rejestracyjnego nie powiodła się: ${errorMessage}`);
                    return;
                }
            }

            let newVehicle: any = {
                registrationNumber: formData.registrationNumber,
                brand: formData.brand,
                yearOfProduction: Number(formData.yearOfProduction),
                status: null,
                type: vehicleTypeMapping[vehicleType],
            };

            if (["RigidTruck", "DeliveryVan", "TractorUnit"].includes(vehicleType)) {
                newVehicle.model = formData.model;
            }
            if (["RigidTruck", "DeliveryVan", "SemiTrailer"].includes(vehicleType)) {
                newVehicle.capacity = formData.capacity ? Number(formData.capacity) : null;
            }
            if (vehicleType === "SemiTrailerTruck") {
                newVehicle.semiTrailerId = formData.semiTrailerId ? Number(formData.semiTrailerId) : null;
                newVehicle.tractorUnitId = formData.tractorUnitId ? Number(formData.tractorUnitId) : null;
            }
            if (["RigidTruck", "DeliveryVan", "SemiTrailer"].includes(vehicleType)) {
                newVehicle.bodyworkType = formData.bodyworkType ? Number(formData.bodyworkType) : null;
            }

            if (["RigidTruck", "DeliveryVan"].includes(vehicleType)) {
                if (baseLocation) {
                    newVehicle.latitude = Math.round(baseLocation.latitude * 1e6) / 1e6;
                    newVehicle.longitude = Math.round(baseLocation.longitude * 1e6) / 1e6;
                } else {
                    newVehicle.latitude = 52.25;
                    newVehicle.longitude = 21.0;
                }
            }

            try {
                const response = await fetch(`${API}/api/vehicle`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newVehicle),
                });

                if (!response.ok) {
                    // spróbuj odczytać JSON
                    let errorMessage = "Nieznany błąd";
                    try {
                        const errorJson = await response.json();
                        if (errorJson?.errors) {
                            // wyciągamy wszystkie komunikaty i łączymy w jeden string
                            errorMessage = Object.values(errorJson.errors)
                                .flat()
                                .join("; ");
                        } else if (errorJson?.title) {
                            errorMessage = errorJson.title;
                        }
                    } catch {
                        // jeśli nie JSON, odczyt zwykłego tekstu
                        errorMessage = await response.text();
                    }
                    throw new Error(errorMessage);
                }

                const savedVehicle = await response.json();
                onVehicleAdded(savedVehicle);
                closeModal();
            } catch (error) {
                const message = error instanceof Error ? error.message : "Nieznany błąd";
                setError(message);
            }

        }
    };

    return (
        <div className={styles.modalContainer}>
            <button className={styles.closeButton} onClick={closeModal}>
                X
            </button>
            <h3>➕ Dodaj pojazd</h3>
            {error && <span style={{ color: 'red' }}>{error}</span>}
            <br />
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <label className={styles.labelField}>Typ pojazdu:</label>
                <select
                    value={vehicleType}
                    onChange={(e) => {
                        setVehicleType(e.target.value);
                        setFormData(prev => ({ ...prev, bodyworkType: "" }));
                        if (e.target.value !== "SemiTrailerTruck") {
                            setError('');
                        }
                    }}
                    className={styles.selectField}
                >
                    <option value="TractorUnit">Ciągnik siodłowy</option>
                    <option value="SemiTrailer">Naczepa</option>
                    <option value="SemiTrailerTruck">Zestaw (ciągnik siodłowy + naczepa)</option>
                    <option value="RigidTruck">Ciężarówka sztywna</option>
                    <option value="DeliveryVan">Samochód dostawczy</option>
                </select>

                {["RigidTruck", "DeliveryVan", "TractorUnit", "SemiTrailer"].includes(vehicleType) && (
                    <>
                        <label className={styles.labelField}>Numer rejestracyjny:</label>
                        <input
                            type="text"
                            name="registrationNumber"
                            value={formData.registrationNumber}
                            onChange={handleChange}
                            required
                            className={styles.inputField}
                        />
                    </>
                )}

                {["RigidTruck", "DeliveryVan", "TractorUnit", "SemiTrailer"].includes(vehicleType) && (
                    <>
                        <label className={styles.labelField}>Marka:</label>
                        <input
                            type="text"
                            name="brand"
                            value={formData.brand}
                            onChange={handleChange}
                            required
                            className={styles.inputField}
                        />
                    </>
                )}

                {["RigidTruck", "DeliveryVan", "TractorUnit"].includes(vehicleType) && (
                    <>
                        <label className={styles.labelField}>Model:</label>
                        <input
                            type="text"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            required
                            className={styles.inputField}
                        />
                    </>
                )}

                {["RigidTruck", "DeliveryVan", "TractorUnit", "SemiTrailer"].includes(vehicleType) && (
                    <>
                        <label className={styles.labelField}>Rok produkcji:</label>
                        <input
                            type="text"
                            name="yearOfProduction"
                            value={formData.yearOfProduction}
                            onChange={(e) => {
                                const onlyNumbers = e.target.value.replace(/\D/g, '');
                                setFormData({ ...formData, yearOfProduction: onlyNumbers });
                            }}
                            required
                            className={styles.inputField}
                            maxLength={4}
                        />
                    </>
                )}

                {["RigidTruck", "DeliveryVan", "SemiTrailer"].includes(vehicleType) && (
                    <>
                        <label className={styles.labelField}>Ładowność (t):</label>
                        <input
                            type="number"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            required
                            min="0"
                            className={styles.inputField}
                        />
                    </>
                )}

                {["RigidTruck", "DeliveryVan", "SemiTrailer"].includes(vehicleType) && (
                    <>
                        <label className={styles.labelField}>Typ zabudowy:</label>
                        <select
                            name="bodyworkType"
                            value={formData.bodyworkType}
                            onChange={handleChange}
                            required
                            className={styles.selectField}
                        >
                            <option value="">-- Wybierz --</option>
                            {bodyworkOptions[vehicleType]?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </>
                )}
                {vehicleType === "SemiTrailerTruck" && (
                    <>
                        <label className={styles.labelField}>Ciągnik siodłowy:</label>
                        <div className={styles.tractorUnitInputContainer}>
                            <input
                                type="text"
                                name="tractorUnitId"
                                value={selectedTractorUnit
                                    ? `${String(selectedTractorUnit.id).padStart(3, '0')} - ${selectedTractorUnit.registrationNumber} - ${selectedTractorUnit.model} - ${selectedTractorUnit.brand}`
                                    : ""}
                                readOnly
                                onClick={openTractorUnitListModal}
                                className={`${styles.inputField} ${styles.clickableInput}`}
                                placeholder="Wybierz..."
                            />
                        </div>
                        <label className={styles.labelField}>Naczepa:</label>
                        <div className={styles.semiTrailerInputContainer}>
                            <input
                                type="text"
                                name="semiTrailerId"
                                value={selectedTractorUnitDetails
                                    ? `${String(selectedTractorUnitDetails.id).padStart(3, '0')} - ${selectedTractorUnitDetails.registrationNumber} - ${selectedTractorUnitDetails.brand} - ${selectedTractorUnitDetails.capacity}t`
                                    : ""}
                                readOnly
                                onClick={openSemiTrailerListModal}
                                className={`${styles.inputField} ${styles.clickableInput}`}
                                placeholder="Wybierz..."
                            />
                        </div>
                    </>
                )}

                <button type="submit" className={styles.addButton}>Dodaj</button>
            </form>
        </div>
    );
};

export default AddVehicleForm;