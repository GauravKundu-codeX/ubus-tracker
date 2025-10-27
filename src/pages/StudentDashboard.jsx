import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import MapComponent from '../components/MapComponent'; // <-- ADDED THIS IMPORT

function StudentDashboard({ user, onLogout }) {
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Stop if the user has no route number assigned
    if (!user.routeNumber) {
      setError("You do not have a bus route assigned to your account.");
      setLoading(false);
      return;
    }

    // This is the query to find the bus for *this* student's route
    const busesRef = collection(db, 'buses');
    const q = query(busesRef, where("routeNumber", "==", user.routeNumber));

    // onSnapshot creates a real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        // No bus was found for this route
        setError("No bus is currently assigned to your route.");
        setBusData(null);
      } else {
        // We found a bus! (Assuming one bus per route)
        const busDoc = querySnapshot.docs[0];
        setBusData(busDoc.data());
        setError(''); // Clear any previous error
      }
      setLoading(false);
    }, (err) => {
      // This catches errors from the listener itself
      console.error("Error listening to bus data: ", err);
      setError("Could not load bus data. Please try again later.");
      setLoading(false);
    });

    // This is the cleanup function.
    // It runs when the component unmounts (e.g., user logs out).
    // This stops the listener so we don't have memory leaks.
    return () => unsubscribe();

  }, [user.routeNumber]); // The dependency array. Re-runs if user.routeNumber changes.

  // A helper function to render the status card
  const renderBusStatus = () => {
    if (loading) {
      return <p>Finding your bus...</p>;
    }

    if (error) {
      return <p className="error-message">{error}</p>;
    }

    if (!busData) {
      // This state is covered by the 'empty' snapshot, but it's a good fallback.
      return <p>No bus data available for your route.</p>;
    }

    // This is the main logic!
    if (busData.isTripActive) {
      return (
        <div className="status-indicator active">
          <h3>Bus is LIVE!</h3>
          {busData.location ? (
            <p>
              Last known location: {busData.location.lat.toFixed(4)}, {busData.location.lng.toFixed(4)}
              <br />
              {busData.location.timestamp && (
                <span>
                  (Last update: {new Date(busData.location.timestamp).toLocaleTimeString()})
                </span>
              )}
            </p>
          ) : (
            <p>Location data not available yet.</p>
          )}
        </div>
      );
    } else {
      return (
        <div className="status-indicator inactive">
          <h3>Bus trip has not started.</h3>
          <p>Please check back later.</p>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </header>
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user.name}!</h2>
          <p>Your Assigned Route: <strong>{user.routeNumber || 'Not Assigned'}</strong></p>
        </div>
        
        <div className="card">
          <h3>Your Bus Status</h3>
          {renderBusStatus()}
        </div>

        {/* --- THIS IS THE UPDATED SECTION --- */}
        <div className="card">
          <h3>Live Map</h3>
          <div className="map-container">
            {busData && busData.isTripActive && busData.location ? (
              <MapComponent location={busData.location} />
            ) : (
              <div className="map-placeholder">
                <p>Bus trip has not started.</p>
                <p>The map will appear here when the bus is live.</p>
              </div>
            )}
          </div>
        </div>
        {/* --- END OF UPDATED SECTION --- */}

      </div>
    </div>
  );
}

export default StudentDashboard; // <-- FIXED TYPO HERE
