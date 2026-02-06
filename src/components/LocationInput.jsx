import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { MapPin, Loader, Navigation, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const libraries = ['places'];

// Default center (e.g., Delhi, India) - can be adjusted
const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
};

const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.75rem',
};

const options = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true, // Enable map type control
    mapTypeId: 'hybrid',  // Default to satellite/hybrid view
    fullscreenControl: true,
};

export default function LocationInput({ onLocationChange, initialCoordinates }) {
    // NOTE: You must provide a valid Google Maps API Key here or in .env
    // FALLBACK: Use provided key directly if env var is not loaded yet (avoids restart requirement)
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    console.log("Initializing Maps with Key Length:", apiKey ? apiKey.length : 0);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries,
    });

    if (!apiKey) {
        return (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5" />
                <div>
                    <p className="font-bold">Missing Google Maps API Key</p>
                    <p className="text-sm">
                        Address suggestions require an API Key. Please add
                        <code className="bg-black/30 px-1 rounded ml-1">VITE_GOOGLE_MAPS_API_KEY</code>
                        to your .env file.
                    </p>
                    <input
                        type="text"
                        placeholder="Enter address manually for now..."
                        className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 mt-2 focus:outline-none focus:border-purple-500"
                        value={address}
                        onChange={handleManualAddressChange}
                    />
                </div>
            </div>
        );
    }

    const [map, setMap] = useState(null);
    const [markerPosition, setMarkerPosition] = useState(initialCoordinates || defaultCenter);
    const [address, setAddress] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [autocomplete, setAutocomplete] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [error, setError] = useState(null);

    // Update marker if initialCoordinates change
    useEffect(() => {
        if (initialCoordinates) {
            setMarkerPosition({
                lat: parseFloat(initialCoordinates.latitude),
                lng: parseFloat(initialCoordinates.longitude)
            });
        }
    }, [initialCoordinates]);


    const onLoad = useCallback((map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback((map) => {
        setMap(null);
    }, []);

    const onAutocompleteLoad = (autocompleteInstance) => {
        setAutocomplete(autocompleteInstance);
    };

    const extractAddressComponents = (components) => {
        let zip = '';
        let addr = '';

        // Simple address construction
        // In a real app, you might want more specific formatting
        const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name || '';
        const route = components.find(c => c.types.includes('route'))?.long_name || '';
        const locality = components.find(c => c.types.includes('locality'))?.long_name || '';
        const administrativeAreaLevel1 = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '';
        const country = components.find(c => c.types.includes('country'))?.long_name || '';
        const postalCode = components.find(c => c.types.includes('postal_code'))?.long_name || '';

        addr = `${streetNumber} ${route}, ${locality}, ${administrativeAreaLevel1}, ${country}`.replace(/^ , /, '').trim();
        if (addr.startsWith(',')) addr = addr.substring(1).trim();
        zip = postalCode;

        return { address: addr, zipCode: zip };
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.geometry.location) {
                setError("No details available for input: '" + place.name + "'");
                return;
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const newPos = { lat, lng };

            setMarkerPosition(newPos);
            map.panTo(newPos);
            map.setZoom(17);

            let extracted = { address: place.formatted_address, zipCode: '' };

            if (place.address_components) {
                const { address: addr, zipCode: zip } = extractAddressComponents(place.address_components);
                // Prefer formatted_address but use extracted zip
                extracted.zipCode = zip;
            }

            setAddress(extracted.address);
            setZipCode(extracted.zipCode);
            setError(null);

            onLocationChange({
                address: extracted.address,
                zipCode: extracted.zipCode,
                latitude: lat,
                longitude: lng
            });
        } else {
            console.log('Autocomplete is not loaded yet!');
        }
    };

    const reverseGeocode = async (lat, lng) => {
        setIsGeocoding(true);
        setError(null);
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                const place = response.results[0];
                const { address: addr, zipCode: zip } = extractAddressComponents(place.address_components);

                const formattedAddr = place.formatted_address;

                setAddress(formattedAddr);
                setZipCode(zip);

                onLocationChange({
                    address: formattedAddr,
                    zipCode: zip,
                    latitude: lat,
                    longitude: lng
                });
            } else {
                setError("No address found for this location.");
            }
        } catch (e) {
            console.error("Geocoding error:", e);
            setError("Failed to fetch address details.");
        } finally {
            setIsGeocoding(false);
        }
    };

    const onMarkerDragEnd = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        reverseGeocode(lat, lng);
    };

    const handleManualAddressChange = (e) => {
        setAddress(e.target.value);
        // We don't update parent immediately on typing to avoid jitter, 
        // or we can if we want "controlled" input.
        // But for location mapping, usually we wait for selection.
        // However, to keep it consistent with other fields:
        onLocationChange({
            address: e.target.value,
            zipCode, // keep existing
            latitude: markerPosition.lat,
            longitude: markerPosition.lng
        });
    };

    const handleManualZipChange = (e) => {
        const val = e.target.value;
        setZipCode(val);
        onLocationChange({
            address, // keep existing
            zipCode: val,
            latitude: markerPosition.lat,
            longitude: markerPosition.lng
        });
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setMarkerPosition(pos);
                    map.panTo(pos);
                    map.setZoom(17);
                    reverseGeocode(pos.lat, pos.lng);
                },
                () => {
                    setError("Error: The Geolocation service failed.");
                }
            );
        } else {
            setError("Error: Your browser doesn't support geolocation.");
        }
    };

    if (loadError) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <div>
                    <p className="font-bold">Map Error</p>
                    <p className="text-sm">Failed to load Google Maps. Please check your API Key.</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[300px] bg-gray-900 rounded-xl border border-gray-700">
                <div className="text-center text-gray-400">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Loading Maps...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {/* Address Input with Autocomplete */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        Search Location / Address
                    </label>
                    <div className="relative">
                        <Autocomplete
                            onLoad={onAutocompleteLoad}
                            onPlaceChanged={onPlaceChanged}
                        >
                            <input
                                type="text"
                                placeholder="Start typing specific address..."
                                className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                value={address}
                                onChange={handleManualAddressChange}
                            />
                        </Autocomplete>
                        {isGeocoding && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader className="w-4 h-4 animate-spin text-purple-500" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className="relative rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={15}
                        center={markerPosition}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={options}
                    >
                        <Marker
                            position={markerPosition}
                            draggable={true}
                            onDragEnd={onMarkerDragEnd}
                            animation={window.google.maps.Animation.DROP}
                        />
                    </GoogleMap>

                    {/* GPS Button Overlay */}
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="absolute bottom-4 right-4 bg-gray-900/90 hover:bg-purple-600 text-white p-2 rounded-full shadow-lg border border-gray-700 transition"
                        title="Use Current Location"
                    >
                        <Navigation className="w-5 h-5" />
                    </button>
                </div>

                {/* Coordinates & Zip Display (Auto-filled) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Zip Code (Auto)</label>
                        <input
                            type="text"
                            value={zipCode}
                            onChange={handleManualZipChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 focus:border-purple-500 outline-none"
                            placeholder="Zip Code"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Coordinates</label>
                        <div className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm truncate select-all">
                            {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                        </div>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
