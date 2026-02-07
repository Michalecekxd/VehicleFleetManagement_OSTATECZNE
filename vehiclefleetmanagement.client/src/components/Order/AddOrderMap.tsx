import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import { LatLngExpression, divIcon } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './AddOrderMap.module.css';

export interface Route {
    coordinates: LatLngExpression[];
    distance: number;
    duration: number;
}

interface AddOrderMapProps {
    startPoint: LatLngExpression | null;
    endPoint: LatLngExpression | null;
    routes: Route[];
    selectedRouteIndex: number | null;
    onRouteClick?: (index: number) => void;
    recenterTrigger: number;
}

interface MapControllerProps {
    routes: Route[];
    selectedRouteIndex: number | null;
    recenterTrigger: number;
}
const MapController: React.FC<MapControllerProps & { startPoint: LatLngExpression | null; endPoint: LatLngExpression | null }> = ({
    routes,
    recenterTrigger,
    startPoint,
    endPoint
}) => {
    const map = useMap();

    useEffect(() => {
        const bounds = L.latLngBounds([]);

        routes.forEach(route => {
            route.coordinates.forEach(coord => {
                bounds.extend(coord);
            });
        });

        if (startPoint) {
            bounds.extend(startPoint);
        }
        if (endPoint) {
            bounds.extend(endPoint);
        }

        if (startPoint && endPoint && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (startPoint || endPoint) {
            const point = startPoint || endPoint;
            map.setView(point as LatLngExpression, 7);
        } else {
            const defaultCenter: LatLngExpression = [52.237, 21.017];
            map.setView(defaultCenter, 6);
        }
    }, [startPoint, endPoint, routes, recenterTrigger, map]);

    return null;
};


const startIcon = divIcon({
    html: `<div style="
        background-color: #3b82f6;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        color: white;
        border: 2px solid #2563eb;
    ">🚚</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const endIcon = divIcon({
    html: `<div style="
        background-color:  #3b82f6;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        color: white;
        border: 2px solid #2563eb;
    ">🏁</div>`, 
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});


const AddOrderMap: React.FC<AddOrderMapProps> = ({ startPoint, endPoint, routes, selectedRouteIndex, onRouteClick, recenterTrigger }) => {
    const [clickedRouteIndex, setClickedRouteIndex] = useState<number | null>(null);
    const tooltipRefs = useRef<(L.Tooltip | null)[]>([]);
    const otherRoutesColor = '#7C7171';
    const selectedRouteColor = '#348be7';

    const formatDistance = (distance: number) => (distance / 1000).toFixed(1);
    const formatDuration = (duration: number) => {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const handleRouteClick = (index: number) => {
        if (tooltipRefs.current[index]) {
            tooltipRefs.current[index]?.remove();
        }
        setClickedRouteIndex(index);
        if (onRouteClick) {
            onRouteClick(index);
        }
    };

    return (
        <MapContainer center={[52.237, 21.017] as LatLngExpression} zoom={5} className={styles.mapContainer}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController
                routes={routes}
                selectedRouteIndex={selectedRouteIndex}
                recenterTrigger={recenterTrigger}
                startPoint={startPoint}
                endPoint={endPoint}
            />
            {routes.map((route, index) => (
                <Polyline
                    key={`${index}-${selectedRouteIndex}`}
                    positions={route.coordinates}
                    color={selectedRouteIndex === index ? selectedRouteColor : otherRoutesColor}
                    weight={selectedRouteIndex === index ? 6 : 4}
                    opacity={selectedRouteIndex === index ? 1 : 0.6}
                    eventHandlers={{
                        click: () => handleRouteClick(index)
                    }}
                >
                    {clickedRouteIndex !== index && (
                        <Tooltip
                            sticky
                            direction="right"
                            offset={[10, 0]}
                            className={styles.customTooltip}
                            ref={(el) => {
                                if (el) {
                                    tooltipRefs.current[index] = el;
                                }
                            }}
                        >
                            <div>
                                <strong>Trasa {index + 1}</strong>
                                <br />
                                Dystans: {formatDistance(route.distance)} km
                                <br />
                                Czas: {formatDuration(route.duration)}
                            </div>
                        </Tooltip>
                    )}
                </Polyline>
            ))}

            {startPoint && (
                <Marker position={startPoint} icon={startIcon}>
                    <Popup>Punkt początkowy</Popup>
                </Marker>
            )}
            {endPoint && (
                <Marker position={endPoint} icon={endIcon}>
                    <Popup>Punkt docelowy</Popup>
                </Marker>
            )}
        </MapContainer>
    );
};

export default AddOrderMap;
