import React, { useState, useEffect, useCallback } from "react";
import styles from "./RoutePlanner.module.css";
import { TbCircleNumber1Filled, TbCircleNumber2Filled, TbCircleNumber3Filled } from "react-icons/tb";

interface Route {
    coordinates: [number, number][];
    distance: number;
    duration: number;
}

interface RoutePlannerProps {
    startPoint: { lat: number; lng: number } | null;
    endPoint: { lat: number; lng: number } | null;
    onRouteSelect: (index: number) => void;
    onRoutesLoaded: (routes: Route[]) => void;
    selectedRouteIndex: number | null;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({ startPoint, endPoint, onRouteSelect, onRoutesLoaded, selectedRouteIndex }) => {
    const [routes, setRoutes] = useState<Route[]>([]);

    const fetchRoutes = useCallback(async () => {
        if (startPoint && endPoint) {
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?alternatives=2&geometries=geojson&overview=full`
                );
                //const response = await fetch(`api/osrmproxy/route?start=${startPoint.lng},${startPoint.lat}&end=${endPoint.lng},${endPoint.lat}`);

                const data = await response.json();
                if (data.routes) {
                    const fetchedRoutes: Route[] = data.routes.map((route: any) => ({
                        coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
                        distance: route.distance,
                        duration: route.duration
                    }));

                    setRoutes(fetchedRoutes);
                    onRoutesLoaded(fetchedRoutes);
                }
            } catch (error) {
                console.error("Błąd pobierania tras:", error);
            }
        }
    }, [startPoint, endPoint, onRoutesLoaded]);

    useEffect(() => {
        if (startPoint && endPoint) {
            const timer = setTimeout(() => {
                fetchRoutes();
            }, 500); // opóźnienie 500ms
            return () => clearTimeout(timer);
        }
    }, [startPoint, endPoint, fetchRoutes]);

    const formatDistance = (distance: number) => (distance / 1000).toFixed(1);
    const formatDuration = (duration: number) => {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <>
            {routes.length > 0 && (
                <div className={styles.routeInfoContainer}>
                    <div className={styles.routeInfoHeader}>Wybór trasy:</div>
                    {routes.map((route, index) => (
                        <div
                            key={index}
                            className={`${styles.routeInfoItem} ${selectedRouteIndex === index ? styles.selected : ''}`}
                            onClick={() => {
                                onRouteSelect(index);
                            }}
                        >
                            <span className={styles.routeLabel}>
                                {index === 0 ? (
                                    <TbCircleNumber1Filled className={styles.icon} />
                                ) : index === 1 ? (
                                    <TbCircleNumber2Filled className={styles.icon} />
                                ) : (
                                    <TbCircleNumber3Filled className={styles.icon} />
                                )}
                            </span>
                            <span className={styles.routeDetails}>
                                Dystans: {formatDistance(route.distance)} km, Czas: {formatDuration(route.duration)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default RoutePlanner;