import React, { useState, useEffect } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faMapMarkerAlt, faRocket, faCamera, faSyncAlt, faGamepad, faCloudSun, faWifi, faBatteryHalf, faClock, faVideo, faHome } from '@fortawesome/free-solid-svg-icons';
import Map from './Map'; // Import the Map component
import Login from './Login';
import io from 'socket.io-client'; // Import Socket.IO client library

const SOCKET_SERVER_URL = 'http://localhost:5000'; // Replace with your Socket.IO server URL

function App() {
  const [gpsData, setGpsData] = useState({ lat: 0, lon: 0, alt: 0 });
  const [weatherData, setWeatherData] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [joystickConnected, setJoystickConnected] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [droneName, setDroneName] = useState('');
  const [droneId, setDroneId] = useState('');
  const [baseStationId, setBaseStationId] = useState('BS-001'); // Add base station ID state
  const [flightTime, setFlightTime] = useState(0);
  const [imageSrc, setImageSrc] = useState(null); // State for live image
  const [socket, setSocket] = useState(null); // Socket.IO client state

  useEffect(() => {
    const socketClient = io(SOCKET_SERVER_URL);

    socketClient.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });

    socketClient.on('gps-data', (data) => {
      setGpsData(data);
    });

    socketClient.on('weather-data', (data) => {
      setWeatherData(data);
    });

    socketClient.on('live-image', (data) => {
      setImageSrc(data.image); // Set live image source
    });

    socketClient.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, []);

  useEffect(() => {
    const batteryInterval = setInterval(() => {
      setBatteryLevel(prevLevel => (prevLevel > 0 ? prevLevel - 1 : 0));
    }, 60000);

    return () => clearInterval(batteryInterval);
  }, []);

  const handleLogin = (droneName, droneId) => {
    setDroneName(droneName);
    setDroneId(droneId);
    setLoggedIn(true);
  };

  const toggleJoystickConnection = () => {
    setJoystickConnected(prevState => !prevState);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        {/* Base Station ID Box */}
        <div className="base-station-box">
          <p><FontAwesomeIcon icon={faHome} /> Base Station ID: {baseStationId}</p>
        </div>

        {/* Drone Info Box */}
        <div className="drone-info-box">
          <p>Drone ID: {droneId}</p>
          <p>Drone Name: {droneName}</p>
        </div>

        

        <Map latitude={gpsData.lat} longitude={gpsData.lon} />

        <div style={{
          position: 'absolute',
          top: '300px', 
          left: '1px', 
          right: '50px',
          bottom: '-17px',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {imageSrc ? (
            <img src={imageSrc} alt="Live stream" style={{ maxWidth: '100%', maxHeight: '100%' }} />
          ) : (
            <p>No live image available</p>
          )}
        </div>
      </div>

      <div className="gps-box">
        <p><FontAwesomeIcon icon={faMapMarkerAlt} /> Latitude: {gpsData.lat}</p>
        <p><FontAwesomeIcon icon={faMapMarkerAlt} /> Longitude: {gpsData.lon}</p>
        <p><FontAwesomeIcon icon={faMapMarkerAlt} /> Altitude: {gpsData.alt} meters</p>
        {weatherData && (
          <p><FontAwesomeIcon icon={faCloudSun} /> Weather: {weatherData.description}</p>
        )}
      </div>

      <div className="controls">
        <button onClick={toggleJoystickConnection} className="joystick-button">
          <FontAwesomeIcon icon={faGamepad} size="2x" className={joystickConnected ? 'connected' : 'disconnected'} />
          <span>{joystickConnected ? 'Joystick Connected' : 'Joystick Disconnected'}</span>
        </button>
      </div>

      <div className="pitch-yaw-container">
        <div className="pitch-yaw-item">
          <FontAwesomeIcon icon={faCamera} />
          <span>{pitch}° Pitch</span>
          <input
            type="range"
            min="-90"
            max="90"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
          />
        </div>
        <div className="pitch-yaw-item">
          <FontAwesomeIcon icon={faSyncAlt} />
          <span>{yaw}° Yaw</span>
          <input
            type="range"
            min="-180"
            max="180"
            value={yaw}
            onChange={(e) => setYaw(e.target.value)}
          />
        </div>
      </div>

      <footer className="footer">
        <div className="footer-icon">
          <FontAwesomeIcon icon={faHome} size="2x" />
          <span>Home</span>
        </div>
        <div className="footer-icon">
          <FontAwesomeIcon icon={faRocket} size="2x" />
          <span>Launch</span>
        </div>
        <div className="footer-icon">
          <FontAwesomeIcon icon={faBatteryHalf} size="2x" />
          <span>Battery: {batteryLevel}%</span>
        </div>
        <div className="footer-icon">
          <FontAwesomeIcon icon={faClock} size="2x" />
          <span>Flight Time: {flightTime} mins</span>
        </div>
        <div className="footer-icon">
          <FontAwesomeIcon icon={faVideo} size="2x" />
          <span>Live Stream</span>
        </div>
        <div className="footer-icon">
          <FontAwesomeIcon icon={faSync} size="2x" />
          <span>Sync</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
