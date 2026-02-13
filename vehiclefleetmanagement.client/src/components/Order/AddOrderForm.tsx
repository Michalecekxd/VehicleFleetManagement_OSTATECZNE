import React, { useState, useCallback } from "react";
import { FaInfoCircle } from "react-icons/fa";
import styles from "./AddOrderForm.module.css";
import { Delivery } from "./OrderList";
import AvailableVehicleList from "./AvailableVehicleList";
import AddOrderMap from "./AddOrderMap";
import RoutePlanner from "./RoutePlanner";
import AddressAutocomplete from "./AddressAutocomplete";

interface AddOrderFormProps {
    onClose: () => void;
    onOrderAdded: (newOrder: Delivery) => void;
    selectedVehicle?: any;
}

const AddOrderForm: React.FC<AddOrderFormProps> = ({
    onClose,
    onOrderAdded,
    selectedVehicle: preselectedVehicle,
}) => {
    const [formData, setFormData] = useState({
        vehicleId: preselectedVehicle ? preselectedVehicle.id.toString() : "",
        loadDescription: "",
        startLatitude: 0,
        startLongitude: 0,
        endLatitude: 0,
        endLongitude: 0,
    });

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    const [startAddress, setStartAddress] = useState("");
    const [endAddress, setEndAddress] = useState("");

    const [selectedVehicle, setSelectedVehicle] = useState<any>(
        preselectedVehicle || null
    );
    const [isVehicleListModalOpen, setIsVehicleListModalOpen] = useState(false);

    const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(
        null
    );
    const [endPoint, setEndPoint] = useState<{ lat: number; lng: number } | null>(
        null
    );
    const [routes, setRoutes] = useState<any[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
    const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

    const [error, setError] = useState<string | null>(null);

    const handleRouteSelect = useCallback((index: number) => {
        setSelectedRouteIndex((prev) => {
            if (prev === index) {
                setRecenterTrigger((prevRecenter) => prevRecenter + 1);
            }
            return index;
        });
    }, []);

    const handleRoutesLoaded = useCallback(
        (fetchedRoutes: any[]) => {
            setRoutes(fetchedRoutes);
            if (fetchedRoutes.length > 0 && selectedRouteIndex === null) {
                setSelectedRouteIndex(0);
            }
        },
        [selectedRouteIndex]
    );

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        let formattedValue = value.replace(/[^0-9+ ]/g, "");
        if (formattedValue.indexOf("+") > 0) {
            formattedValue = formattedValue.replace(/\+/g, "");
        }
        if (formattedValue.startsWith("+")) {
            formattedValue = "+" + formattedValue.slice(1).replace(/\+/g, "");
        }
        const digitsOnly = formattedValue.replace(/[^0-9]/g, "");
        if (digitsOnly.length > 15) {
            return;
        }
        setCustomerPhone(formattedValue);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        if (startAddress.trim() === "" || endAddress.trim() === "") {
            setIsSubmitting(false);
            setError("Pola 'Miejsce początkowe' i 'Miejsce docelowe' są wymagane.");
            return;
        }

        if (!routes || routes.length === 0 || selectedRouteIndex === null) {
            setError("Nie wybrano trasy – nie można dodać zlecenia. Prawdopodobną przyczyną jest brak zwrócenia trasy lub tras przez serwis routingu (OSRM).");
            setIsSubmitting(false);
            return;
        }

        if (!startPoint || !endPoint) {
            setError("Podaj poprawne adresy (nie znaleziono lokalizacji).");
            setIsSubmitting(false);
            return;
        }

        const newDelivery = {
            vehicleId: parseInt(formData.vehicleId),
            loadDescription: formData.loadDescription,
            startLatitude: formData.startLatitude,
            startLongitude: formData.startLongitude,
            endLatitude: formData.endLatitude,
            endLongitude: formData.endLongitude,
            ClientName: customerName.trim() === "" ? null : customerName,
            ClientPhone: customerPhone.trim() === "" ? null : customerPhone,
            SelectedRouteIndex: selectedRouteIndex,
            startAddress: startAddress,
            endAddress: endAddress,
        };

        const API = import.meta.env.VITE_API_URL;

        try {
            const response = await fetch(`${API}/api/delivery`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newDelivery),
            });

            if (!response.ok) {
                let message = "Wystąpił błąd podczas dodawania zlecenia.";

                try {
                    const errorData = await response.json();

                    if (errorData && errorData.errors) {
                        const firstKey = Object.keys(errorData.errors)[0];
                        message = errorData.errors[firstKey][0]; 
                    } else if (errorData && errorData.title) {
                        message = errorData.title;
                    }
                } catch (e) {
                }
                setIsSubmitting(false);
                setError(message);
                return;
            }

            const data = (await response.json()) as Delivery;
            onOrderAdded(data);
            onClose();
        } catch (error) {
            setIsSubmitting(false);
            setError("Wystąpił błąd podczas dodawania zlecenia.");
        }
    };

    const openVehicleListModal = () => {
        setIsVehicleListModalOpen(true);
    };

    const handleVehicleSelect = (vehicle: any) => {
        setSelectedVehicle(vehicle);
        setFormData((prev) => ({ ...prev, vehicleId: vehicle.id.toString() }));
        setIsVehicleListModalOpen(false);
    };

    const handleClearStart = () => {
        setStartAddress("");
        setFormData((prev) => ({
            ...prev,
            startLatitude: 0,
            startLongitude: 0,
        }));
        setStartPoint(null);
        setRoutes([]);
        setSelectedRouteIndex(null);
    };

    const handleClearEnd = () => {
        setEndAddress("");
        setFormData((prev) => ({
            ...prev,
            endLatitude: 0,
            endLongitude: 0,
        }));
        setEndPoint(null);
        setRoutes([]);
        setSelectedRouteIndex(null);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <button className={styles.closeButton} onClick={onClose}>
                    X
                </button>
                <h3>➕ Dodaj zlecenie</h3>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.topFormSection}>
                        <div className={styles.inputGrid}>
                            {/* Wiersz 1: Pojazd, Opis towaru */}
                            <div className={styles.inputGroup}>
                                <label className={styles.labelField}>Pojazd:</label>
                                <input
                                    type="text"
                                    name="vehicleId"
                                    value={
                                        selectedVehicle
                                            ? selectedVehicle.type === 3
                                                ? `${String(selectedVehicle.id).padStart(
                                                    3,
                                                    "0"
                                                )} - ${selectedVehicle.registrationNumber} - ${selectedVehicle.brand
                                                } | Naczepa: ${selectedVehicle.semiTrailerId
                                                    ? `${String(
                                                        selectedVehicle.semiTrailerId
                                                    ).padStart(3, "0")} - ${selectedVehicle.semiTrailerRegistrationNumber
                                                    } - ${selectedVehicle.semiTrailerBrand}`
                                                    : "Brak naczepy"
                                                }`
                                                : `${String(selectedVehicle.id).padStart(
                                                    3,
                                                    "0"
                                                )} - ${selectedVehicle.registrationNumber} - ${selectedVehicle.brand
                                                }`
                                            : ""
                                    }
                                    readOnly
                                    onClick={openVehicleListModal}
                                    className={`${styles.inputField} ${styles.clickableInput}`}
                                    placeholder="Wybierz..."
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.labelField}>Opis towaru:</label>
                                <input
                                    type="text"
                                    name="loadDescription"
                                    value={formData.loadDescription}
                                    onChange={(e) =>
                                        setFormData({ ...formData, loadDescription: e.target.value })
                                    }
                                    required
                                    className={styles.inputField}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}>
                                <label className={styles.labelField}>Miejsce początkowe:</label>
                                <AddressAutocomplete
                                    placeholder="np. Warszawa, Makowska 13"
                                    value={startAddress}
                                    onChange={(value) => {
                                        setStartAddress(value);
                                        if (value.trim() === "") {
                                            handleClearStart();
                                        }
                                    }}
                                    onSelect={(point, displayName) => {
                                        setStartAddress(displayName);
                                        setFormData((prev) => ({
                                            ...prev,
                                            startLatitude: point.lat,
                                            startLongitude: point.lng,
                                        }));
                                        setStartPoint(point);
                                    }}
                                    triggerRecenter={() => { }}
                                    onClear={handleClearStart}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.labelField}>Miejsce docelowe:</label>
                                <AddressAutocomplete
                                    placeholder="np. Chorzów, Graniczna 32"
                                    value={endAddress}
                                    onChange={(value) => {
                                        setEndAddress(value);
                                        if (value.trim() === "") {
                                            handleClearEnd();
                                        }
                                    }}
                                    onSelect={(point, displayName) => {
                                        setEndAddress(displayName);
                                        setFormData((prev) => ({
                                            ...prev,
                                            endLatitude: point.lat,
                                            endLongitude: point.lng,
                                        }));
                                        setEndPoint(point);
                                    }}
                                    triggerRecenter={() => { }}
                                    onClear={handleClearEnd}
                                />
                            </div>
                        </div>

                        {/* Wiersz 2: Dane klienta – pola "Imię i Nazwisko" oraz "Telefon" */}
                        <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}>
                                <div className={styles.labelContainer}>
                                    <label className={styles.labelField}>Imię i Nazwisko:</label>
                                    <FaInfoCircle
                                        title="Pole opcjonalne – uzupełnienie ułatwi kierowcy kontakt z klientem"
                                        className={styles.infoIcon}
                                    />
                                </div>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className={styles.inputField}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <div className={styles.labelContainer}>
                                    <label className={styles.labelField}>Telefon:</label>
                                    <FaInfoCircle
                                        title="Pole opcjonalne – uzupełnienie ułatwi kierowcy kontakt z klientem"
                                        className={styles.infoIcon}
                                    />
                                </div>
                                <input
                                    type="tel"
                                    name="customerPhone"
                                    value={customerPhone}
                                    onChange={handlePhoneChange}
                                    className={styles.inputField}
                                />
                            </div>
                        </div>

                        {startPoint && endPoint && (
                            <RoutePlanner
                                startPoint={startPoint}
                                endPoint={endPoint}
                                onRouteSelect={handleRouteSelect}
                                onRoutesLoaded={handleRoutesLoaded}
                                selectedRouteIndex={selectedRouteIndex}
                            />
                        )}
                    </div>

                    <div className={styles.mapSection}>
                        <div className={styles.mapContainer}>
                            <AddOrderMap
                                startPoint={startPoint}
                                endPoint={endPoint}
                                routes={routes}
                                selectedRouteIndex={selectedRouteIndex}
                                onRouteClick={handleRouteSelect}
                                recenterTrigger={recenterTrigger}
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.addButton} disabled={isSubmitting}>
                        {isSubmitting ? "Dodawanie..." : "Dodaj"}
                    </button>
                </form>

                {isVehicleListModalOpen && (
                    <AvailableVehicleList
                        onSelect={handleVehicleSelect}
                        onClose={() => setIsVehicleListModalOpen(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default AddOrderForm;
