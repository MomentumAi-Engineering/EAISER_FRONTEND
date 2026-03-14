
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DashboardLayout from './DashboardLayout';
import apiClient from '../services/apiClient';
import { Loader2, Search, Filter, MapPin, Flame, AlertTriangle, Clock, Eye, X, RefreshCw } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusColors = {
    pending: '#f59e0b',
    needs_review: '#f59e0b',
    pending_review: '#f59e0b',
    approved: '#10b981',
    submitted: '#10b981',
    resolved: '#06b6d4',
    rejected: '#ef4444',
    declined: '#ef4444',
    default: '#8b5cf6'
};

const getMarkerIcon = (type, status) => {
    const color = status === 'needs_review' || status === 'pending' ? 'red' :
        status === 'approved' || status === 'submitted' ? 'green' : 'orange';
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

// Map controller for programmatic flyTo
function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 14, { duration: 1.5 });
        }
    }, [center, zoom]);
    return null;
}

export default function WarRoom() {
    const [issues, setIssues] = useState([]);
    const [hotspots, setHotspots] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);
    const [mapZoom, setMapZoom] = useState(13);
    const [showFilters, setShowFilters] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const searchTimeout = useRef(null);

    useEffect(() => {
        fetchWarRoomData();
        const interval = setInterval(fetchWarRoomData, 45000); // 45s polling
        return () => clearInterval(interval);
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchWarRoomData();
        }, 500);
        return () => clearTimeout(searchTimeout.current);
    }, [searchQuery, typeFilter, severityFilter]);

    const fetchWarRoomData = async () => {
        try {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (typeFilter !== 'all') params.issue_type = typeFilter;
            if (severityFilter !== 'all') params.severity = severityFilter;

            const data = await apiClient.getWarRoomData(params);
            setIssues(data.issues || []);
            setHotspots(data.hotspots || []);
            setStats(data.stats || {});
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            console.error("War Room fetch failed", err);
            // Fallback to pending reviews
            try {
                const fallback = await apiClient.getPendingReviews();
                setIssues(fallback || []);
                setLoading(false);
            } catch { setLoading(false); }
        }
    };

    // Default center — auto-detect from first issue
    const defaultCenter = [20.5937, 78.9629]; // India center
    const center = mapCenter || (issues.length > 0 && issues[0].latitude
        ? [issues[0].latitude, issues[0].longitude]
        : defaultCenter);

    // Get unique issue types for filter dropdown
    const issueTypes = [...new Set(issues.map(i => i.issue_type).filter(Boolean))];

    const flyToIssue = (issue) => {
        const lat = issue.latitude || issue.report?.report?.latitude;
        const lng = issue.longitude || issue.report?.report?.longitude;
        if (lat && lng) {
            setMapCenter([lat, lng]);
            setMapZoom(16);
            setSelectedIssue(issue);
        }
    };

    const flyToHotspot = (hotspot) => {
        if (hotspot.lat && hotspot.lng) {
            setMapCenter([hotspot.lat, hotspot.lng]);
            setMapZoom(15);
        }
    };

    return (
        <DashboardLayout currentPage="warroom">
            <div className="h-[calc(100vh-100px)] w-full relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex">
                {loading && (
                    <div className="absolute inset-0 z-[1000] bg-black/80 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white tracking-widest uppercase">Initializing Command Center...</h2>
                        </div>
                    </div>
                )}

                {/* Map Area */}
                <div className="flex-1 relative">
                    {/* Search Bar - Top Center */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[900] flex items-center gap-2">
                        <div className="bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl shadow-xl flex items-center px-3 py-2 min-w-[320px]">
                            <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search location, issue type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="ml-2 text-gray-400 hover:text-white">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl px-3 py-2.5 shadow-xl transition-colors ${showFilters ? 'text-red-400 border-red-500/50' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                        <button
                            onClick={fetchWarRoomData}
                            className="bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl px-3 py-2.5 shadow-xl text-gray-400 hover:text-green-400 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[900] bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl shadow-xl p-4 flex gap-4">
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold">Issue Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="mt-1 block w-full bg-gray-800 border border-gray-600 text-white text-xs rounded-lg px-3 py-2 outline-none"
                                >
                                    <option value="all">All Types</option>
                                    {issueTypes.map(t => (
                                        <option key={t} value={t}>{(t || '').replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold">Severity</label>
                                <select
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                    className="mt-1 block w-full bg-gray-800 border border-gray-600 text-white text-xs rounded-lg px-3 py-2 outline-none"
                                >
                                    <option value="all">All Priority</option>
                                    <option value="critical">High Priority</option>
                                    <option value="high">Medium High Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="low">Low Priority</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <MapContainer
                        center={center}
                        zoom={mapZoom}
                        style={{ height: '100%', width: '100%' }}
                        className="z-10"
                    >
                        <MapController center={mapCenter} zoom={mapZoom} />

                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />

                        {/* Hotspot circles */}
                        {hotspots.map((hotspot, idx) => (
                            hotspot.lat && hotspot.lng ? (
                                <CircleMarker
                                    key={`hotspot-${idx}`}
                                    center={[hotspot.lat, hotspot.lng]}
                                    radius={Math.min(hotspot.count * 8, 40)}
                                    pathOptions={{
                                        fillColor: '#ef4444',
                                        fillOpacity: 0.2,
                                        color: '#ef4444',
                                        weight: 2,
                                        opacity: 0.6
                                    }}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <h4 className="font-bold text-red-600">🔥 HOTSPOT</h4>
                                            <p className="text-xs text-gray-600 mt-1">{hotspot.address || 'Area'}</p>
                                            <p className="font-bold text-gray-900">{hotspot.count} reports here</p>
                                            <p className="text-xs text-gray-500">Primary: {(hotspot.top_type || 'Mixed').replace(/_/g, ' ')}</p>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ) : null
                        ))}

                        {/* Issue markers */}
                        {issues.map((issue) => {
                            const lat = issue.latitude || issue.report?.report?.latitude;
                            const lng = issue.longitude || issue.report?.report?.longitude;
                            if (!lat || !lng) return null;

                            return (
                                <Marker
                                    key={issue._id || issue.issue_id}
                                    position={[lat, lng]}
                                    icon={getMarkerIcon(issue.issue_type, issue.status)}
                                >
                                    <Popup className="custom-popup">
                                        <div className="p-2 min-w-[220px]">
                                            <h3 className="font-bold text-gray-900 capitalize mb-1">
                                                {issue.issue_type?.replace(/_/g, ' ') || 'Issue'}
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-1">
                                                📍 {issue.address || 'Unknown Location'}
                                            </p>
                                            <p className="text-xs text-gray-600 mb-2">
                                                {new Date(issue.timestamp || issue.flagged_at).toLocaleString('en-US')}
                                            </p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                                                    Confidence: {(issue.confidence_score || 0).toFixed?.(1) || '0'}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded text-white font-bold capitalize
                                                    ${issue.status === 'needs_review' ? 'bg-amber-500' : issue.status === 'approved' ? 'bg-green-500' : 'bg-purple-500'}`}>
                                                    {(issue.status || 'pending').replace(/_/g, ' ')}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded text-white font-bold
                                                    ${(() => {
                                                        const sev = (issue.severity || '').toLowerCase();
                                                        if (sev === 'critical') return 'bg-red-500';
                                                        if (sev === 'high') return 'bg-orange-500';
                                                        if (sev === 'medium') return 'bg-yellow-500';
                                                        if (sev === 'low') return 'bg-blue-500';
                                                        return 'bg-yellow-500';
                                                    })()}`}>
                                                    {(() => {
                                                        const sev = (issue.severity || '').toLowerCase();
                                                        if (sev === 'critical') return 'HIGH PRIORITY';
                                                        if (sev === 'high') return 'MEDIUM HIGH PRIORITY';
                                                        if (sev === 'medium') return 'MEDIUM PRIORITY';
                                                        if (sev === 'low') return 'LOW PRIORITY';
                                                        return issue.severity || 'MEDIUM PRIORITY';
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* Right Sidebar - Live Feed + Hotspots */}
                <div className="w-80 bg-gray-900/95 backdrop-blur border-l border-gray-800 flex flex-col z-[900] overflow-hidden">
                    {/* Stats Header */}
                    <div className="p-4 border-b border-gray-800">
                        <h3 className="text-red-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Live Command Center
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                                <div className="text-lg font-bold text-white font-mono">{stats.total_on_map || issues.length}</div>
                                <div className="text-[10px] uppercase text-gray-500">On Map</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                                <div className="text-lg font-bold text-red-400 font-mono">{stats.high_severity || 0}</div>
                                <div className="text-[10px] uppercase text-gray-500">High Sev.</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                                <div className="text-lg font-bold text-amber-400 font-mono">{stats.pending || 0}</div>
                                <div className="text-[10px] uppercase text-gray-500">Pending</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                                <div className="text-lg font-bold text-green-400 font-mono">{stats.resolved || 0}</div>
                                <div className="text-[10px] uppercase text-gray-500">Resolved</div>
                            </div>
                        </div>
                    </div>

                    {/* Hotspots Section */}
                    {hotspots.length > 0 && (
                        <div className="p-4 border-b border-gray-800">
                            <h4 className="text-orange-400 font-bold uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                                <Flame className="w-3 h-3" /> Problem Hotspots
                            </h4>
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                {hotspots.slice(0, 5).map((h, i) => (
                                    <button
                                        key={i}
                                        onClick={() => flyToHotspot(h)}
                                        className="w-full text-left bg-gray-800/50 hover:bg-gray-800 rounded-lg px-3 py-1.5 flex items-center justify-between transition-colors group"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0
                                                ${i === 0 ? 'bg-red-500/30 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                                                {i + 1}
                                            </div>
                                            <span className="text-xs text-gray-300 truncate">{h.address || h._id}</span>
                                        </div>
                                        <span className="text-xs font-bold text-red-400 flex-shrink-0 ml-2">{h.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Live Issue Feed */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <h4 className="text-blue-400 font-bold uppercase tracking-wider text-[10px] mb-3 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Recent Issues
                        </h4>
                        <div className="space-y-2">
                            {issues.slice(0, 20).map((issue, i) => {
                                const statusColor = statusColors[issue.status] || statusColors.default;
                                return (
                                    <button
                                        key={issue._id || issue.issue_id || i}
                                        onClick={() => flyToIssue(issue)}
                                        className={`w-full text-left bg-gray-800/50 hover:bg-gray-800 rounded-lg p-3 transition-all group border border-transparent hover:border-gray-700
                                            ${selectedIssue?.issue_id === issue.issue_id ? 'border-red-500/50 bg-gray-800' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }}></div>
                                                    <span className="text-xs font-bold text-white capitalize truncate">
                                                        {(issue.issue_type || 'unknown').replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                                                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                                    {issue.address || 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end flex-shrink-0">
                                                <span className="text-[9px] text-gray-600 flex items-center gap-0.5">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {issue.timestamp ? new Date(issue.timestamp).toLocaleDateString('en-US') : '—'}
                                                </span>
                                                <Eye className="w-3 h-3 text-gray-600 group-hover:text-blue-400 mt-1 transition-colors" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            {issues.length === 0 && !loading && (
                                <div className="text-center py-8 text-gray-500">
                                    <MapPin className="w-6 h-6 mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">No issues match your filters</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-800 text-center">
                        <p className="text-[10px] text-gray-600">
                            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString('en-US') : '—'}
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
