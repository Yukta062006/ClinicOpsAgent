import React, { useState, useEffect, useRef } from 'react'
import { 
  MapIcon, 
  ArrowsRightLeftIcon, 
  TruckIcon, 
  ScaleIcon,
  ArrowPathIcon,
  CalendarIcon,
  InformationCircleIcon,
  MapPinIcon,
  ClockIcon,
  ParkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
// @ts-ignore
delete L.Icon.Default.prototype._getShadowUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Reset map view component
function ResetView({ center, zoom }: { center: L.LatLngExpression; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom])
  return null
}

export default function TravelPlanner() {
  const [travelMode, setTravelMode] = useState<'car' | 'public' | 'walking'>('car')
  const [loading, setLoading] = useState(false)
  const [directions, setDirections] = useState<{ time: string; distance: string; steps: string[] } | null>(null)
  const [origin, setOrigin] = useState('')
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapRef = useRef<MapContainer | null>(null)

  const hospitalLocation = {
    name: 'City General Hospital',
    address: '123 Medical Center Drive, Suite 400',
    city: 'Metropolis',
    state: 'NY',
    zip: '10001',
    phone: '(555) 123-4567',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  }

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setMapError(null)
        },
        (error) => {
          setMapError('Location permission denied. Using default location.')
          console.error('Geolocation error:', error)
        }
      )
    }
  }, [])

  const estimatedTimes = {
    car: { time: '15 min', distance: '8 miles' },
    public: { time: '35 min', distance: '9 miles' },
    walking: { time: '2 hours 10 min', distance: '9.5 miles' }
  }

  const parkingInfo = [
    { spot: 'Main Lot', spaces: '450', fee: '$2/hr' },
    { spot: 'Visitor Parking', spaces: '120', fee: '$3/hr' },
    { spot: 'Handicap Parking', spaces: '25', fee: 'Free' },
    { spot: 'Staff Only', spaces: '200', fee: 'Restricted' }
  ]

  const publicTransport = [
    { line: 'Bus 101', time: '5 min', stop: 'Medical Center Station' },
    { line: 'Bus 205', time: '12 min', stop: 'City Hall Stop' },
    { line: 'Metro Red Line', time: '15 min', stop: 'Hospital District' }
  ]

  const calculateRoute = () => {
    if (!origin.trim()) {
      alert('Please enter your starting location')
      return
    }
    
    setLoading(true)
    
    setTimeout(() => {
      setLoading(false)
      setDirections({
        time: estimatedTimes[travelMode].time,
        distance: estimatedTimes[travelMode].distance,
        steps: [
          `Start from ${origin}`,
          `Take main route towards ${hospitalLocation.city}`,
          `Arrive at ${hospitalLocation.name}`,
          `Your estimated arrival time: ${new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        ]
      })
    }, 1000)
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    calculateRoute()
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-green">Travel Planner</h1>
          <p className="text-text-secondary">Plan your route to City General Hospital</p>
        </div>
      </div>

      {/* Hospital Information */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-8 border border-pale-sage mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold mb-2 text-forest-green">City General Hospital</h2>
            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <MapPinIcon className="w-5 h-5" />
              <span>123 Medical Center Drive, Suite 400</span>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-sm text-text-secondary">
              <CalendarIcon className="w-5 h-5" />
              <span>Metropolis, NY 10001</span>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-sm text-text-secondary">
              <InformationCircleIcon className="w-5 h-5" />
              <span>(555) 123-4567</span>
            </div>
          </div>
          <div className="w-20 h-20 bg-pale-sage/30 rounded-xl flex items-center justify-center text-pale-sage">
            <MapIcon className="w-10 h-10" />
          </div>
        </div>

        {/* Travel Mode Selection */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="bg-light-green rounded-lg p-4 border border-pale-sage"
        >
          <h3 className="font-serif font-bold mb-3 text-forest-green">Choose Your Mode of Transport</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setTravelMode('car')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all ${
                travelMode === 'car'
                  ? 'bg-forest-green text-white shadow-card hover:shadow-card-hover' 
                  : 'bg-warm-cream text-text-secondary hover:bg-pale-sage'
              }`}
            >
              <TruckIcon className="w-5 h-5" />
              <span>Car</span>
            </button>
            <button
              onClick={() => setTravelMode('public')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all ${
                travelMode === 'public'
                  ? 'bg-forest-green text-white shadow-card hover:shadow-card-hover'
                  : 'bg-warm-cream text-text-secondary hover:bg-pale-sage'
              }`}
            >
              <ScaleIcon className="w-5 h-5" />
              <span>Public Transit</span>
            </button>
            <button
              onClick={() => setTravelMode('walking')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all ${
                travelMode === 'walking'
                  ? 'bg-forest-green text-white shadow-card hover:shadow-card-hover'
                  : 'bg-warm-cream text-text-secondary hover:bg-pale-sage'
              }`}
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>Walking</span>
            </button>
          </div>
        </motion.div>

        {/* Route Calculator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <form onSubmit={handleAddressSubmit} className="flex items-center space-x-3">
            <div className="relative flex-1">
              <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-light-green border border-light-green rounded-lg focus:outline-none focus:ring-2 focus:ring-pale-sage transition-all"
                placeholder="Enter your starting location..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-forest-green text-white rounded-lg font-medium hover:bg-green-600 transition-all shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculating...' : 'Get Directions'}
            </button>
          </form>
        </motion.div>

        {/* Estimated Time */}
        {directions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center justify-between p-6 bg-light-green rounded-lg border border-pale-sage"
          >
            <div>
              <div className="text-sm text-text-secondary mb-1">Estimated Travel Time</div>
              <div className="text-4xl font-serif font-bold text-forest-green">
                {directions.time}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-text-secondary mb-1">Distance</div>
              <div className="text-3xl font-serif font-bold text-forest-green">
                {directions.distance}
              </div>
            </div>
          </motion.div>
        )}
        
        {directions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h4 className="font-serif font-bold mb-3 text-forest-green">Route Steps:</h4>
            <div className="space-y-2">
              {directions.steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-warm-cream/50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-forest-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-text-secondary">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Parking Information */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
        >
          <h2 className="text-xl font-serif font-bold mb-4 flex items-center text-forest-green">
            <TruckIcon className="w-6 h-6 mr-2" />
            Parking Information
          </h2>
          <div className="space-y-3">
            {parkingInfo.map((parking, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between p-3 bg-light-green rounded-lg hover:bg-pale-sage/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pale-sage text-white rounded-lg flex items-center justify-center">
                    <TruckIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-forest-green">{parking.spot}</div>
                    <div className="text-xs text-text-secondary">{parking.spaces} spaces available</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-forest-green">{parking.fee}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Public Transportation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
        >
          <h2 className="text-xl font-serif font-bold mb-4 flex items-center text-forest-green">
            <ScaleIcon className="w-6 h-6 mr-2" />
            Public Transportation
          </h2>
          <div className="space-y-3">
            {publicTransport.map((transport, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-between p-3 bg-light-green rounded-lg hover:bg-pale-sage/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-pale-sage text-white rounded-lg flex items-center justify-center">
                    <ScaleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-forest-green">{transport.line}</div>
                    <div className="text-xs text-text-secondary">{transport.stop}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-pale-sage">{transport.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Map Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-white rounded-lg shadow-card hover:shadow-card-hover p-6 border border-pale-sage"
      >
        <h2 className="text-xl font-serif font-bold mb-4 text-forest-green">Map to Hospital</h2>
        
        {/* Map Error Notification */}
        {mapError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center space-x-2"
          >
            <XMarkIcon className="w-5 h-5" />
            <span>{mapError}</span>
          </motion.div>
        )}

        <div className="w-full h-96 rounded-lg overflow-hidden border border-pale-sage">
          <MapContainer
            ref={mapRef as any}
            center={currentLocation || hospitalLocation.coordinates}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <ResetView center={currentLocation || hospitalLocation.coordinates} zoom={13} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Hospital Marker */}
            <Marker position={hospitalLocation.coordinates}>
              <Popup>
                <div className="text-center">
                  <MapPinIcon className="w-8 h-8 text-forest-green mx-auto mb-2" />
                  <h4 className="font-bold text-forest-green">{hospitalLocation.name}</h4>
                  <p className="text-xs text-text-secondary">{hospitalLocation.address}</p>
                  <button 
                    onClick={() => {
                      if (currentLocation) {
                        setOrigin(`${currentLocation.lat}, ${currentLocation.lng}`)
                      } else {
                        alert('Please allow location access to use this feature')
                      }
                    }}
                    className="mt-2 px-3 py-1 bg-forest-green text-white text-sm rounded hover:bg-green-600"
                  >
                    Get Directions from Here
                  </button>
                </div>
              </Popup>
            </Marker>

            {/* User's Current Location Marker */}
            {currentLocation && (
              <Marker position={currentLocation}>
                <Popup>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                    <span className="font-medium text-forest-green">Your Location</span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
          
          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (currentLocation) {
                  mapRef.current?.setView(currentLocation, 13)
                } else {
                  mapRef.current?.setView(hospitalLocation.coordinates, 13)
                }
              }}
              className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 border border-gray-200"
            >
              <MapPinIcon className="w-5 h-5 text-forest-green" />
            </motion.button>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button 
            onClick={() => {
              if (currentLocation) {
                setOrigin(`${currentLocation.lat}, ${currentLocation.lng}`)
                alert(`Location set to: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`)
              } else {
                alert('Please allow location access to use your current location')
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-pale-sage text-white rounded-lg hover:bg-forest-green transition-colors"
          >
            <MapPinIcon className="w-5 h-5" />
            <span>Use Current Location</span>
          </button>
          <button 
            onClick={() => {
              if (hospitalLocation && currentLocation) {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospitalLocation.coordinates.lat},${hospitalLocation.coordinates.lng}`, '_blank')
              } else {
                alert('Please allow location access to get directions')
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-warm-cream text-text-secondary rounded-lg hover:bg-gray-200 transition-colors"
          >
            <MapIcon className="w-5 h-5" />
            <span>Open in Google Maps</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}