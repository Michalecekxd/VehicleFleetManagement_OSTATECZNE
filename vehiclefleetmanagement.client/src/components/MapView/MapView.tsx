import React, { memo, useMemo, useRef, useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, Marker, Popup, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from './MapView.module.css';
import { FaUser, FaPhoneAlt, FaClock, FaBox, FaCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { TbWorld } from "react-icons/tb";

interface Driver {
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

interface Delivery {
    id: number;
    loadDescription: string;
    status: number;
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
    startedAt: string;
    completedAt: string | null;
    clientName: string;
    clientPhone: string;
}

export interface Vehicle {
    id: number;
    status: number;
    latitude: number;
    longitude: number;
    registrationNumber: string;
    type: number;
    driver?: Driver;
    lastModified?: string;
    loadDescription?: string;
    deliveries: Delivery[];
}

interface MapViewProps {
    vehicles: Vehicle[];
    loading: boolean;
    onShowVehicleDetails: (vehicleId: number) => void;
    selectedVehicle: Vehicle | null;
    baseLocation: { latitude: number; longitude: number } | null;
}

type MarkerRefsType = { [key: number]: L.Marker<any> | null };

const MapViewContent = ({ selectedVehicle }: { selectedVehicle: Vehicle | null }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedVehicle && selectedVehicle.latitude && selectedVehicle.longitude &&
            [2].includes(selectedVehicle.status)) {
            const { latitude, longitude } = selectedVehicle;
            map.flyTo([latitude, longitude], map.getZoom(), {
                animate: true,
                duration: 0.3,
                easeLinearity: 0.5
            });
        }
    }, [selectedVehicle, map]);

    return null;
};

const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data.address) {
            const { house_number, road, neighbourhood, city, town, village, country, postcode } = data.address;

            const addressParts = [];
            if (road) addressParts.push(road);
            if (house_number && addressParts.length > 0) {
                addressParts[addressParts.length - 1] += ` ${house_number}`;
            }
            if (neighbourhood) addressParts.push(neighbourhood);
            if (city) {
                addressParts.push(city);
            } else if (town) {
                addressParts.push(town);
            } else if (village) {
                addressParts.push(village);
            }
            if (postcode) addressParts.push(postcode);
            if (country) addressParts.push(country);

            return addressParts.filter(part => part).join(', ');
        }
        return 'Nieznany adres';
    } catch (error) {
        console.error('Błąd podczas pobierania adresu:', error);
        return 'Nieznany adres';
    }
};

const vehicleTypeText: Record<number, string> = {
    3: 'Zestaw',
    4: 'Ciężarówka sztywna',
    5: 'Samochód dostawczy'
};


const MapView: React.FC<MapViewProps> = memo(({ vehicles, loading, onShowVehicleDetails, selectedVehicle, baseLocation }) => {
    const center: LatLngExpression = [52.237, 21.017];
    const markerRefs = useRef<MarkerRefsType>({});

    const [baseAddress, setBaseAddress] = useState<string>('Ładowanie adresu...');

    useEffect(() => {
        if (baseLocation) {
            getAddressFromCoordinates(baseLocation.latitude, baseLocation.longitude)
                .then(address => setBaseAddress(address))
                .catch(() => setBaseAddress('Nieznany adres'));
        }
    }, [baseLocation]);

    const statusIcons = useMemo(() => ({
        blue: L.divIcon({
            className: styles.markerIcon,
            html: `<div class="${styles.marker}" style="border-color: blue;" title="W trasie"></div>`,
            iconSize: [19, 19],
            iconAnchor: [9.5, 9.5]
        }),
        returningToBase: L.divIcon({
            className: styles.markerIcon,
            html: `<div class="${styles.marker}" style="border-color: purple;" title="Powrót do bazy"></div>`,
            iconSize: [19, 19],
            iconAnchor: [9.5, 9.5]
        }),
        default: L.divIcon({
            className: styles.markerIcon,
            html: `<div class="${styles.marker}" style="border-color: black;" title="Nieznany status"></div>`,
            iconSize: [19, 19],
            iconAnchor: [9.5, 9.5]
        }),
        base: L.divIcon({
            className: styles.markerIcon,
            html:
                `<div>
            <span style="font-size: 20px; color: green;">🏢</span>
        </div>`,
            iconSize: [22, 22],
            iconAnchor: [14, 14],
            popupAnchor: [-2, -4]
        })
    }), []);

    const formatCoordinates = (decimal: number, type: "lat" | "lon"): string => {
        const direction = type === "lat"
            ? (decimal >= 0 ? "N" : "S")
            : (decimal >= 0 ? "E" : "W");

        const formattedNumber = decimal % 1 === 0
            ? Math.abs(decimal).toFixed(0)
            : Math.abs(decimal).toFixed(6).replace(/\.?0+$/, "");

        return `${formattedNumber}°${direction}`;
    };

    const renderBasePopup = useCallback(() => (
        <Popup className={styles.popupContainer} offset={[0.7, 0.5]}>
            <div className={styles.popupContent}>
                <div className={styles.vehicleInfo}>
                    <span className={styles.vehicleType} title="Baza">
                        Baza
                    </span>
                </div>
                <div className={styles.baseInfo} title="Współrzędne">
                    <TbWorld className={styles.icon} />
                    {baseLocation
                        ? `${formatCoordinates(baseLocation.latitude, "lat")}, ${formatCoordinates(baseLocation.longitude, "lon")}`
                        : "Brak danych"}
                </div>
                <div className={styles.baseInfo} title="Adres">
                    <FaMapMarkerAlt className={styles.icon} title="Adres" />
                    {baseAddress || "Brak adresu"}
                </div>
            </div>
        </Popup>
    ), [baseAddress, baseLocation]);

    const renderVehiclePopup = useCallback((vehicle: Vehicle) => {
        const activeDelivery = vehicle.deliveries.find(d => d.status === 1)
            || vehicle.deliveries.find(d => d.status === 2);

        return (
            <Popup className={styles.popupContainer} offset={[0.7, 0.5]}>
                <div className={styles.popupContent}>
                    <div className={styles.vehicleInfo}>
                        <span className={styles.vehicleType} title={vehicle.id.toString().padStart(3, '0') + ' - ' + (vehicle.type ? vehicleTypeText[vehicle.type] : 'Nieznany typ')}>
                            {vehicle.id.toString().padStart(3, '0')} - {vehicle.type ? vehicleTypeText[vehicle.type] : 'Nieznany typ'}
                        </span>
                        {vehicle.status === 2 && <FaCircle color="blue" className={styles.statusIcon} title="W trasie" />}
                        {vehicle.status === 3 && <FaCircle color="purple" className={styles.statusIcon} title="Powrót do bazy" />}
                    </div>
                    <div className={styles.driverContact}>
                        <span className={styles.contactItem} title="Kierowca">
                            <FaUser className={styles.icon} title="Kierowca" />
                            {vehicle.driver ? `${vehicle.driver.firstName} ${vehicle.driver.lastName}` : 'Brak'}
                        </span>
                        <span className={styles.contactItem} title="Telefon">
                            <FaPhoneAlt className={styles.icon} title="Telefon" />
                            {vehicle.driver ? vehicle.driver.phoneNumber : 'Brak'}
                        </span>
                    </div>
                    {vehicle.status === 2 && activeDelivery ? (
                        <div className={styles.loadInfo} title="Opis ładunku">
                            <FaBox className={styles.icon} title="Ładunek" />
                            {activeDelivery.loadDescription || 'Brak opisu ładunku'}
                        </div>
                    ) : (
                        <div className={styles.loadInfo} title="Brak ładunku">
                            <FaBox className={styles.icon} title="Ładunek" />
                            Brak ładunku
                        </div>
                    )}
                    <div className={styles.lastModified} title="Ostatnia aktualizacja">
                        <FaClock className={styles.icon} title="Ostatnia aktualizacja" />
                        {vehicle.lastModified
                            ? new Date(vehicle.lastModified).toLocaleString('pl-PL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : 'Brak'}
                    </div>
                    <button
                        onClick={() => onShowVehicleDetails(vehicle.id)}
                        disabled={selectedVehicle?.id === vehicle.id}
                        className={selectedVehicle?.id === vehicle.id ? styles.disabledButton : ""}
                        title={selectedVehicle?.id === vehicle.id ? "Szczegóły dla pojazdu są już wyświetlone" : "Pokaż szczegóły"}
                    >
                        Szczegóły
                    </button>
                </div>
            </Popup>
        );
    }, [onShowVehicleDetails]);

    const vehicleMarkers = useMemo(() => vehicles
        .filter(vehicle => vehicle.status === 2 || vehicle.status === 3)
        .map(vehicle => {
            if (!vehicle.latitude || !vehicle.longitude) {
                return null;
            }

            const position: LatLngExpression = [vehicle.latitude, vehicle.longitude];

            let icon;
            if (vehicle.status === 2) {
                icon = statusIcons.blue;
            } else if (vehicle.status === 3) {
                icon = statusIcons.returningToBase;
            } else {
                icon = statusIcons.default;
            }

            return (
                <Marker
                    key={vehicle.id}
                    position={position}
                    icon={icon}
                    ref={(ref) => { markerRefs.current[vehicle.id] = ref; }}
                    eventHandlers={{
                        click: () => {
                            const marker = markerRefs.current[vehicle.id];
                            if (marker) {
                                marker.openPopup();
                            }
                        }
                    }}
                    zIndexOffset={200}
                >
                    {renderVehiclePopup(vehicle)}
                </Marker>
            );
        })
        .filter(marker => marker !== null), [vehicles, statusIcons, renderVehiclePopup]);

    useEffect(() => {
        if (selectedVehicle) {
            const marker = markerRefs.current[selectedVehicle.id];
            if (marker && marker.getElement()) {
                marker.openPopup();
            }
        }
    }, [selectedVehicle]);

    return (
        <div className={styles.mapWrapper}>
            {loading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <span>Ładowanie mapy...</span>
                </div>
            )}
            <MapContainer
                center={center}
                zoom={5}
                minZoom={4}
                className={styles.mapContainer}
                zoomControl={false}
                maxBounds={[[-90, -180], [90, 180]]}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ZoomControl position="topright" />
                {!loading && vehicleMarkers}

                {baseLocation && (
                    <Marker
                        position={[baseLocation.latitude, baseLocation.longitude]}
                        icon={statusIcons.base}
                        zIndexOffset={100}
                    >
                        {renderBasePopup()}
                    </Marker>
                )}

                <MapViewContent selectedVehicle={selectedVehicle} />
            </MapContainer>
        </div>
    );
});

export default MapView;