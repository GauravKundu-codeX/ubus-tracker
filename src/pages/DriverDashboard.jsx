import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import MapComponent from '../components/MapComponent';

// Setting this to 'false' to force the app to use
// your browser's (inaccurate) location.
const IS_DESKTOP_TESTING = false;

function DriverDashboard({ user, onLogout }) {
  const [assignedBus, setAssignedBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myLocation, setMyLocation] = useState(null);
  
  // This is new: a state to show you what the browser is reporting
  const [debugLocation, setDebugLocation] = useState(''); 
  
  const locationIntervalRef = useRef(null);

  // Find the bus assigned to this driver
  useEffect(() => {
    // Query for a bus where the driverId matches this user's UID
    const busesRef = collection(db, 'buses');
    const q = query(busesRef, where("driverId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        setError("You are not assigned to any bus.");
        setAssignedBus(null);
      } else {
        // Assuming one driver per bus
        const busDoc = querySnapshot.docs[0];
        setAssignedBus({ id: busDoc.id, ...busDoc.data() });
        // Set the initial location from the bus data if it exists
        if (busDoc.data().location) {
          setMyLocation(busDoc.data().location);
        }
        setError('');
      }
      setLoading(false);
    }, (err) => {
      console.error("Error finding assigned bus: ", err);
      setError("Could not load your assignment.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Function to send the driver's location to Firestore
  const updateBusLocation = async () => {
    if (!assignedBus) return;

    const busDocRef = doc(db, 'buses', assignedBus.id);

    if (IS_DESKTOP_TESTING) {
      // --- FAKE SIMULATOR LOGIC (for Desktop) ---
      
      const currentLat = myLocation ? myLocation.lat : 30.6837;
      const currentLng = myLocation ? myLocation.lng : 76.7308;
      const newLat = currentLat + (Math.random() - 0.5) * 0.001; 
      const newLng = currentLng + (Math.random() - 0.5) * 0.001;
      const locationData = { lat: newLat, lng: newLng, timestamp: Date.now() };

      setMyLocation(locationData);
      setDebugLocation(`Simulated location: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);

      try {
        await updateDoc(busDocRef, { location: locationData, isTripActive: true });
        console.log("Simulated location updated:", locationData);
      } catch (err) {
        console.error("Error updating simulated location: ", err);
        setError("Failed to send location.");
      }

    } else {
      // --- REAL BROWSER LOGIC (for Phone) ---
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setDebugLocation(`Browser reported: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

          const locationData = {
            lat: latitude,
            lng: longitude,
            timestamp: Date.now()
          };
          
          setMyLocation(locationData); 

          try {
            await updateDoc(busDocRef, {
              location: locationData,
              isTripActive: true
            });
            console.log("Location updated:", locationData);
          } catch (err) {
            console.error("Error updating location: ", err);
            setError("Failed to send location. Is connection lost?");
          }
        },
        (err) => {
          console.warn(`Geolocation error: ${err.message}`);
          setDebugLocation(`Error: ${err.message}`);
          setError("Could not get location. Please enable location services.");
        },
        // --- THIS IS THE UPDATED PART ---
        { 
          enableHighAccuracy: true,
          timeout: 10000,     // Give it 10 seconds to find the location
          maximumAge: 0        // Force a fresh location
        } 
      );
    }
  };

  // This function is called when the "Start/Stop Trip" button is clicked
  const toggleTrip = async () => {
    if (!assignedBus) {
      setError("Cannot start trip: no bus assigned.");
      return;
    }

    setLoading(true);
    const busDocRef = doc(db, 'buses', assignedBus.id);

    try {
      if (assignedBus.isTripActive) {
        // --- STOPPING THE TRIP ---
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
          locationIntervalRef.current = null;
        }
        await updateDoc(busDocRef, { isTripActive: false });
        setDebugLocation('Trip stopped.');
        
      } else {
        // --- STARTING THE TRIP ---
        const intervalTime = IS_DESKTOP_TESTING ? 5000 : 10000; 

        setDebugLocation('Starting trip...');
        await updateBusLocation(); 
        locationIntervalRef.current = setInterval(updateBusLocation, intervalTime);
      }
    } catch (err) {
      console.error("Error starting/stopping trip: ", err);
      setError("Failed to update trip status.");
    }
    setLoading(false);
  };
  
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []); 

  const renderAssignment = () => {
    if (loading) {
      return <p>Checking your assignment...</p>;
    }

    if (error) {
      return <p className="error-message">{error}</p>;
    }

    if (!assignedBus) {
      return <p>No bus found for your account.</p>;
    }

    return (
      <>
        <p>Bus Number: <strong>{assignedBus.busNumber || 'Not Set'}</strong></p>
        <p>Route Number: <strong>{assignedBus.routeNumber}</strong></p>
        <div className={`status-indicator ${assignedBus.isTripActive ? 'active' : 'inactive'}`}>
          <h3>{assignedBus.isTripActive ? 'TRIP IS LIVE' : 'TRIP INACTIVE'}</h3>
        </div>
        <button
          className={`trip-button ${assignedBus.isTripActive ? 'stop' : 'start'}`}
          onClick={toggleTrip}
          disabled={loading}
        >
          {loading ? 'Processing...' : (assignedBus.isTripActive ? 'Stop Trip' : 'Start Trip')}
        </button>
        
        {debugLocation && (
          <p style={{ marginTop: '15px', color: '#007bff', fontWeight: '600' }}>
            {debugLocation}
          </p>
        )}
      </>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Driver Dashboard</h1>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </header>
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user.name}!</h2>
          <p>Your Driver ID: <strong>{user.collegeId}</strong></p>
        </div>
        
        <div className="card">
          <h3>My Assignment</h3>
          {renderAssignment()}
        </div>

        <div className="card">
          <h3>My Location</h3>
          <div className="map-container">
            {myLocation && assignedBus.isTripActive ? (
              <MapComponent location={myLocation} />
            ) : (
              <div className="map-placeholder">
                <p>Start your trip to see your live location.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;

