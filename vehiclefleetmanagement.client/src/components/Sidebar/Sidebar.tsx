import React, { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import styles1 from "../Vehicle/Vehicle.module.css";
import { FaTruck, FaUser, FaListOl } from "react-icons/fa";
import AddVehicleForm from "../Vehicle/AddVehicleForm";
import VehicleDetails from "../Vehicle/VehicleDetails";
import TractorUnitList from "../Vehicle/AvailableTractorUnitList";
import { JSX } from "react/jsx-dev-runtime";
import VehicleIcon1 from '../Vehicle/VehicleIcon1';
import VehicleIcon2 from "../Vehicle/VehicleIcon2";
import VehicleIcon3 from "../Vehicle/VehicleIcon3";
import VehicleIcon4 from "../Vehicle/VehicleIcon4";
import VehicleIcon5 from "../Vehicle/VehicleIcon5";
import SemiTrailerList from "../Vehicle/AvailableSemiTrailerList";
import DriverList from "../Driver/DriverList";
import AddDriverForm from "../Driver/AddDriverForm";
import AvailableDriverList from "../Driver/AvailableDriverList";
import { IoMdAddCircle } from "react-icons/io";
import { AiFillTool } from "react-icons/ai";
import MainDeliveryList from "../MainDeliveryList/MainDeliveryList";


interface SidebarProps {
    selectedVehicle: any | null;
    setSelectedVehicle: (vehicle: any | null) => void;
    activeMenu: string | null;
    setActiveMenu: (menu: string | null) => void;
    onShowVehicleDetails: (vehicleId: number) => void;
    baseLocation: { latitude: number; longitude: number } | null;
    vehicleStatuses: { id: number, status: number }[]; // Nowy prop: lista statusów pojazdów
    onVehicleUpdate: (updatedVehicle: any) => void;  // ← Dodany prop
}

const Sidebar: React.FC<SidebarProps> = ({ selectedVehicle, setSelectedVehicle, activeMenu, setActiveMenu, onShowVehicleDetails, baseLocation, vehicleStatuses, onVehicleUpdate }) => {

    const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>("All");
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("All");
    const [vehicles, setVehicles] = useState<any[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tractorUnitIdForSemiTrailer, setTractorUnitIdForSemiTrailer] = useState<number | null>(null);
    const [selectedTractorUnitDetails, setSelectedTractorUnitDetails] = useState<any | null>(null);

    const [isTractorUnitListModalOpen, setIsTractorUnitListModalOpen] = useState(false);
    const [selectedTractorUnit, setSelectedTractorUnit] = useState<any | null>(null);
    const [isSemiTrailerListModalOpen, setIsSemiTrailerListModalOpen] = useState(false);

    const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
    const [drivers, setDrivers] = useState<any[]>([]);

    const [isDriverListModalOpen, setIsDriverListModalOpen] = useState(false);

    const [loadingDrivers, setLoadingDrivers] = useState(true);

    const [isLoading, setIsLoading] = useState(true);

    const statusMap: Record<string, number | null | undefined> = {
        "Unavailable": null,
        "Available": 1,
        "OnTheRoad": 2,
        "ReturningToBase": 3,
        "Damaged": 4,
        "All": undefined,
    };

    const typeMap: Record<string, number | undefined> = {
        "TractorUnit": 1,
        "SemiTrailer": 2,
        "SemiTrailerTruck": 3,
        "RigidTruck": 4,
        "DeliveryVan": 5,
        "All": undefined
    };

    const statusLabelMap: Record<number, string> = {
        1: "Dostępny",
        2: "W trasie",
        3: "Powrót do bazy",
        4: "Uszkodzony",
        5: "Niedostępny"
    };

    const typeLabelMap: Record<number, string> = {
        1: "Ciągnik siodłowy",
        2: "Naczepa",
        3: "Zestaw",
        4: "Ciężarówka sztywna",
        5: "Samochód dostawczy"
    };

    const vehicleIconMap: Record<number, JSX.Element> = {
        1: <VehicleIcon1 />,
        2: <VehicleIcon2 />,
        3: <VehicleIcon3 />,
        4: <VehicleIcon4 />,
        5: <VehicleIcon5 />,
    };

    const getStatusText = (status: number): string => {
        if (status === 1) return "Dostępny";
        if (status === 2) return "W trasie";
        if (status === 3) return "Powrót do bazy";
        if (status === 4) return "Uszkodzony";
        return "Niedostępny";
    };

    const handleDriverAdded = (newDriver: any) => {
        setDrivers(prevDrivers => {
            const updatedDrivers = [...prevDrivers, newDriver];
            localStorage.setItem("drivers", JSON.stringify(updatedDrivers));
            return updatedDrivers;
        });
    };


    //useEffect(() => {
    //    const intervalId = setInterval(() => {
    //        fetchVehicles();
    //    }, 1000); // co 5 sekund
    //    return () => clearInterval(intervalId);
    //}, [activeMenu, vehicleStatusFilter, vehicleTypeFilter]);

    const fetchVehicles = () => {
        if (activeMenu === "vehicles") {
            setIsLoading(true);

            const storedVehicles = localStorage.getItem("vehicles");
            if (storedVehicles) {
                const storedData = JSON.parse(storedVehicles);
                let filtered = storedData;
                if (vehicleStatusFilter !== "All") {
                    filtered = filtered.filter((vehicle: any) => vehicle.status === statusMap[vehicleStatusFilter]);
                }
                if (vehicleTypeFilter !== "All") {
                    filtered = filtered.filter((vehicle: any) => vehicle.type === typeMap[vehicleTypeFilter]);
                }
                if (JSON.stringify(filtered) !== JSON.stringify(vehicles)) {
                    setVehicles(filtered);
                }
                setIsLoading(false);
            } else {
                setIsLoading(true);
            }

            fetch("/api/vehicle")
                .then((response) => response.json())
                .then((data: any) => {
                    if (storedVehicles && JSON.stringify(data) === storedVehicles) {
                        setIsLoading(false);
                    } else {
                        fetch("/api/vehicle?type=3")
                            .then((response) => {
                                if (response.status === 404) {
                                    console.warn("Nie znaleziono zestawów (type 3)");
                                    return [];
                                }
                                return response.json();
                            })
                            .then((sets: any[]) => {
                                const assignedIds = sets
                                    .filter((set: any) => set.semiTrailerId != null)
                                    .map((set: any) => set.semiTrailerId);
                                let filtered = data.filter((vehicle: any) => {
                                    return !(vehicle.type === 2 && assignedIds.includes(vehicle.id));
                                });

                                if (vehicleStatusFilter !== "All") {
                                    filtered = filtered.filter((vehicle: any) => vehicle.status === statusMap[vehicleStatusFilter]);
                                }
                                if (vehicleTypeFilter !== "All") {
                                    filtered = filtered.filter((vehicle: any) => vehicle.type === typeMap[vehicleTypeFilter]);
                                }

                                //setVehicles(data);
                                setVehicles(filtered);
                                localStorage.setItem("vehicles", JSON.stringify(filtered));
                                setIsLoading(false);
                            })
                            .catch(() => {
                                console.error("Nie znaleziono zestawów");
                                setIsLoading(false);
                            });
                    }
                })
                .catch((error: any) => {
                    const message = error instanceof Error ? error.message : "Nieznany błąd podczas pobierania pojazdów";
                    setError(`Błąd pobierania pojazdów: ${message}`);
                    setIsLoading(false);
                });
        }
    };
    const [error, setError] = useState('');



    useEffect(() => {
        if (vehicleStatuses.length > 0 && vehicles.length > 0) {
            const updatedVehicles = vehicles.map((vehicle) => {
                const updatedStatus = vehicleStatuses.find(vs => vs.id === vehicle.id);
                if (updatedStatus) {
                    return {
                        ...vehicle,
                        status: updatedStatus.status,
                        statusText: getStatusText(updatedStatus.status)
                    };
                }
                return vehicle;
            });

            setVehicles(updatedVehicles);
        }
    }, [vehicleStatuses]);

    const fetchDrivers = async () => {
        const storedDrivers = localStorage.getItem("drivers");

        if (storedDrivers) {
            const storedData = JSON.parse(storedDrivers);

            try {
                const response = await fetch("/api/driver");
                if (!response.ok) throw new Error("Błąd podczas pobierania danych z serwera.");

                const dataFromServer = await response.json();

                if (JSON.stringify(dataFromServer) === JSON.stringify(storedData)) {
                    setDrivers(storedData);
                    return;
                } else {
                    setLoadingDrivers(true);
                    setDrivers(dataFromServer);
                    localStorage.setItem("drivers", JSON.stringify(dataFromServer));
                }
            } catch (error) {
                console.error("Error fetching drivers: ", error);
                setDrivers([]);
            } finally {
                setLoadingDrivers(false);
            }
        } else {
            setLoadingDrivers(true);
            try {
                const response = await fetch("/api/driver");
                if (!response.ok) throw new Error("Błąd podczas pobierania danych z serwera.");
                const data = await response.json();
                setDrivers(data);
                localStorage.setItem("drivers", JSON.stringify(data));
            } catch (error) {
                console.error("Error fetching drivers: ", error);
                setDrivers([]);
            } finally {
                setLoadingDrivers(false);
            }
        }
    };

    //const fetchOrders = async () => {
    //    try {
    //        const response = await fetch("/api/delivery");
    //        if (!response.ok) {
    //            throw new Error("Błąd podczas pobierania zleceń");
    //        }
    //        //const data = await response.json();
    //    } catch (error) {
    //        console.error("Błąd:", error);
    //    }
    //};



    useEffect(() => {
        if (activeMenu === "vehicles") {
            fetchVehicles();
        }
        if (activeMenu === "drivers") {
            fetchDrivers();
        }
        //if (activeMenu === "orders") {
        //    fetchOrders();
        //}
    }, [activeMenu, vehicleStatusFilter, vehicleTypeFilter]);

    const toggleMenu = (menu: string) => {
        if (activeMenu === menu) {
            setActiveMenu(null);
        } else {
            setActiveMenu(menu);
            if (menu !== "vehicles") {
                setSelectedVehicle(null);
            }
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
        setTractorUnitIdForSemiTrailer(null);
        setSelectedTractorUnit(null);
        setSelectedTractorUnitDetails(null);
    };

    const openModalForSemiTrailer = async (tractorUnitId: number) => {
        setIsModalOpen(true);
        setTractorUnitIdForSemiTrailer(tractorUnitId);
        setSelectedTractorUnit(null);
        setSelectedTractorUnitDetails(null);

        try {
            const response = await fetch(`/api/vehicle/${tractorUnitId}`);
            if (!response.ok) {
                throw new Error(`Error fetching TractorUnit: ${response.status}`);
            }
            const data = await response.json();
            setSelectedTractorUnit(data);
        } catch (error) {
            console.error("Error fetching TractorUnit:", error);
        }
    };

    const openModalForTractorAssignment = () => {
        setIsModalOpen(true);
        setTractorUnitIdForSemiTrailer(null);
        setSelectedTractorUnit(null);
        setSelectedTractorUnitDetails(selectedVehicle);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTractorUnitIdForSemiTrailer(null);
        setIsTractorUnitListModalOpen(false);
        setSelectedTractorUnit(null);
        setSelectedTractorUnitDetails(null);
    };

    const closeTractorUnitListModal = () => {
        setIsTractorUnitListModalOpen(false);
    };

    const openTractorUnitListModal = () => {
        setIsTractorUnitListModalOpen(true);
    };

    const handleTractorUnitSelect = (selectedTractorUnit: any) => {
        setTractorUnitIdForSemiTrailer(selectedTractorUnit.id);
        setSelectedTractorUnit(selectedTractorUnit);
        setIsTractorUnitListModalOpen(false);
    };

    const handleVehicleClick = (vehicle: any) => {
        if (!vehicle) return;

        fetch(`/api/vehicle/${vehicle.id}`)
            .then(response => response.json())
            .then(data => {
                setSelectedVehicle(data);

                if (data.type === 2) {
                    setSelectedTractorUnitDetails(data);
                    setSelectedTractorUnit(null);
                } else if (data.type === 1) {
                    setSelectedTractorUnit(data);
                    setSelectedTractorUnitDetails(null);
                }
            })
            .catch(error => console.error("Error fetching vehicle details:", error));
    };

    const openSemiTrailerListModal = () => {
        setIsSemiTrailerListModalOpen(true);
    };

    const closeSemiTrailerListModal = () => {
        setIsSemiTrailerListModalOpen(false);
    };

    const handleSemiTrailerSelect = (selectedSemiTrailer: any) => {
        setSelectedTractorUnitDetails(selectedSemiTrailer);
        setIsSemiTrailerListModalOpen(false);
    };

    const handleVehicleDeleted = () => {
        fetchVehicles();
        setSelectedVehicle(null);
    };

    const openAddDriverModal = () => setIsAddDriverModalOpen(true);
    const closeAddDriverModal = () => setIsAddDriverModalOpen(false);

    const openDriverListModal = () => setIsDriverListModalOpen(true);
    const closeDriverListModal = () => setIsDriverListModalOpen(false);

    const handleSemiTrailerTruckSplit = () => {
        fetchVehicles();
        setSelectedVehicle(null);
    };

    const handleDriverDeleted = () => {
        fetchDrivers();
    };


    return (
        <>
            <aside className={styles.sidebar}>
                <div
                    className={`${styles.icon} ${activeMenu === "vehicles" ? styles.activeIcon : ""}`}
                    onClick={() => toggleMenu("vehicles")}
                    title="Pojazdy"
                >
                    <FaTruck size={30} />
                </div>
                <div
                    className={`${styles.icon} ${activeMenu === "drivers" ? styles.activeIcon : ""}`}
                    onClick={() => toggleMenu("drivers")}
                    title="Kierowcy"
                >
                    <FaUser size={30} />
                </div>
                <div
                    className={`${styles.icon} ${activeMenu === "deliveries" ? styles.activeIcon : ""}`}
                    onClick={() => toggleMenu("deliveries")}
                    title="Dostawy"
                >
                    <FaListOl size={30} />
                </div>
            </aside>
            {activeMenu === "vehicles" && (
                <div className={`${styles.expandedContainer} ${styles.active}`}>
                    <div className={styles.stickySection}>
                        <div className={styles.headerContainer}>
                            <div className={styles.vehiclesHeader}>
                                <FaTruck size={30} style={{ color: '#007bff' }} />
                                <h3>Pojazdy</h3>
                                <IoMdAddCircle
                                    className={styles.addVehicleIcon}
                                    onClick={openModal}
                                    title="Dodaj pojazd"
                                />
                            </div>
                        </div>
                        <div className={styles.filtersContainer}>
                            <div>
                                <label htmlFor="statusFilter">Status:</label>
                                <select
                                    id="statusFilter"
                                    value={vehicleStatusFilter}
                                    onChange={(e) => setVehicleStatusFilter(e.target.value)}
                                >
                                    <option value="All">Wszystkie</option>
                                    {Object.entries(statusMap).map(([key, value]) => {
                                        if (key === "All") return null;
                                        const label = value != null ? statusLabelMap[value] : "Niedostępny";
                                        return (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="typeFilter">Typ:</label>
                                <select
                                    id="typeFilter"
                                    value={vehicleTypeFilter}
                                    onChange={(e) => setVehicleTypeFilter(e.target.value)}
                                >
                                    <option value="All">Wszystkie</option>
                                    {Object.entries(typeMap).map(([key, value]) => {
                                        if (key === "All") return null;
                                        const label = value != null ? typeLabelMap[value] : "Brak";
                                        return (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div>
                    <br/>
                        {error && <span style={{ color: 'red' }}>{error}</span>}

                        {isLoading ? (
                            <p><br />Ładowanie pojazdów...</p>
                        ) : vehicles.length === 0 ? (
                            <p><br />Nie znaleziono żadnych pojazdów.</p>
                        ) : (
                            <ul className={styles.vehicleList}>
                                {vehicles.map((vehicle) => (
                                    <li
                                        key={vehicle.id}
                                        className={`${styles.vehicleItem} ${selectedVehicle && selectedVehicle.id === vehicle.id ? styles.selected : ""}`}
                                        onClick={() => handleVehicleClick(vehicle)}
                                    >
                                        <div className={styles.statusIconsContainer}>
                                            {vehicle.status === 1 && (
                                                <span className={styles.availableDot} title={getStatusText(vehicle.status)}></span>
                                            )}
                                            {vehicle.status === 2 && (
                                                <span className={styles.onTheRoadDot} title={getStatusText(vehicle.status)}></span>
                                            )}
                                            {vehicle.status === 3 && (
                                                <span className={styles.returningToBaseDot} title={getStatusText(vehicle.status)}></span>
                                            )}
                                            {vehicle.status === 4 && (
                                                <AiFillTool className={styles.repairIcon} title={getStatusText(vehicle.status)} />
                                            )}
                                        </div>
                                        <div className={styles.vehicleHeader}>
                                            <div className={styles.vehicleInfo}>
                                                <span style={{ marginRight: 8 }}>{vehicleIconMap[vehicle.type]}</span>
                                                <div className={styles.vehicleHead}>
                                                    {vehicle.id.toString().padStart(3, '0')} - {typeLabelMap[vehicle.type]}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.vehicleDetails}>
                                            Nr rej.: {vehicle.registrationNumber}, Marka: {vehicle.brand}, Rok prod.: {vehicle.yearOfProduction}, Status: {getStatusText(vehicle.status)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            {activeMenu === "drivers" && (
                <div className={styles.driversContainer}>
                    <DriverList
                        drivers={drivers}
                        loading={loadingDrivers}
                        onAddDriverClick={openAddDriverModal}
                        onDeleteSuccess={handleDriverDeleted}
                    />
                </div>
            )}
            {activeMenu === "deliveries" && (
                <MainDeliveryList />
            )}

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <AddVehicleForm
                        closeModal={closeModal}
                        onVehicleAdded={() => {
                            setSelectedVehicle(null);
                            fetchVehicles();
                        }}
                        tractorUnitId={tractorUnitIdForSemiTrailer}
                        selectedTractorUnit={selectedTractorUnit}
                        openTractorUnitListModal={openTractorUnitListModal}
                        openSemiTrailerListModal={openSemiTrailerListModal}
                        selectedTractorUnitDetails={selectedTractorUnitDetails}
                        baseLocation={baseLocation}
                    />
                </div>
            )}

            {isTractorUnitListModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles1.chooseVehicleModalContainer}>
                        <button className={styles1.closeButton} onClick={closeTractorUnitListModal}>X</button>
                        <h3>Wybierz ciągnik siodłowy</h3>
                        <br />
                        <TractorUnitList onSelect={handleTractorUnitSelect} />
                    </div>
                </div>
            )}


            {activeMenu === "vehicles" && selectedVehicle && (
                <VehicleDetails
                    selectedVehicle={selectedVehicle}
                    onClose={() => setSelectedVehicle(null)}
                    onAssignTrailerToTractor={openModalForSemiTrailer}
                    onAssignTractorToTrailer={openModalForTractorAssignment}
                    onVehicleDeleted={handleVehicleDeleted}
                    onSemiTrailerTruckSplit={handleSemiTrailerTruckSplit}
                    onOpenDriverListModal={openDriverListModal}
                    onVehicleUpdate={onVehicleUpdate}
                    onShowVehicleDetails={onShowVehicleDetails}

                />
            )}

            {isSemiTrailerListModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles1.chooseVehicleModalContainer}>
                        <button className={styles1.closeButton} onClick={closeSemiTrailerListModal}>X</button>
                        <h3>Wybierz naczepę</h3>
                        <br />
                        <SemiTrailerList onSelect={handleSemiTrailerSelect} />
                    </div>
                </div>
            )}

            {isAddDriverModalOpen && (
                <div className={styles.modalOverlay}>
                    <AddDriverForm
                        closeModal={closeAddDriverModal}
                        onDriverAdded={handleDriverAdded}
                    />
                </div>
            )}

            {isDriverListModalOpen && (
                <div className={styles.modalOverlay}>
                    <AvailableDriverList
                        onDriverSelect={(updatedVehicle) => {
                            setSelectedVehicle(updatedVehicle);
                            closeDriverListModal();
                        }}
                        onClose={closeDriverListModal}
                        vehicleId={selectedVehicle?.id}
                        onVehicleUpdate={onVehicleUpdate}
                    />
                </div>
            )}
        </>
    );
};

export default Sidebar;