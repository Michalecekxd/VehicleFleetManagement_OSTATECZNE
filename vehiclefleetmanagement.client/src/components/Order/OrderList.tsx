import React, { useState, useEffect } from "react";
import { IoMdAddCircle } from "react-icons/io";
import {
    FaHashtag,
    FaInfoCircle,
    FaDownload,
    FaUpload,
    FaCalendarAlt,
    FaClock,
    FaHourglassHalf,
    FaTimesCircle,
    FaCheckCircle,
} from "react-icons/fa";
import styles from "./OrderList.module.css";
import AddOrderForm from "./AddOrderForm";

export interface Delivery {
    id: number;
    vehicleId: number;
    loadDescription: string;
    orderId: number;
    status: number;
    startLatitude: number;
    startLongitude: number;
    startAddress?: string;
    endAddress?: string;
    endLatitude: number;
    endLongitude: number;
    startedAt?: string | null;
    completedAt?: string | null;
}



type ExtendedInfo = {
    forcedStatus?: number;
};

interface DeliveryListProps {
    selectedVehicle?: any;
}

// Function to normalize status to a number
const normalizeStatus = (status: number | string): number => {
    if (typeof status === "number") return status;
    switch (status.toLowerCase()) {
        case "inprogress":
            return 1;
        case "pending":
            return 2;
        case "canceled":
            return 3;
        case "completed":
            return 4;
        default:
            return 0; // Unknown status
    }
};

const getDeliveryStatusText = (status: number | string): string => {
    if (typeof status === "string") {
        switch (status.toLowerCase()) {
            case "inprogress":
                return "W trakcie realizacji";
            case "pending":
                return "Oczekująca";
            case "canceled":
                return "Anulowana";
            case "completed":
                return "Ukończona";
            default:
                return "Nieznany status";
        }
    }
    switch (status) {
        case 1:
            return "W trakcie realizacji";
        case 2:
            return "Oczekująca";
        case 3:
            return "Anulowana";
        case 4:
            return "Ukończona";
        default:
            return "Nieznany status";
    }
};

const formatDate = (isoString: string) =>
    new Date(isoString).toISOString().split("T")[0];
const formatTime = (isoString: string) =>
    new Date(isoString).toTimeString().split(" ")[0];

const OrderListComponent: React.FC<DeliveryListProps> = ({
    selectedVehicle,
}) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [orderList, setOrderList] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialLoaded, setInitialLoaded] = useState(false);

    const [extendedDeliveryMap, setExtendedDeliveryMap] = useState<
        Record<number, ExtendedInfo>
    >(() => {
        const stored = localStorage.getItem("extendedDeliveryMap");
        return stored ? JSON.parse(stored) : {};
    });

    useEffect(() => {
        localStorage.setItem(
            "extendedDeliveryMap",
            JSON.stringify(extendedDeliveryMap)
        );
    }, [extendedDeliveryMap]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!selectedVehicle) {
                setOrderList([]);
                setInitialLoaded(false);
                return;
            }
            if (!initialLoaded) setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/vehicle/${selectedVehicle.id}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();

                if (Array.isArray(data.deliveries)) {
                    // 1. Zmapowane dostawy z forcedStatus
                    const all: Delivery[] = data.deliveries.map((order: Delivery) => {
                        const ext = extendedDeliveryMap[order.id] || {};
                        return {
                            ...order,
                            startAddress: order.startAddress,
                            endAddress: order.endAddress,
                            status: ext.forcedStatus ?? order.status,
                        };
                    });

                    // 2. Grupowanie po orderId
                    const byOrder: Record<number, Delivery[]> = all.reduce<Record<number, Delivery[]>>(
                        (acc, d) => {
                            if (!acc[d.orderId]) acc[d.orderId] = [];
                            acc[d.orderId].push(d);
                            return acc;
                        },
                        {}
                    );

                    // 3. Wyznaczenie, które orderId zostawiamy
                    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    const validOrderIds = new Set<number>();

                    for (const [orderIdStr, list] of Object.entries(byOrder)) {
                        const orderId = Number(orderIdStr);
                        const completedDates: Date[] = list
                            .map(d => (d.completedAt ? new Date(d.completedAt) : null))
                            .filter((dt): dt is Date => dt !== null);

                        // jeśli są ciągle otwarte (brak żadnej completedAt) — zostawiamy
                        if (completedDates.length === 0) {
                            validOrderIds.add(orderId);
                            continue;
                        }

                        // inaczej bierzemy najnowszą datę zakończenia
                        const last = completedDates.reduce((a, b) => (a > b ? a : b));
                        if (last >= sevenDaysAgo) {
                            validOrderIds.add(orderId);
                        }
                    }

                    // 4. Finalne filtrowanie
                    const recent = all.filter(d => validOrderIds.has(d.orderId));

                    setOrderList(prev =>
                        JSON.stringify(prev) === JSON.stringify(recent) ? prev : recent
                    );
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                if (!initialLoaded) {
                    setLoading(false);
                    setInitialLoaded(true);
                }
            }
        };

        fetchOrders();
        const intervalId = setInterval(fetchOrders, 3000);
        return () => clearInterval(intervalId);
    }, [selectedVehicle, initialLoaded, extendedDeliveryMap]);

    const handleAddOrder = (newOrder: Delivery) => {
        //onOrderAdded?.(newOrder);
        setIsAddModalOpen(false);
        setOrderList((prev) =>
            prev.some((o) => o.id === newOrder.id) ? prev : [...prev, newOrder]
        );
    };

    const handleCancelDelivery = async (deliveryId: number) => {
        try {
            const resp = await fetch(
                `/api/delivery/${deliveryId}/cancel`,
                { method: "POST" }
            );
            if (!resp.ok) throw new Error("Nie udało się anulować dostawy.");
            setOrderList((prev) =>
                prev.map((o) =>
                    o.id === deliveryId ? { ...o, status: 3 } : o
                )
            );
            setExtendedDeliveryMap((prev) => ({
                ...prev,
                [deliveryId]: {
                    ...(prev[deliveryId] || {}),
                    forcedStatus: 3,
                },
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const hasActiveBreakdown = () => {
        if (!selectedVehicle) return false;

        // Sprawdź aktywne awarie  ( === null)
        const breakdowns = selectedVehicle.breakdowns || selectedVehicle.Breakdowns || [];

        const activeBreakdowns = breakdowns.filter(
            (b: any) => b.endedAt === null || b.EndedAt === null
        );

        return activeBreakdowns.length > 0;
    };

    const isAddButtonActive = () => {
        const s = selectedVehicle?.status;
        const hasBreakdown = hasActiveBreakdown();

        return (
            !!selectedVehicle &&
            s !== 4 &&
            s != null &&
            ![1, 2].includes(selectedVehicle.type) &&
            !hasBreakdown
        );
    };
    const getAddButtonTooltip = () => {
        if (!selectedVehicle) return "Wybierz pojazd";
        if (hasActiveBreakdown()) return "Pojazd ma aktywną awarię";
        if (selectedVehicle.status === 4) return "Pojazd uszkodzony";
        if (selectedVehicle.status == null)
            return "Nie można dodać zlecenia dla pojazdu z obecnym statusem";
        if ([1, 2].includes(selectedVehicle.type))
            return "Nie można dodać zlecenia dla wybranego pojazdu";
        return "Dodaj zlecenie";
    };

    const deliveriesByOrder = [...orderList]
        .sort((a, b) => a.id - b.id)
        .reduce((groups, d) => {
            (groups[d.orderId] ||= []).push(d);
            return groups;
        }, {} as Record<number, Delivery[]>);

    const sortedOrderIds = Object.keys(deliveriesByOrder)
        .map(id => Number(id))
        .sort((a, b) => b - a);

    return (
        <div className={styles.ordersTab}>
            <div className={styles.headerContainer}>
                <h4>Zlecenia</h4>
                <IoMdAddCircle
                    className={`${styles.addOrderIcon} ${!isAddButtonActive() ? styles.disabledIcon : ""}`}
                    onClick={() => isAddButtonActive() && setIsAddModalOpen(true)}
                    title={getAddButtonTooltip()}
                />
            </div>

            {loading && !orderList.length ? (
                <p>Ładowanie zleceń...</p>
            ) : error ? (
                <p>Błąd pobierania zleceń: {error}</p>
            ) : orderList.length ? (
                <ul className={styles.orderList}>
                    {sortedOrderIds.map(orderId => {
                        const ds = deliveriesByOrder[orderId];
                        return (
                            <li key={orderId} className={styles.orderItem}>
                                <h5>Zlecenie ID: {orderId}</h5>
                                {[...ds]
                                    .sort((a, b) => {
                                        const priority = (status: number) => {
                                            if (status === 1) return 0;
                                            if (status === 2) return 1;
                                            return 2;
                                        };
                                        return priority(normalizeStatus(a.status)) - priority(normalizeStatus(b.status));
                                    })
                                    .map((d, i) => {
                                        const statusNum = normalizeStatus(d.status);
                                        const pending = statusNum === 2;
                                        const finished = statusNum === 3 || statusNum === 4;
                                        const baseStyle = i < ds.length - 1
                                            ? {
                                                borderBottom: "1px solid #e0e0e0",
                                                marginBottom: 12,
                                                paddingBottom: 12,
                                            }
                                            : {};

                                        return (
                                            <div
                                                key={d.id}
                                                className={`
                                                ${styles.deliveryRow} 
                                                ${pending ? styles.pendingDelivery : ""} 
                                                ${finished ? styles.opacityDelivery : ""}
                                            `}
                                                style={{
                                                    ...baseStyle,
                                                    opacity: finished ? 0.4 : 1,
                                                    transition: "none"
                                                }}
                                            >
                                                {pending && <FaHourglassHalf className={styles.pendingIcon} />}
                                                {statusNum === 3 && <FaTimesCircle className={styles.canceledIcon} />}
                                                {statusNum === 4 && <FaCheckCircle className={styles.completedIcon} />}

                                                <div className={styles.deliveryHeader}>
                                                    <span className={styles.loadDescription}>{d.loadDescription}</span>
                                                    <div className={styles.deliveryId}>
                                                        <span className={styles.deliveryValue}>
                                                            <div className={styles.deliveryText}>Dostawa nr</div>
                                                            <FaHashtag className={styles.deliveryIdHashtag} /> {d.id}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className={styles.statusRow}>
                                                    <span className={styles.fieldLabel}>
                                                        <FaInfoCircle className={styles.icon} /> Status:
                                                    </span>
                                                    <span className={styles.fieldValue}>
                                                        {getDeliveryStatusText(d.status)}
                                                    </span>
                                                </p>

                                                <p>
                                                    <FaDownload className={styles.icon} /> Załadunek:
                                                    <br />
                                                    {d.startAddress ?? "Brak danych"}
                                                </p>
                                                <p>
                                                    <FaUpload className={styles.icon} /> Rozładunek:
                                                    <br />
                                                    {d.endAddress ?? "Brak danych"}
                                                </p>

                                                {d.startedAt && (
                                                    <p className={styles.dateRow}>
                                                        <span className={styles.label}>Rozpoczęto:</span>
                                                        <span className={styles.dateGroup}>
                                                            <FaCalendarAlt className={styles.icon} />
                                                            <span className={styles.dateValue}>{formatDate(d.startedAt)}</span>
                                                        </span>
                                                        <span className={styles.timeGroup}>
                                                            <FaClock className={styles.icon} />
                                                            <span className={styles.timeValue}>{formatTime(d.startedAt)}</span>
                                                        </span>
                                                    </p>
                                                )}
                                                {d.completedAt && (
                                                    <p className={styles.dateRow}>
                                                        <span className={styles.label}>Zakończono:</span>
                                                        <span className={styles.dateGroup}>
                                                            <FaCalendarAlt className={styles.icon} />
                                                            <span className={styles.dateValue}>{formatDate(d.completedAt)}</span>
                                                        </span>
                                                        <span className={styles.timeGroup}>
                                                            <FaClock className={styles.icon} />
                                                            <span className={styles.timeValue}>{formatTime(d.completedAt)}</span>
                                                        </span>
                                                    </p>
                                                )}

                                                {pending && (
                                                    <button
                                                        onClick={() => handleCancelDelivery(d.id)}
                                                        className={styles.cancelButton}
                                                    >
                                                        Anuluj
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className={styles.noOrders}>Brak zapisanych zleceń.</p>
            )}

            {isAddModalOpen && (
                <AddOrderForm
                    onClose={() => setIsAddModalOpen(false)}
                    onOrderAdded={handleAddOrder}
                    selectedVehicle={selectedVehicle}
                />
            )}
        </div>
    );
};

function areEqual(prevProps: DeliveryListProps, nextProps: DeliveryListProps) {
    return prevProps.selectedVehicle?.id === nextProps.selectedVehicle?.id;
}

export default React.memo(OrderListComponent, areEqual);
