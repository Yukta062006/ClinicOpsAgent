import React, { useState, useEffect } from 'react'
import { 
  Car, 
  Bus, 
  Footprints, 
  MapPin, 
  Clock, 
  Navigation, 
  Building2, 
  ParkingCircle, 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  LocateFixed,
  ShieldCheck,
  Phone,
  Layers,
  ChevronRight
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import ErrorBoundary from '../components/ErrorBoundary'

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
// @ts-ignore
delete L.Icon.Default.prototype._getShadowUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom SVG Icons for Leaflet Markers
const hospitalMarkerIcon = L.divIcon({
  className: 'custom-hospital-marker',
  html: `<div style="background-color:#1B3E2F;color:white;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(27,62,47,0.4);border:3px solid white;font-weight:bold;font-size:16px;">H</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19]
})

const userMarkerIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="background-color:#0284C7;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(2,132,199,0.4);border:2px solid white;font-weight:bold;font-size:12px;">●</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
})

function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

export default function TravelPlanner() {
  const [transportMode, setTransportMode] = useState<'car' | 'transit' | 'walking'>('car')
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets')
  const [originInput, setOriginInput] = useState('Marine Drive, Mumbai 400020')
  const [isLocating, setIsLocating] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [selectedParking, setSelectedParking] = useState<any | null>(null)
  const [selectedTransitLine, setSelectedTransitLine] = useState<any | null>(null)

  // Hospital Location (City General Hospital / Willow OPD Center)
  const hospitalPos: [number, number] = [18.9220, 72.8347]
  const defaultOriginPos: [number, number] = [18.9440, 72.8230]
  const [userPos, setUserPos] = useState<[number, number]>(defaultOriginPos)

  // Polyline coordinates for route display
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([
    [18.9440, 72.8230],
    [18.9390, 72.8250],
    [18.9340, 72.8280],
    [18.9290, 72.8310],
    [18.9250, 72.8330],
    [18.9220, 72.8347]
  ])

  const notify = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const modeDetails = {
    car: {
      time: '12 min',
      distance: '4.8 km',
      badge: 'Fastest Route • Moderate Traffic',
      description: 'Optimal for comfort & emergency arrivals'
    },
    transit: {
      time: '22 min',
      distance: '5.2 km',
      badge: 'Direct Metro Line 3 & AC Bus',
      description: 'Eco-friendly, stops right outside OPD gate'
    },
    walking: {
      time: '48 min',
      distance: '4.2 km',
      badge: 'Promenade Walking Path',
      description: 'Safe pedestrian sidewalks along sea face'
    }
  }

  const parkingFacilities = [
    { name: 'Main Multi-Level Lot', available: 450, total: 600, rate: '₹50/hr', type: 'Covered EV Ready', distance: '1 min walk' },
    { name: 'Visitor Surface Parking', available: 120, total: 200, rate: '₹30/hr', type: 'Open Air', distance: '2 min walk' },
    { name: 'Accessible / Handicap Lot', available: 25, total: 30, rate: 'Free', type: 'Reserved Priority', distance: 'Adjacent to Entrance' },
    { name: 'Emergency Staff Zone', available: 45, total: 100, rate: 'Restricted', type: 'Clinical Staff Only', distance: 'Trauma Bay' }
  ]

  const transitRoutes = [
    { line: 'Bus 101 AC', stop: 'City General Medical Station', interval: 'Every 5 min', eta: '5 min' },
    { line: 'Bus 205 Express', stop: 'South Wing Reception Stop', interval: 'Every 10 min', eta: '12 min' },
    { line: 'Metro Aqua Line (Line 3)', stop: 'Vidhan Bhavan / Hospital District', interval: 'Every 4 min', eta: '8 min' },
    { line: 'Suburban Railway (Western)', stop: 'Churchgate Terminal (Station 2)', interval: 'Every 3 min', eta: '15 min' }
  ]

  const handleUseCurrentLocation = () => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setUserPos([lat, lng])
          setOriginInput('Current GPS Location (Verified)')
          setRouteCoordinates([
            [lat, lng],
            [(lat + hospitalPos[0]) / 2, (lng + hospitalPos[1]) / 2],
            hospitalPos
          ])
          setIsLocating(false)
          notify('Current GPS location detected. Route updated.')
        },
        () => {
          setUserPos(defaultOriginPos)
          setOriginInput('Nariman Point, Mumbai')
          setIsLocating(false)
          notify('GPS unavailable. Using default clinical origin.')
        },
        { timeout: 6000 }
      )
    } else {
      setIsLocating(false)
      notify('Geolocation is not supported by your browser.')
    }
  }

  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault()
    if (!originInput.trim()) {
      setOriginInput('Churchgate, Mumbai')
    }
    notify(`Route recalculated for ${transportMode.toUpperCase()} mode.`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-forest-green text-white px-5 py-3 rounded-xl shadow-lg border border-pale-sage flex items-center gap-3 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Breadcrumb + Header */}
      <div>
        <p className="text-xs font-semibold tracking-wider text-forest-green/70 uppercase mb-1">
          PATIENT ENGAGEMENT / NAVIGATION ASSISTANT
        </p>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-green tracking-tight">
          Travel Planner
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Plan your route to City General Hospital with real-time transit and parking availability.
        </p>
      </div>

      {/* Hospital Overview Card */}
      <div className="bg-white border border-pale-sage rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F1EB] border border-pale-sage flex items-center justify-center text-forest-green shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-bold text-forest-green">
                City General Hospital
              </h2>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Main Campus
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              123 Medical Center Drive, Suite 400 • Mumbai South Center 400020
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-600">
              <span className="inline-flex items-center gap-1 font-medium">
                <Phone className="w-3.5 h-3.5 text-forest-green" />
                <span>Emergency: (022) 2200-4567</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>NABH Accredited</span>
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            const el = document.getElementById('interactive-hospital-map')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-pale-sage/60 hover:bg-pale-sage border border-pale-sage text-forest-green rounded-xl text-xs font-semibold transition-colors self-start md:self-auto"
        >
          <Navigation className="w-4 h-4" />
          <span>Center on Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mode Selection Grid */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wider text-xs">
          Choose Your Mode of Transport
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Car */}
          <div
            onClick={() => setTransportMode('car')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
              transportMode === 'car'
                ? 'bg-forest-green text-white border-forest-green shadow-sm'
                : 'bg-white text-stone-800 border-pale-sage hover:bg-[#FAFBF9]'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              transportMode === 'car' ? 'bg-white/15 text-white' : 'bg-[#E8F1EB] text-forest-green'
            }`}>
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm leading-tight">Drive by Car</p>
              <p className={`text-[11px] mt-0.5 ${transportMode === 'car' ? 'text-emerald-100' : 'text-text-secondary'}`}>
                {modeDetails.car.description}
              </p>
            </div>
          </div>

          {/* Transit */}
          <div
            onClick={() => setTransportMode('transit')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
              transportMode === 'transit'
                ? 'bg-forest-green text-white border-forest-green shadow-sm'
                : 'bg-white text-stone-800 border-pale-sage hover:bg-[#FAFBF9]'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              transportMode === 'transit' ? 'bg-white/15 text-white' : 'bg-[#E8F1EB] text-forest-green'
            }`}>
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm leading-tight">Public Transit</p>
              <p className={`text-[11px] mt-0.5 ${transportMode === 'transit' ? 'text-emerald-100' : 'text-text-secondary'}`}>
                {modeDetails.transit.description}
              </p>
            </div>
          </div>

          {/* Walking */}
          <div
            onClick={() => setTransportMode('walking')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
              transportMode === 'walking'
                ? 'bg-forest-green text-white border-forest-green shadow-sm'
                : 'bg-white text-stone-800 border-pale-sage hover:bg-[#FAFBF9]'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              transportMode === 'walking' ? 'bg-white/15 text-white' : 'bg-[#E8F1EB] text-forest-green'
            }`}>
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm leading-tight">Walking Route</p>
              <p className={`text-[11px] mt-0.5 ${transportMode === 'walking' ? 'text-emerald-100' : 'text-text-secondary'}`}>
                {modeDetails.walking.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Starting Location Bar */}
      <form onSubmit={handleCalculateRoute} className="bg-white border border-pale-sage rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-2xs">
        <div className="flex items-center gap-3 px-3 flex-1 w-full">
          <MapPin className="w-5 h-5 text-forest-green shrink-0" />
          <input
            type="text"
            value={originInput}
            onChange={(e) => setOriginInput(e.target.value)}
            placeholder="Enter starting street address, landmark or pin code..."
            className="w-full text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-pale-sage bg-[#F5F8F6] text-forest-green text-xs font-semibold hover:bg-pale-sage/50 transition-colors"
          >
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
          </button>

          <button
            type="submit"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-forest-green text-white text-xs font-semibold hover:bg-forest-green/90 transition-colors shadow-xs"
          >
            <span>Get Directions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Large Interactive Map Component */}
      <div id="interactive-hospital-map" className="bg-white border border-pale-sage rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-forest-green">
              Live Map to Hospital
            </h3>
            <p className="text-xs text-text-secondary">
              Interactive OpenStreetMap navigation with calculated trajectory
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Map Layer Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-[#F5F8F6] border border-pale-sage text-xs">
              <button
                onClick={() => setMapLayer('streets')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  mapLayer === 'streets' ? 'bg-forest-green text-white shadow-xs' : 'text-stone-600 hover:text-forest-green'
                }`}
              >
                Standard Map
              </button>
              <button
                onClick={() => setMapLayer('satellite')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  mapLayer === 'satellite' ? 'bg-forest-green text-white shadow-xs' : 'text-stone-600 hover:text-forest-green'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>
        </div>

        {/* The Map Window */}
        <div className="h-[440px] w-full rounded-2xl overflow-hidden border border-pale-sage relative shadow-inner">
          <ErrorBoundary fallbackTitle="Hospital Interactive Map">
            <MapContainer
              center={hospitalPos}
              zoom={14}
              scrollWheelZoom={true}
              className="w-full h-full z-0"
            >
              <MapViewController center={hospitalPos} zoom={14} />

              {mapLayer === 'streets' ? (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              ) : (
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              )}

              {/* Destination Marker */}
              <Marker position={hospitalPos} icon={hospitalMarkerIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-forest-green font-serif text-sm block">City General Hospital</strong>
                    <span className="text-stone-600 block">Outpatient Reception & Emergency Gate</span>
                    <span className="text-emerald-700 font-semibold mt-1 inline-block">Open 24/7</span>
                  </div>
                </Popup>
              </Marker>

              {/* User Origin Marker */}
              <Marker position={userPos} icon={userMarkerIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <strong className="text-sky-700 text-sm block">Your Starting Point</strong>
                    <span className="text-stone-600 block">{originInput}</span>
                  </div>
                </Popup>
              </Marker>

              {/* Route Polyline */}
              <Polyline
                positions={routeCoordinates}
                color={transportMode === 'car' ? '#1B3E2F' : transportMode === 'transit' ? '#0284C7' : '#16A34A'}
                weight={5}
                opacity={0.85}
                dashArray={transportMode === 'walking' ? '8, 8' : undefined}
              />
            </MapContainer>
          </ErrorBoundary>

          {/* Floating ETA Overlay Banner */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-pale-sage shadow-md flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-forest-green text-white flex items-center justify-center shrink-0">
                {transportMode === 'car' ? <Car className="w-5 h-5" /> : transportMode === 'transit' ? <Bus className="w-5 h-5" /> : <Footprints className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-lg font-serif font-bold text-forest-green">
                  {modeDetails[transportMode].time}
                </div>
                <div className="text-xs text-text-secondary">
                  Est. Travel Time
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-stone-700">
              <div>
                <span className="text-text-secondary block text-[10px] uppercase font-semibold">Distance</span>
                <span className="font-bold text-stone-900">{modeDetails[transportMode].distance}</span>
              </div>
              <div>
                <span className="text-text-secondary block text-[10px] uppercase font-semibold">Route Status</span>
                <span className="text-emerald-700 font-bold">{modeDetails[transportMode].badge}</span>
              </div>
            </div>

            <button
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${hospitalPos[0]},${hospitalPos[1]}`
                window.open(url, '_blank')
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest-green text-white rounded-xl text-xs font-semibold hover:bg-forest-green/90 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Turn-by-Turn GPS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2 Bottom Columns: Parking Information & Public Transit Lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Parking Information Card */}
        <div className="bg-white border border-pale-sage rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ParkingCircle className="w-5 h-5 text-forest-green" />
              <h3 className="font-serif font-bold text-forest-green text-base">
                Hospital Parking Facilities
              </h3>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Sensor Sync
            </span>
          </div>

          <div className="space-y-3">
            {parkingFacilities.map((lot, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedParking(lot)}
                className="p-3.5 rounded-2xl border border-pale-sage/80 hover:bg-[#FAFBF9] transition-all cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-semibold text-stone-900 text-xs">
                    {lot.name}
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {lot.type} • {lot.distance}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-800 block">
                    {lot.available} open
                  </span>
                  <span className="text-[11px] text-stone-600">
                    {lot.rate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Transportation Schedules */}
        <div className="bg-white border border-pale-sage rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-forest-green" />
              <h3 className="font-serif font-bold text-forest-green text-base">
                Public Transit Lines
              </h3>
            </div>
            <span className="text-xs text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              Every 3–10 Min
            </span>
          </div>

          <div className="space-y-3">
            {transitRoutes.map((route, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedTransitLine(route)}
                className="p-3.5 rounded-2xl border border-pale-sage/80 hover:bg-[#FAFBF9] transition-all cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-semibold text-forest-green text-xs">
                    {route.line}
                  </h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Stop: {route.stop}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-stone-900 block">
                    {route.eta}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {route.interval}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Parking Details Modal */}
      {selectedParking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-pale-sage shadow-2xl">
            <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
              <h3 className="text-lg font-serif font-bold text-forest-green">
                {selectedParking.name}
              </h3>
              <button onClick={() => setSelectedParking(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="flex justify-between py-1 border-b border-pale-sage/40">
                <span className="text-text-secondary">Available Spaces:</span>
                <strong className="text-emerald-700">{selectedParking.available} / {selectedParking.total}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-pale-sage/40">
                <span className="text-text-secondary">Hourly Tariff:</span>
                <strong>{selectedParking.rate}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-pale-sage/40">
                <span className="text-text-secondary">Facility Type:</span>
                <strong>{selectedParking.type}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-pale-sage/40">
                <span className="text-text-secondary">Proximity to OPD:</span>
                <strong>{selectedParking.distance}</strong>
              </div>
              <p className="text-[11px] text-text-secondary pt-2">
                Automated FASTag and UPI payments accepted at the entry barrier.
              </p>
            </div>
            <button
              onClick={() => setSelectedParking(null)}
              className="w-full mt-5 py-2.5 bg-forest-green text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Transit Line Modal */}
      {selectedTransitLine && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-pale-sage shadow-2xl">
            <div className="flex items-center justify-between border-b border-pale-sage pb-3 mb-4">
              <h3 className="text-lg font-serif font-bold text-forest-green">
                {selectedTransitLine.line}
              </h3>
              <button onClick={() => setSelectedTransitLine(null)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="flex justify-between py-1 border-b border-pale-sage/40">
                <span className="text-text-secondary">Destination Stop:</span>
                <strong className="text-forest-green">{selectedTransitLine.stop}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-pale-sage/40">
                <span className="text-text-secondary">Next Arrival:</span>
                <strong className="text-emerald-700">{selectedTransitLine.eta}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-pale-sage/40">
                <span className="text-text-secondary">Frequency:</span>
                <strong>{selectedTransitLine.interval}</strong>
              </div>
              <p className="text-[11px] text-text-secondary pt-2">
                Concession passes for senior citizens and disabled patients available at the transport booth.
              </p>
            </div>
            <button
              onClick={() => setSelectedTransitLine(null)}
              className="w-full mt-5 py-2.5 bg-forest-green text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}