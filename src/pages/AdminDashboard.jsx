import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';

function AdminDashboard({ user, onLogout }) {
  // State for our 3 collections
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // State for the "add new" forms
  const [newRoute, setNewRoute] = useState('');
  const [newBus, setNewBus] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success messages

  // Effect to fetch all data
  useEffect(() => {
    setLoading(true);
    // We will have 3 listeners
    const unsubscribes = [];

    // 1. Get all Routes
    const routesRef = collection(db, 'routes');
    unsubscribes.push(
      onSnapshot(routesRef, (snapshot) => {
        setRoutes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => setError("Failed to fetch routes"))
    );

    // 2. Get all Buses
    const busesRef = collection(db, 'buses');
    unsubscribes.push(
      onSnapshot(busesRef, (snapshot) => {
        setBuses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => setError("Failed to fetch buses"))
    );

    // 3. Get all Drivers (users with role 'driver')
    // This query NEEDS an index in Firestore!
    const driversQuery = query(collection(db, 'users'), where("role", "==", "driver"));
    unsubscribes.push(
      onSnapshot(driversQuery, (snapshot) => {
        setDrivers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error(err);
        if (err.code === 'failed-precondition') {
          setError("Error: This query requires a Firestore index. Please create one.");
        } else {
          setError("Failed to fetch drivers");
        }
      })
    );

    setLoading(false);

    // Cleanup function to stop all listeners on logout
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  // Helper function to show a temporary message
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000); // Clear after 3 seconds
  };

  // --- Form Handlers ---

  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!newRoute) return;
    try {
      // We will create a new collection 'routes'
      await addDoc(collection(db, 'routes'), {
        routeNumber: newRoute
      });
      showMessage(`Route ${newRoute} added!`);
      setNewRoute('');
    } catch (err) {
      setError("Failed to add route.");
    }
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    if (!newBus) return;
    try {
      await addDoc(collection(db, 'buses'), {
        busNumber: newBus,
        routeNumber: null, // Not assigned yet
        driverId: null,    // Not assigned yet
        isTripActive: false,
        location: null
      });
      showMessage(`Bus ${newBus} added!`);
      setNewBus('');
    } catch (err) {
      setError("Failed to add bus.");
    }
  };

  const handleDelete = async (collectionName, id) => {
    // A simple confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      showMessage("Item deleted.");
    } catch (err) {
      setError("Failed to delete item.");
    }
  };

  // This handles the <select> dropdowns in the assignment table
  const handleAssignment = async (busId, field, value) => {
    const busDocRef = doc(db, 'buses', busId);
    const newValue = value || null; // Convert empty string "" to null

    try {
      // CRITICAL: If assigning a driver, un-assign them from other buses first
      if (field === 'driverId' && newValue) {
        // Use a batch write to do multiple operations at once
        const batch = writeBatch(db);
        
        // 1. Find all buses this driver is *already* assigned to
        const q = query(collection(db, 'buses'), where('driverId', '==', newValue));
        const snapshot = await getDocs(q); // This query ALSO needs an index
        
        snapshot.forEach(doc => {
          // 2. Un-assign them from their old bus(es)
          batch.update(doc.ref, { driverId: null });
        });
        
        // 3. Assign them to the new bus
        batch.update(busDocRef, { driverId: newValue });
        
        // 4. Commit all changes
        await batch.commit();
      } else {
        // If just assigning a route, or setting driver to "Unassigned" (null)
        await updateDoc(busDocRef, {
          [field]: newValue 
        });
      }
      
      showMessage("Assignment updated!");
    } catch (err) {
      console.error(err);
      setError("Failed to update. You may need to create a Firestore Index.");
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </header>

      <div className="dashboard-content admin-dashboard">
        <div className="welcome-card">
          <h2>Admin Control Panel</h2>
          <p>Welcome, {user.name}. Manage all buses, routes, and drivers here.</p>
        </div>

        {loading && <p>Loading admin data...</p>}
        {error && <p className="error-message">{error}</p>}
        {message && <p className="message">{message}</p>}

        <div className="admin-grid">
          {/* --- ASSIGNMENT CARD (Spans 2 columns) --- */}
          <div className="card admin-card full-width">
            <h3>Bus Assignments</h3>
            <p>Assign routes and drivers to available buses.</p>
            <table className="assignment-table">
              <thead>
                <tr>
                  <th>Bus</th>
                  <th>Assigned Route</th>
                  <th>Assigned Driver</th>
                </tr>
              </thead>
              <tbody>
                {buses.length === 0 && (
                  <tr><td colSpan="3">No buses found. Add one below.</td></tr>
                )}
                {buses.map(bus => (
                  <tr key={bus.id}>
                    <td><strong>{bus.busNumber}</strong></td>
                    {/* Route Dropdown */}
                    <td>
                      <select
                        value={bus.routeNumber || ''}
                        onChange={(e) => handleAssignment(bus.id, 'routeNumber', e.target.value)}
                      >
                        <option value="">-- Unassigned --</option>
                        {routes.map(route => (
                          <option key={route.id} value={route.routeNumber}>
                            {route.routeNumber}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Driver Dropdown */}
                    <td>
                      <select
                        value={bus.driverId || ''}
                        onChange={(e) => handleAssignment(bus.id, 'driverId', e.target.value)}
                      >
                        <option value="">-- Unassigned --</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.uid}>
                            {driver.name} ({driver.collegeId})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- MANAGE ROUTES CARD --- */}
          <div className="card admin-card">
            <h3>Manage Routes</h3>
            <form onSubmit={handleAddRoute}>
              <input
                type="text"
                placeholder="New Route (e.g., R50)"
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
              />
              <button type="submit">Add Route</button>
            </form>
            <ul className="item-list">
              {routes.map(route => (
                <li key={route.id}>
                  <span>{route.routeNumber}</span>
                  <button onClick={() => handleDelete('routes', route.id)} className="delete-button">X</button>
                </li>
              ))}
            </ul>
          </div>

          {/* --- MANAGE BUSES CARD --- */}
          <div className="card admin-card">
            <h3>Manage Buses</h3>
            <form onSubmit={handleAddBus}>
              <input
                type="text"
                placeholder="New Bus (e.g., PB 01 9999)"
                value={newBus}
                onChange={(e) => setNewBus(e.target.value)}
              />
              <button type="submit">Add Bus</button>
            </form>
            <ul className="item-list">
              {buses.map(bus => (
                <li key={bus.id}>
                  <span>{bus.busNumber}</span>
                  <button onClick={() => handleDelete('buses', bus.id)} className="delete-button">X</button>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;