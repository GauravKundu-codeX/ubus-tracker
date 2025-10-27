import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Import our pages
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener runs when the user logs in or out
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is logged in, now get their role from Firestore
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Set the user state with all their info
          setUser({ uid: currentUser.uid, ...docSnap.data() });
        } else {
          // This shouldn't happen if sign-up is correct
          console.error("No user data found in Firestore!");
          setUser(null);
        }
      } else {
        // User is logged out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Logout Error:", error));
  };

  // Show a loading message while Firebase checks auth
  if (loading) {
    return (
      <div className="loading-container">
        <h1>Loading UBus...</h1>
      </div>
    );
  }

  // This is our simple "router"
  const renderDashboard = () => {
    if (!user) {
      // If no user, show the AuthPage
      return <AuthPage />;
    }

    // Check the user's role and show the correct dashboard
    switch (user.role) {
      case 'student':
        return <StudentDashboard user={user} onLogout={handleLogout} />;
      case 'driver':
        return <DriverDashboard user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      default:
        // If role is unknown, log them out and show auth page
        handleLogout();
        return <AuthPage />;
    }
  };

  return (
    <div className="app-container">
      {renderDashboard()}
    </div>
  );
}

export default App;