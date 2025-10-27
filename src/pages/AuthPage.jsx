import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function AuthPage() {
  // 'login' or 'signup'
  const [isLogin, setIsLogin] = useState(true);
  // 'student', 'driver', or 'admin'
  const [userType, setUserType] = useState('student');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [routeNumber, setRouteNumber] = useState(''); // Just for student
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to reset the form when switching modes
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setCollegeId('');
    setRouteNumber('');
    setError('');
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      // --- Handle Login ---
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged in App.jsx will handle the redirect
      } catch (err) {
        setError(err.message);
        console.error("Login Error: ", err);
      }
    } else {
      // --- Handle Sign Up ---
      if (userType === 'admin') {
        setError("Admin accounts cannot be created from the sign-up page.");
        setLoading(false);
        return;
      }

      try {
        // 1. Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Create the user's profile document in Firestore
        const userProfile = {
          uid: user.uid,
          email: user.email,
          role: userType,
          name: name,
          collegeId: collegeId,
        };

        if (userType === 'student') {
          userProfile.routeNumber = routeNumber;
        }
        
        // Save to 'users' collection with the user's UID as the document ID
        await setDoc(doc(db, 'users', user.uid), userProfile);
        
        // Login is now complete, onAuthStateChanged in App.jsx will redirect

      } catch (err) {
        if (err.code === 'auth/operation-not-allowed') {
          setError('Email/Password sign-up is not enabled. Please contact admin.');
        } else {
          setError(err.message);
        }
        console.error("Sign Up Error: ", err);
      }
    }
    setLoading(false);
  };

  // This function returns the correct sign-up fields based on userType
  const renderSignUpFields = () => {
    switch (userType) {
      case 'student':
        return (
          <>
            <p>I am a Student</p>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
            <input 
              type="text" 
              placeholder="Student ID" 
              value={collegeId} 
              onChange={(e) => setCollegeId(e.target.value)} 
              required 
            />
            <input 
              type="text" 
              placeholder="Your Bus Route Number (e.g., R10)" 
              value={routeNumber} 
              onChange={(e) => setRouteNumber(e.target.value)} 
              required 
            />
          </>
        );
      case 'driver':
        return (
          <>
            <p>I am a Driver</p>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
            <input 
              type="text" 
              placeholder="Driver ID / Staff ID" 
              value={collegeId} 
              onChange={(e) => setCollegeId(e.target.value)} 
              required 
            />
          </>
        );
      case 'admin':
        return (
          <p className="message">
            Admin sign-up is disabled. Please log in.
          </p>
        );
      default:
        return null;
    }
  };
  
  // This function returns the correct sign-in fields
  const renderSignInFields = () => {
     switch (userType) {
      case 'student':
        return <p>I am a Student</p>;
      case 'driver':
        return <p>I am a Driver</p>;
      case 'admin':
        return <p>I am an Admin</p>;
      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="title">UBus</h1>
        <p className="subtitle">Welcome to the Bus Tracker</p>
        
        <div className="user-type-selector">
          <button 
            className={userType === 'student' ? 'active' : ''} 
            onClick={() => { setUserType('student'); resetForm(); }}
          >
            Student
          </button>
          <button 
            className={userType === 'driver' ? 'active' : ''} 
            onClick={() => { setUserType('driver'); resetForm(); }}
          >
            Driver
          </button>
          <button 
            className={userType === 'admin' ? 'active' : ''} 
            onClick={() => { setUserType('admin'); setIsLogin(true); resetForm(); }}
          >
            Admin
          </button>
        </div>

        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        
        <form onSubmit={handleAuthAction}>
          {isLogin ? renderSignInFields() : renderSignUpFields()}
        
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          {/* Show the extra fields only on the Sign Up page */}
          {!isLogin && (
            <>
              {/* This is a fragment, it just groups elements */}
            </>
          )}
          
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" disabled={loading || (!isLogin && userType === 'admin')}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        
        <button 
          className="toggle-auth" 
          onClick={() => { setIsLogin(!isLogin); resetForm(); }}
          disabled={userType === 'admin'} // Disable toggle for admin
        >
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;