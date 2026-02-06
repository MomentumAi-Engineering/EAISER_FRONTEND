
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DashboardLayout from './DashboardLayout';
import apiClient from '../services/apiClient';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customMarkerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function WarRoom() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIssues();

        // Real-time polling (Reduced to 60s for performance)
        const interval = setInterval(fetchIssues, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchIssues = async () => {
        try {
            const data = await apiClient.getPendingReviews();
            console.log("WarRoom Data:", data);
            setIssues(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load map data", err);
            setLoading(false);
        }
    };

    // Default center (San Francisco or first issue)
    const defaultCenter = [37.7749, -122.4194];
    const center = issues.length > 0 && issues[0].latitude
        ? [issues[0].latitude, issues[0].longitude]
        : defaultCenter;

    return (
        <DashboardLayout currentPage="warroom">
            <div className="h-[calc(100vh-100px)] w-full relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                {loading && (
                    <div className="absolute inset-0 z-[1000] bg-black/80 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white tracking-widest uppercase">Initializing Command Center...</h2>
                        </div>
                    </div>
                )}

                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="z-10"
                >
                    {/* Futuristic Dark Map Tiles */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {issues.map((issue) => {
                        const lat = issue.latitude || (issue.report?.report?.latitude);
                        const lng = issue.longitude || (issue.report?.report?.longitude);

                        if (!lat || !lng) return null;

                        return (
                            <Marker
                                key={issue._id || issue.issue_id}
                                position={[lat, lng]}
                                icon={customMarkerIcon}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-2 min-w-[200px]">
                                        <h3 className="font-bold text-gray-900 capitalize mb-1">{issue.issue_type?.replace(/_/g, ' ') || 'Issue'}</h3>
                                        <p className="text-xs text-gray-600 mb-2">{new Date(issue.timestamp || issue.flagged_at).toLocaleString()}</p>

                                        <div className="text-xs font-mono bg-gray-100 p-1 rounded mb-2">
                                            Confidence: {(issue.confidence_score || 0).toFixed(1)}%
                                        </div>

                                        <span className={`text-xs px-2 py-1 rounded text-white font-bold
                       ${issue.severity === 'high' ? 'bg-red-500' : 'bg-orange-400'}`}>
                                            {issue.severity || 'Medium'} Severity
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Overlay Stats */}
                <div className="absolute top-4 right-4 z-[900] bg-gray-900/90 backdrop-blur border border-gray-700 p-4 rounded-xl shadow-xl w-64">
                    <h3 className="text-red-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Live Incident Feed
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Active Incidents</span>
                            <span className="text-white font-mono font-bold">{issues.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">High Severity</span>
                            <span className="text-red-400 font-mono font-bold">
                                {issues.filter(i => i.severity === 'high' || i.confidence_score > 80).length}
                            </span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-red-600 w-[60%] animate-pulse"></div>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
