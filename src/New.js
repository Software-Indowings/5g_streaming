import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faMapMarkerAlt, faRocket, faCamera, faSyncAlt, faGamepad, faCloudSun, faWifi } from '@fortawesome/free-solid-svg-icons';
import Map from './Map'; // Import the Map component
import Login from './Login';
import mqtt from 'mqtt'; // Import MQTT library

const MQTT_BROKER_URL = 'mqtt://3.110.177.25:1883'; // Replace with your broker URL
const TOPIC_GPS = 'drone/gps';
const TOPIC_WEATHER = 'drone/weather';
const TOPIC_IMAGE = 'test'; // Topic for live image data

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
  const [flightTime, setFlightTime] = useState(0);
  const [flightTimeInterval, setFlightTimeInterval] = useState(null);
  const [imageSrc, setImageSrc] = useState(null); // State for live image
  const [client, setClient] = useState(null); // MQTT client state

  useEffect(() => {
    // Initialize MQTT connection
    const mqttClient = mqtt.connect(MQTT_BROKER_URL);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT Broker');
      // Subscribe to topics
      mqttClient.subscribe(TOPIC_GPS);
      mqttClient.subscribe(TOPIC_WEATHER);
      mqttClient.subscribe(TOPIC_IMAGE);
    });

    mqttClient.on('message', (topic, message) => {
      const data = JSON.parse(message.toString());
      if (topic === TOPIC_GPS) {
        setGpsData(data);
      } else if (topic === TOPIC_WEATHER) {
        setWeatherData(data);
      } else if (topic === TOPIC_IMAGE) {
        setImageSrc(data.image); // Set live image source
      }
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT Connection error: ', err);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  useEffect(() => {
    // Simulate battery level update
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
      <Map latitude={gpsData.lat} longitude={gpsData.lon} />
      <div className="image-container">
        {imageSrc ? (
          <img src={imageSrc} alt="Live stream" className="live-image" />
        ) : (
          <p>No live image available</p>
        )}
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

      <div className="icon-container">
        {/* <div className="icon"><FontAwesomeIcon icon={faVideo} size="2x" /></div> */}
        <div className="icon"><FontAwesomeIcon icon={faCloudSun} size="2x" /></div>
        <div className="icon"><FontAwesomeIcon icon={faWifi} size="2x" /></div>
      </div>
    </div>
  );
}

export default App;
