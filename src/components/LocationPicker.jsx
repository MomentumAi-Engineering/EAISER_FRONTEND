import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, LayersControl } from 'react-leaflet';
import axios from 'axios';
import { Loader2, Navigation, MapPin, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';

// Fix for Leaflet default marker icons
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map movements and center pin animation
const MapController = ({ onMove, onDragStart, center }) => {
    const map = useMapEvents({
        dragstart: () => {
            onDragStart(true);
        },
        dragend: () => {
            onDragStart(false);
            const newCenter = map.getCenter();
            onMove({ lat: newCenter.lat, lng: newCenter.lng });
        },
        zoomend: () => {
            const newCenter = map.getCenter();
            onMove({ lat: newCenter.lat, lng: newCenter.lng });
        }
    });

    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lng], map.getZoom(), {
                duration: 1.5
            });
        }
    }, [center, map]);

    return null;
};

export default function LocationPicker({ onLocationChange, initialCoords = { lat: 36.1627, lng: -86.7816 } }) {
    const [mapCenter, setMapCenter] = useState(initialCoords);
    const [streetAddress, setStreetAddress] = useState("");
    const [details, setDetails] = useState(""); // For manual landmark/house no
    const [zipCode, setZipCode] = useState("");
    const [loadingLoc, setLoadingLoc] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isGPS, setIsGPS] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const suggestionTimeoutRef = useRef(null);

    // Throttle address lookup
    const timeoutRef = useRef(null);

    const fetchAddress = async (lat, lng) => {
        setIsGeocoding(true);
        try {
            // Request detailed address with zoom 18
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: { 'Accept-Language': 'en-US' }
            });
            if (res.data) {
                const addr = res.data.address || {};
                const parts = [];

                // 1. Specific Building / Point of Interest (Crucial for Deep Address)
                if (addr.amenity) parts.push(addr.amenity);
                else if (addr.shop) parts.push(addr.shop);
                else if (addr.building) parts.push(addr.building);
                else if (addr.leisure) parts.push(addr.leisure);
                else if (res.data.name) parts.push(res.data.name);

                // 2. House Number & Street
                if (addr.house_number) parts.push(addr.house_number);
                if (addr.road) parts.push(addr.road);

                // 3. Local Area (Gali / Block / Sector)
                if (addr.neighbourhood) parts.push(addr.neighbourhood);
                if (addr.suburb) parts.push(addr.suburb);
                if (addr.residential) parts.push(addr.residential);
                if (addr.city_district) parts.push(addr.city_district);

                // 4. City & State
                const city = addr.city || addr.town || addr.village || "";
                if (city) parts.push(city);
                if (addr.state) parts.push(addr.state);

                // Deduplicate parts (case-insensitive)
                const uniqueParts = [];
                const seen = new Set();
                parts.forEach(p => {
                    const k = p.toString().toLowerCase();
                    if (p && !seen.has(k)) {
                        uniqueParts.push(p);
                        seen.add(k);
                    }
                });

                // Fallback to display_name if we found nothing specific
                const fullAddr = uniqueParts.length > 1 ? uniqueParts.join(', ') : res.data.display_name;

                const zip = addr.postcode || "";

                setStreetAddress(fullAddr);
                setZipCode(zip);

                updateParent(fullAddr, details, zip, lat, lng);
            }
        } catch (err) {
            console.error("Geocoding failed", err);
        } finally {
            setIsGeocoding(false);
        }
    };

    const updateParent = (addr, det, zip, lat, lng) => {
        const finalAddr = det ? `${det}, ${addr}` : addr;
        onLocationChange({
            address: finalAddr,
            zipCode: zip,
            latitude: lat,
            longitude: lng
        });
    };

    const fetchCoordsFromAddress = async (queryAddress) => {
        setIsGeocoding(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(queryAddress)}`);
            if (res.data && res.data.length > 0) {
                const first = res.data[0];
                const lat = parseFloat(first.lat);
                const lng = parseFloat(first.lon);
                setMapCenter({ lat, lng });
                // Let the map move complete trigger the reverse geocode
            } else {
                alert("Address not found on map.");
            }
        } catch (err) {
            console.error("Forward geocoding failed", err);
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleMapMove = (newCoords) => {
        setMapCenter(newCoords);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            fetchAddress(newCoords.lat, newCoords.lng);
        }, 800);
    };

    const handleDragState = (dragging) => {
        setIsDragging(dragging);
        if (dragging) setIsGPS(false);
    };

    const watchIdRef = useRef(null);

    // Smart "Watch" Mode - Continuously refines location
    const startSmartLocationWatch = () => {
        setLoadingLoc(true);
        fetchIpLocation(); // Start IP race immediately

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        // Clear existing watch if any
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                // Only update if we are getting better accuracy or different location
                // (Simple filter to avoid jitter)

                setIsGPS(true);
                setLoadingLoc(false);
                setMapCenter({ lat: latitude, lng: longitude });
                fetchAddress(latitude, longitude);

                // If accuracy is good (< 20 meters), we can stop watching to save battery
                // But user wants "Real Time", so maybe keep it on? 
                // Let's keep it on but maybe debounce updates if needed.
                console.log(`GPS Update: Accuracy ${accuracy}m`);
            },
            (error) => {
                console.error("GPS Watch Error: ", error);
                setLoadingLoc(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, []);

    const fetchIpLocation = async () => {
        try {
            if (isGPS) return;
            const res = await axios.get('https://ipapi.co/json/');
            if (res.data && res.data.latitude && res.data.longitude) {
                if (!isGPS) {
                    const { latitude, longitude } = res.data;
                    setMapCenter({ lat: latitude, lng: longitude });
                    fetchAddress(latitude, longitude);
                }
            }
        } catch (err) {
            console.error("IP Location failed", err);
        }
    };

    const handleGetCurrentLocation = () => {
        startSmartLocationWatch();
    };

    // Suggestion logic
    const fetchSuggestions = async (query) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
            setSuggestions(res.data || []);
        } catch (err) {
            console.error("Suggestion fetch failed", err);
        }
    };

    const handleLegacyInputChange = (val) => {
        setStreetAddress(val);
        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
        suggestionTimeoutRef.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 300);
    };

    const handleSelectSuggestion = (item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        setMapCenter({ lat, lon });
        setStreetAddress(item.display_name);
        setSuggestions([]);
        fetchAddress(lat, lon);
    };

    const handleAddressSearch = (e) => {
        if (e.key === 'Enter') {
            fetchCoordsFromAddress(streetAddress);
        }
    };

    // Details change handler
    const handleDetailsChange = (e) => {
        const val = e.target.value;
        setDetails(val);
        updateParent(streetAddress, val, zipCode, mapCenter.lat, mapCenter.lng);
    };

    useEffect(() => {
        if (initialCoords.lat === 0 || (initialCoords.lat === 36.1627 && initialCoords.lng === -86.7816)) {
            handleGetCurrentLocation();
        } else {
            fetchAddress(initialCoords.lat, initialCoords.lng);
        }
    }, []);

    return (
        <div className="w-full space-y-4 font-sans">
            {/* Map Container */}
            <div className="relative h-80 w-full rounded-2xl overflow-hidden border border-gray-700 shadow-xl bg-gray-900 group">
                <MapContainer
                    center={[initialCoords.lat || 36.1627, initialCoords.lng || -86.7816]}
                    zoom={18}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="Map View">
                            <TileLayer
                                attribution='&copy; Google Maps'
                                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellite">
                            <TileLayer
                                attribution='&copy; Google Maps'
                                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Dark Cyber">
                            <TileLayer
                                attribution='&copy; CARTO'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>

                    <MapController onMove={handleMapMove} onDragStart={handleDragState} center={mapCenter} />
                </MapContainer>

                {/* Animated Center Pin */}
                <div className={`pin-container ${isDragging ? 'lifting' : ''}`}>
                    <MapPin
                        className="google-pin text-red-600 fill-red-600"
                        size={40}
                        strokeWidth={1.5}
                        color="#ea4335"
                        fill="#ea4335"
                    />
                </div>
                <div className="pin-shadow"></div>

                {/* Live Coordinates Badge */}
                <div className="absolute top-16 right-3 z-[400] bg-black/90 backdrop-blur-md text-green-400 font-mono text-[10px] px-3 py-2 rounded-lg border border-green-500/30 shadow-2xl flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isGPS ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-pulse'}`}></div>
                    <div>
                        <div className="font-bold text-[9px] text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            {isDragging ? 'MANUAL SELECTION' : (isGPS ? 'LIVE TRACKING ACTIVE' : 'SEARCHING SATELLITES...')}
                        </div>
                        <div className="flex gap-3 text-xs">
                            <span className="font-bold text-white">LAT: {mapCenter.lat.toFixed(5)}</span>
                            <span className="font-bold text-white">LNG: {mapCenter.lng.toFixed(5)}</span>
                        </div>
                    </div>
                </div>

                {/* GPS Button */}
                <div className="absolute bottom-6 right-4 z-[400] flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={loadingLoc}
                        className={`p-3 rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center border ${isGPS ? 'bg-green-500 border-green-400 text-black' : 'bg-white text-gray-700 border-gray-200'}`}
                        title="Get Precise Location"
                    >
                        {loadingLoc ? <Loader2 className="w-6 h-6 animate-spin" /> : <Navigation className="w-6 h-6 fill-current" />}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="absolute top-4 left-4 right-48 z-[400]">
                    <div className="bg-white rounded-lg shadow-lg flex flex-col border border-gray-200 relative">
                        <div className="flex items-center p-2">
                            <div className={`w-3 h-3 rounded-full mr-3 ${isGeocoding ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                            <input
                                className="flex-1 bg-transparent outline-none text-gray-800 text-sm font-medium"
                                value={streetAddress}
                                onChange={(e) => handleLegacyInputChange(e.target.value)}
                                onKeyDown={handleAddressSearch}
                                placeholder="Search city, street..."
                            />
                            <button onClick={() => fetchCoordsFromAddress(streetAddress)} className="p-1 text-gray-400 hover:text-blue-500">
                                <Search size={18} />
                            </button>
                        </div>

                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-gray-100">
                                {suggestions.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectSuggestion(item)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 group"
                                    >
                                        <MapPin size={16} className="mt-0.5 text-gray-400 group-hover:text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 line-clamp-1">
                                                {item.display_name.split(',')[0]}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {item.display_name.split(',').slice(1).join(',')}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Manual Inputs with Extra Details Field */}
            <div className="grid grid-cols-1 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Exact Location Details (House No, Landmark)</label>
                    <input
                        type="text"
                        value={details}
                        onChange={handleDetailsChange}
                        placeholder="e.g. House No 12, Near Central Park"
                        className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none text-white placeholder-gray-600"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-2">Street Address</label>
                        <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => {
                                setStreetAddress(e.target.value);
                                updateParent(e.target.value, details, zipCode, mapCenter.lat, mapCenter.lng);
                            }}
                            placeholder="Address"
                            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-2">ZIP Code</label>
                        <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => {
                                setZipCode(e.target.value);
                                updateParent(streetAddress, details, e.target.value, mapCenter.lat, mapCenter.lng);
                            }}
                            placeholder="ZIP"
                            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-xl text-sm focus:border-yellow-500 focus:outline-none text-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
