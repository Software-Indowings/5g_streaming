import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faMapMarkerAlt, faRocket, faCamera, faSyncAlt, faGamepad, faCloudSun, faVideo, faWifi } from '@fortawesome/free-solid-svg-icons';
import Map from './Map'; // Import the Map component
import Login from './Login';
import io from 'socket.io-client';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { faBatteryHalf, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

// Connect to the Socket.IO server
const socket = io('http://localhost:5000'); // Replace with your backend URL

// Helper function to calculate distance between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δφ = (lat2 - lat1) * (Math.PI / 180);
  const Δλ = (lon2 - lon1) * (Math.PI / 180);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

function App() {
  const [gpsData, setGpsData] = useState({ lat: 0, lon: 0, alt: 0 }); // Added altitude
  const [previousGpsData, setPreviousGpsData] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [autopilot, setAutopilot] = useState(false);
  const [recording, setRecording] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(100); // Default battery level
  const [speed, setSpeed] = useState(0); // Speed state
  const [pitch, setPitch] = useState(0); // Camera pitch state
  const [yaw, setYaw] = useState(0); // Camera yaw state
  const [joystickConnected, setJoystickConnected] = useState(false); // Joystick connection state
  const [loggedIn, setLoggedIn] = useState(false);
  const [droneName, setDroneName] = useState('');
  const [droneId, setDroneId] = useState('');
  const [flightTime, setFlightTime] = useState(0); // Flight time state
  const [flightTimeInterval, setFlightTimeInterval] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (tracking || autopilot) {
      const interval = setInterval(() => {
        fetch('/api/gps')
          .then((response) => response.json())
          .then((data) => {
            if (previousGpsData) {
              const distance = calculateDistance(previousGpsData.lat, previousGpsData.lon, data.lat, data.lon);
              const timeElapsed = 1; // Interval in seconds
              const calculatedSpeed = (distance / timeElapsed) * 3.6; // Convert m/s to km/h
              setSpeed(calculatedSpeed);
            }
            setPreviousGpsData(data);
            setGpsData(data);
          });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [tracking, autopilot, previousGpsData]);

  useEffect(() => {
    if (autopilot) {
      setTracking(true); // Enable tracking when autopilot is active
    } else {
      setTracking(false); // Disable tracking when autopilot is inactive
    }
  }, [autopilot]);

  useEffect(() => {
    // Fetch weather data (example endpoint, adjust accordingly)
    fetch(`/api/weather?lat=${gpsData.lat}&lon=${gpsData.lon}`)
      .then((response) => response.json())
      .then((data) => {
        setWeatherData(data);
      });
  }, [gpsData]);

  // Simulate battery level update (replace with real API or logic as needed)
  useEffect(() => {
    const batteryInterval = setInterval(() => {
      setBatteryLevel(prevLevel => (prevLevel > 0 ? prevLevel - 1 : 0));
    }, 60000); // Decrease battery level every minute

    return () => clearInterval(batteryInterval);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      // Initialize video.js player
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: true,
        preload: 'auto',
        sources: [{
          src: 'https://stream-akamai.castr.com/5b9352dbda7b8c769937e459/live_2361c920455111ea85db6911fe397b9e/index.fmp4.m3u8', // Replace with your live stream URL
          type: 'application/x-mpegURL'
        }]
      });

      return () => {
        player.dispose();
      };
    }
  }, [videoRef]);

  useEffect(() => {
    // Handle live streaming from Socket.IO
    socket.on('video-data', (data) => {
      const videoElement = videoRef.current;
      if (videoElement) {
        const blob = new Blob([data], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        videoElement.src = url;
      }
    });

    socket.on('end-of-stream', () => {
      // Handle end of stream
      console.log('End of video stream');
    });

    return () => {
      socket.off('video-data');
      socket.off('end-of-stream');
    };
  }, [videoRef]);

  const startRecording = async () => {
    const stream = videoRef.current?.captureStream();
    if (stream) {
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        // Handle the recorded data (e.g., save or upload)
        console.log('Data available:', event.data);
      };

      recorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (recording) {
      recording.stop();
      setRecording(false);
    }
  };

  const handleLogin = (droneName, droneId) => {
    setDroneName(droneName);
    setDroneId(droneId);
    setLoggedIn(true);
  };
 
  const toggleFlightTime = () => {
    if (flightTimeInterval) {
      clearInterval(flightTimeInterval);
      setFlightTimeInterval(null);
    } else {
      const interval = setInterval(() => {
        setFlightTime(prevTime => prevTime + 1);
      }, 1000); // Update every second
      setFlightTimeInterval(interval);
    }
  };

  const resetAll = () => {
    setGpsData({ lat: 0, lon: 0, alt: 0 });
    setPreviousGpsData(null);
    setTracking(false);
    setAutopilot(false);
    setWeatherData(null);
    setBatteryLevel(100);
    setSpeed(0);
    setRecording(false);
    setFlightTime(0);
    if (flightTimeInterval) {
      clearInterval(flightTimeInterval);
      setFlightTimeInterval(null);
    }
  };

  const handlePitchChange = (e) => {
    setPitch(e.target.value);
    // Implement further logic to adjust camera pitch
  };

  const handleYawChange = (e) => {
    setYaw(e.target.value);
    // Implement further logic to adjust camera yaw
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
      <div className="video-container">
        <video ref={videoRef} className="video-js vjs-default-skin" controls autoPlay />
      </div>
      <div className="gps-box">
        <p><FontAwesomeIcon icon={faMapMarkerAlt} /> Latitude: {gpsData.lat}</p>
        <p><FontAwesomeIcon icon={faMapMarkerAlt} /> Longitude: {gpsData.lon}</p>
        <p><FontAwesomeIcon icon={faMapMarkerAlt} /> Altitude: {gpsData.alt} meters</p>
        {weatherData && (
          <p><FontAwesomeIcon icon={faCloudSun} /> Weather: {weatherData.description}</p>
        )}
        <p>Flight Time: {Math.floor(flightTime / 3600)}h {Math.floor((flightTime % 3600) / 60)}m {flightTime % 60}s</p> {/* Flight Time */}
      </div>
      <div className="controls">
        <button onClick={() => setGpsData({ lat: 0, lon: 0, alt: 0 })}>
          <FontAwesomeIcon icon={faSync} /> Reset GPS
        </button>
        <button onClick={() => setAutopilot(!autopilot)}>
          <FontAwesomeIcon icon={faRocket} /> {autopilot ? 'Disable Autopilot' : 'Enable Autopilot'}
        </button>
        <button onClick={resetAll} className="reset-button">
          <FontAwesomeIcon icon={faSync} /> Reset All
        </button>
        <button onClick={toggleJoystickConnection} className="joystick-button">
          <FontAwesomeIcon icon={faGamepad} size="2x" className={joystickConnected ? 'connected' : 'disconnected'} />
          <span>{joystickConnected ? 'Joystick Connected' : 'Joystick Disconnected'}</span>
        </button>
      </div>

      {/* Pitch and Yaw Controls */}
      <div className="pitch-yaw-container">
        <div className="pitch-yaw-item">
          <FontAwesomeIcon icon={faCamera} />
          <span>{pitch}° Pitch</span>
          <input 
            type="range" 
            min="-90" 
            max="90" 
            value={pitch} 
            onChange={handlePitchChange} 
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
            onChange={handleYawChange} 
          />
        </div>
      </div>

      <div className="icon-container">
        <div className="icon"><FontAwesomeIcon icon={faVideo} size="2x" /></div>
        <div className="icon"><FontAwesomeIcon icon={faCloudSun} size="2x" /></div>
        <div className="icon"><FontAwesomeIcon icon={faWifi} size="2x" /></div>
        <div className="icon"><FontAwesomeIcon icon={faBatteryHalf} size="2x" /></div> {/* Battery button */}
        <div className="icon"><FontAwesomeIcon icon={faVolumeUp} size="2x" /></div> {/* Volume button */}
        </div>
    </div>
  );
}

export default App;
