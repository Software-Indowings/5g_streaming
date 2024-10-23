import React, { useState } from 'react';
import './Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey } from '@fortawesome/free-solid-svg-icons';

function Login({ onLogin }) {
  const [droneName, setDroneName] = useState('');
  const [droneId, setDroneId] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (droneName && droneId) {
      try {
        // Sending POST request to backend for login
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ droneName, droneId }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Login successful:', data);
          onLogin(droneName, droneId);
        } else {
          console.error('Login failed:', response.statusText);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <div className="login-page">
      <video autoPlay loop muted className="background-video">
        <source src="/backgroundd.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="login-container">
        <div className="login-card">
          <img
            src="https://www.indowings.com/images/logo-mobile.svg"
            alt="Logo"
            className="login-logo" // Add a class for styling if needed
          />
          <h2>Drone Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faUser} /> Drone Name:
              </label>
              <input
                type="text"
                value={droneName}
                onChange={(e) => setDroneName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faKey} /> Drone ID:
              </label>
              <input
                type="text"
                value={droneId}
                onChange={(e) => setDroneId(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
