import React, { useState, useCallback } from "react";
import { FaCar, FaClipboardList } from "react-icons/fa";
import { GiAutoRepair } from "react-icons/gi";
import { FaExchangeAlt } from "react-icons/fa";
import { IoPersonAdd } from "react-icons/io5";
import styles from "./VehicleDetails.module.css";
import DeleteVehicle from "./DeleteVehicle";
import SplitSemiTrailerTruck from "./SplitSemiTrailerTruck";
import BreakdownList from "./BreakdownList";
import UnassignDriver from "../Driver/UnassignDriver";
import OrderList from "../Order/OrderList";

interface VehicleDetailsProps {
    selectedVehicle: any;
    onClose: () => void;
    onAssignTrailerToTractor: (tractorUnitId: number) => void;
    onAssignTractorToTrailer?: (semiTrailerId: number) => void;
    onVehicleDeleted: () => void;
    onSemiTrailerTruckSplit: () => void;
    onOpenDriverListModal: () => void;
    onVehicleUpdate?: (updatedVehicle: any) => void;
    onShowVehicleDetails: (vehicleId: number) => void;
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
    selectedVehicle,
    onClose,
    onAssignTrailerToTractor,
    onAssignTractorToTrailer,
    onVehicleDeleted,
    onSemiTrailerTruckSplit,
    onOpenDriverListModal,
    onVehicleUpdate,
}) => {

    const [activeTab, setActiveTab] = useState("vehicle");
    const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);

    if (!selectedVehicle) return null;

    const deleteButtonText =
        selectedVehicle.type === 3 ? "Usuń pojazdy" : "Usuń pojazd";
    const shouldShowAssignDriverButton =
        selectedVehicle &&
        (selectedVehicle.type === 1 ||
            selectedVehicle.type === 3 ||
            selectedVehicle.type === 4 ||
            selectedVehicle.type === 5);
    const showAssignTrailerButton = selectedVehicle.type === 1;
    const showAssignTractorButton = selectedVehicle.type === 2;

    const getStatusText = (status: number) => {
        switch (status) {
            case 1:
                return "Dostępny";
            case 2:
                return "W trasie";
            case 3:
                return "Powrót do bazy";
            case 4:
                return "Uszkodzony";
            default:
                return "Niedostępny";
        }
    };

    const typeLabelMap: Record<number, string> = {
        1: "Ciągnik siodłowy",
        2: "Naczepa",
        3: "Zestaw",
        4: "Ciężarówka sztywna",
        5: "Samochód dostawczy",
    };

    const semiTrailerBodyworkMap: Record<number, string> = {
        1: "Kurtynowa (firanka/plandeka)",
        2: "Wywrotka",
        3: "Platforma",
        4: "Burtowa",
        5: "Niskopodwoziowa",
        6: "Chłodnia",
        7: "Izoterma",
        8: "Kłonicowa",
    };

    const rigidTruckBodyworkMap: Record<number, string> = {
        1: "Plandeka/firana",
        2: "Furgon (sztywna zabudowa)",
        3: "Wywrotka",
        4: "Wywrotka z hds",
        5: "Chłodnia",
        6: "Izoterma",
        7: "Autolaweta",
    };

    const deliveryVanBodyworkMap: Record<number, string> = {
        1: "Plandeka/firana",
        2: "Furgon (blaszak)",
        3: "Kontener",
        4: "Wywrotka",
        5: "Doka",
        6: "Chłodnia",
        7: "Izoterma",
        8: "Autolaweta",
    };

    const renderVehicleDetails = () => {
        if (!selectedVehicle) {
            return <div>Brak danych pojazdu</div>;
        }
        return (
            <>
                {selectedVehicle.type === 3 && (
                    <>
                        <div className={styles.detailItem}>
                            <p>
                                <strong>Typ:</strong> {typeLabelMap[selectedVehicle.type]}
                            </p>
                        </div>

                        <div className={styles.detailItem}>
                            <p>
                                <strong>Status:</strong> {getStatusText(selectedVehicle.status)}
                            </p>
                        </div>
                        <div className={styles.detailItem}>
                            <h4>Ciągnik:</h4>
                            <ul>
                                <li>
                                    <p>
                                        <strong>ID:</strong>{" "}
                                        {selectedVehicle.id.toString().padStart(3, "0")}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Numer rejestracyjny:</strong>{" "}
                                        {selectedVehicle.registrationNumber}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Marka:</strong> {selectedVehicle.brand}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Model:</strong> {selectedVehicle.model}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Rok produkcji:</strong>{" "}
                                        {selectedVehicle.yearOfProduction}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Kierowca:</strong>{" "}
                                        {selectedVehicle.driver
                                            ? `${selectedVehicle.driver.id} - ${selectedVehicle.driver.firstName} ${selectedVehicle.driver.lastName}`
                                            : "Brak kierowcy"}
                                        {shouldShowAssignDriverButton && (
                                            <span className={styles.driverActions}>
                                                {selectedVehicle.driver ? (
                                                    <>
                                                        {selectedVehicle.status !== 4 &&
                                                            selectedVehicle.status !== 2 && selectedVehicle.status !== 3 && (
                                                                <FaExchangeAlt
                                                                    className={styles.driverIcon}
                                                                    onClick={onOpenDriverListModal}
                                                                    title="Zmień kierowcę"
                                                                />
                                                            )}
                                                        <UnassignDriver
                                                            vehicleId={selectedVehicle.id}
                                                            vehicleStatus={selectedVehicle.status}
                                                            driverName={`${selectedVehicle.driver.firstName} ${selectedVehicle.driver.lastName}`}
                                                            onUnassignSuccess={(updatedVehicle) => {
                                                                if (onVehicleUpdate) {
                                                                    onVehicleUpdate(updatedVehicle);
                                                                }
                                                            }}
                                                        />
                                                    </>
                                                ) : (
                                                    (selectedVehicle.status !== 4) && (
                                                        <IoPersonAdd
                                                            className={styles.driverIcon}
                                                            onClick={onOpenDriverListModal}
                                                            title="Przypisz kierowcę"
                                                        />
                                                    )
                                                )}
                                            </span>
                                        )}
                                    </p>
                                </li>
                            </ul>
                        </div>
                        <div className={styles.detailItem}>
                            <h4>Naczepa:</h4>
                            <ul>
                                <li>
                                    <p>
                                        <strong>ID:</strong>{" "}
                                        {selectedVehicle.semiTrailerId
                                            ? selectedVehicle.semiTrailerId.toString().padStart(3, "0")
                                            : "Brak danych"}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Numer rejestracyjny:</strong>{" "}
                                        {selectedVehicle.semiTrailerRegistrationNumber || "Brak danych"}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Marka:</strong> {selectedVehicle.semiTrailerBrand || "Brak danych"}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Rok produkcji:</strong>{" "}
                                        {selectedVehicle.semiTrailerYearOfProduction || "Brak danych"}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Typ nadwozia:</strong>{" "}
                                        {semiTrailerBodyworkMap[selectedVehicle.semiTrailerBodyworkType] || "Brak danych"}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Ładowność(t):</strong>{" "}
                                        {selectedVehicle.semiTrailerCapacity ?? "Brak danych"}
                                    </p>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
                {selectedVehicle.type !== 3 && (
                    <>
                        <div className={styles.detailItem}>
                            <p>
                                <strong>ID:</strong>{" "}
                                {selectedVehicle.id.toString().padStart(3, "0")}
                            </p>
                        </div>
                        {selectedVehicle.type !== 2 && (
                            <div className={styles.detailItem}>
                                <p>
                                    <strong>Typ:</strong> {typeLabelMap[selectedVehicle.type]}
                                </p>
                            </div>
                        )}
                        <div className={styles.detailItem}>
                            <p>
                                <strong>Numer rejestracyjny:</strong>{" "}
                                {selectedVehicle.registrationNumber}
                            </p>
                        </div>
                        <div className={styles.detailItem}>
                            <p>
                                <strong>Marka:</strong> {selectedVehicle.brand}
                            </p>
                        </div>
                        {(selectedVehicle.type === 1 ||
                            selectedVehicle.type === 4 ||
                            selectedVehicle.type === 5) && (
                                <div className={styles.detailItem}>
                                    <p>
                                        <strong>Model:</strong> {selectedVehicle.model}
                                    </p>
                                </div>
                            )}
                        <div className={styles.detailItem}>
                            <p>
                                <strong>Rok produkcji:</strong> {selectedVehicle.yearOfProduction}
                            </p>
                        </div>
                        {(selectedVehicle.type === 1 ||
                            selectedVehicle.type === 2 ||
                            selectedVehicle.type === 4 ||
                            selectedVehicle.type === 5) && (
                                <div className={styles.detailItem}>
                                    <p>
                                        <strong>Status:</strong> {getStatusText(selectedVehicle.status)}
                                    </p>
                                </div>
                            )}

                        {selectedVehicle.type !== 2 && (
                            <div className={styles.detailItem}>
                                <p>
                                    <strong>Kierowca:</strong>{" "}
                                    {selectedVehicle.driver
                                        ? `${selectedVehicle.driver.id} - ${selectedVehicle.driver.firstName} ${selectedVehicle.driver.lastName}`
                                        : "Brak kierowcy"}
                                    {shouldShowAssignDriverButton && (
                                        <span className={styles.driverActions}>
                                            {selectedVehicle.driver ? (
                                                <>
                                                    {selectedVehicle.status !== 2 &&
                                                        selectedVehicle.status !== 3 &&
                                                        selectedVehicle.status !== 4 && (
                                                            <FaExchangeAlt
                                                                className={styles.driverIcon}
                                                                onClick={onOpenDriverListModal}
                                                                title="Zmień kierowcę"
                                                            />
                                                        )}

                                                    {selectedVehicle.status !== 2 &&
                                                        selectedVehicle.status !== 3 && (
                                                            <UnassignDriver
                                                                vehicleId={selectedVehicle.id}
                                                                vehicleStatus={selectedVehicle.status}
                                                                driverName={`${selectedVehicle.driver.firstName} ${selectedVehicle.driver.lastName}`}
                                                                onUnassignSuccess={(updatedVehicle) => {
                                                                    if (onVehicleUpdate) {
                                                                        onVehicleUpdate(updatedVehicle);
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                </>
                                            ) : (
                                                selectedVehicle.status !== 4 && (
                                                    <IoPersonAdd
                                                        className={styles.driverIcon}
                                                        onClick={onOpenDriverListModal}
                                                        title="Przypisz kierowcę"
                                                    />
                                                )
                                            )}
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                        {selectedVehicle.type === 2 && (
                            <>
                                <div className={styles.detailItem}>
                                    <p>
                                        <strong>Typ nadwozia:</strong>{" "}
                                        {semiTrailerBodyworkMap[selectedVehicle.bodyworkType] || "Brak danych"}
                                    </p>
                                </div>
                                <div className={styles.detailItem}>
                                    <p>
                                        <strong>Ładowność(t):</strong>{" "}
                                        {selectedVehicle.capacity ?? "Brak danych"}
                                    </p>
                                </div>
                            </>
                        )}
                        {selectedVehicle.type === 4 && (
                            <>
                                <div className={styles.detailItem}>
                                    <p>
                                        <strong>Typ nadwozia:</strong>{" "}
                                        {rigidTruckBodyworkMap[selectedVehicle.bodyworkType] || "Brak danych"}
                                    </p>
                                </div>
                                <div className={styles.detailItem}>
                                    <p>
                                        <strong>Ładowność(t):</strong>{" "}
                                        {selectedVehicle.capacity ?? "Brak danych"}
                                    </p>
                                </div>
                            </>
                        )}
                        {selectedVehicle.type === 5 && (
                            <>
                                <div className={styles.detailItem}>
                                    <p>
                                        <strong>Typ nadwozia:</strong>{" "}
                                        {deliveryVanBodyworkMap[selectedVehicle.bodyworkType] || "Brak danych"}
                                    </p>
                                </div>
                                <div className={styles.detailItem}>
                                    <p>
                                        <strong>Ładowność(t):</strong>{" "}
                                        {selectedVehicle.capacity ?? "Brak danych"}
                                    </p>
                                </div>
                            </>
                        )}
                    </>
                )}
            </>
        );
    };

    const handleBreakdownAdded = (newBreakdown: any) => {
        const updatedVehicle = {
            ...selectedVehicle,
            breakdowns: [...(selectedVehicle.breakdowns || []), newBreakdown],
            status: 4,
        };
        if (onVehicleUpdate) {
            onVehicleUpdate(updatedVehicle);
        }
    };

    //const handleOrderAdded = (newOrder: Delivery) => {
    //    const updatedVehicle = {
    //        ...selectedVehicle,
    //        orders: [...(selectedVehicle.orders || []), newOrder],
    //        status: 2,
    //    };
    //    if (onVehicleUpdate) {
    //        onVehicleUpdate(updatedVehicle);
    //    }
    //};

    const handleVehicleUpdate = useCallback((updatedVehicle: any) => {
        if (onVehicleUpdate) {
            onVehicleUpdate(updatedVehicle);
        }
    }, [onVehicleUpdate]);

    const isDamaged = getStatusText(selectedVehicle.status) === "Uszkodzony";

    return (
        <div className={styles.vehicleDetails}>
            <div className={styles.closeButtonWrapper}>
                <button onClick={onClose}>X</button>
            </div>

            <div className={styles.tabs}>
                <button
                    className={activeTab === "vehicle" ? styles.activeTab : ""}
                    onClick={() => setActiveTab("vehicle")}
                >
                    <FaCar /> {selectedVehicle.type === 3 ? "Pojazdy" : "Pojazd"}
                </button>
                <button
                    className={activeTab === "orders" ? styles.activeTab : ""}
                    onClick={() => setActiveTab("orders")}
                >
                    <FaClipboardList /> Zlecenia
                </button>
                <button
                    className={activeTab === "failures" ? styles.activeTab : ""}
                    onClick={() => setActiveTab("failures")}
                >
                    <GiAutoRepair /> Awarie
                </button>
            </div>
            {activeTab === "vehicle" && (
                <>
                    <div className={styles.topButtonsContainer}>
                        {showAssignTrailerButton && (
                            <button
                                disabled={isDamaged}
                                onClick={() => onAssignTrailerToTractor(selectedVehicle.id)}
                                className={`${styles.assignButton} ${isDamaged ? styles.disabledIcon : ""}`}
                                title={isDamaged ? "Nie można dokonać przydziału dla uszkodzonych pojazdów" : ""}
                            >
                                Przydziel naczepę
                            </button>
                        )}
                        {showAssignTractorButton && (
                            <button
                                disabled={isDamaged}
                                onClick={() =>
                                    onAssignTractorToTrailer &&
                                    onAssignTractorToTrailer(selectedVehicle.id)
                                }
                                className={`${styles.assignButton} ${isDamaged ? styles.disabledIcon : ""}`}
                                title={isDamaged ? "Nie można dokonać przydziału dla uszkodzonych pojazdów" : ""}
                            >
                                Przydziel ciągnik siodłowy
                            </button>
                        )}
                        {selectedVehicle.type === 3 && (
                            <SplitSemiTrailerTruck
                                vehicleId={selectedVehicle.id}
                                vehicleStatus={selectedVehicle.status}
                                onSplitSuccess={() => {
                                    onSemiTrailerTruckSplit();
                                    onClose();
                                }}
                            />
                        )}
                        <DeleteVehicle
                            vehicleId={selectedVehicle.id}
                            vehicleType={selectedVehicle.type}
                            onDeleteSuccess={onVehicleDeleted}
                            buttonText={deleteButtonText}
                        />
                    </div>
                    <h3 className={styles.detailsHeader}>
                        {selectedVehicle.type === 3 ? "Szczegóły pojazdów" : "Szczegóły pojazdu"}
                    </h3>
                    <div className={styles.detailsContent}>
                        {renderVehicleDetails()}
                    </div>
                </>
            )}

            {activeTab === "orders" && (
                <OrderList
                    selectedVehicle={selectedVehicle}
                />
            )}

            {activeTab === "failures" && (
                <BreakdownList
                    breakdowns={selectedVehicle.breakdowns || []}
                    vehicleId={selectedVehicle.id}
                    semiTrailerId={selectedVehicle.semiTrailerId}
                    onBreakdownAdded={handleBreakdownAdded}
                    vehicle={selectedVehicle}
                    onVehicleUpdate={handleVehicleUpdate}
                />
            )}
            {isUnassignModalOpen && selectedVehicle.driver && (
                <UnassignDriver
                    vehicleId={selectedVehicle.id}
                    vehicleStatus={selectedVehicle.status}
                    driverName={`${selectedVehicle.driver.firstName} ${selectedVehicle.driver.lastName}`}
                    onUnassignSuccess={(updatedVehicle) => {
                        setIsUnassignModalOpen(false);
                        if (onVehicleUpdate) {
                            onVehicleUpdate(updatedVehicle);
                        }
                        handleVehicleUpdate(updatedVehicle);
                    }}
                />
            )}
        </div>
    );
};

export default VehicleDetails;

