// Sidebar.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCamera, faSyncAlt, faGamepad } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ gpsData, pitch, yaw, joystickConnected, toggleJoystickConnection, setPitch, setYaw }) => {
  return (
    <div className="sidebar">
      <h2>Controls</h2>
      <div className="sidebar-item">
        <FontAwesomeIcon icon={faMapMarkerAlt} />
        <div className="sidebar-info">
          <p>Latitude: {gpsData.lat}</p>
          <p>Longitude: {gpsData.lon}</p>
          <p>Altitude: {gpsData.alt} meters</p>
        </div>
      </div>
      
      <div className="sidebar-item">
        <FontAwesomeIcon icon={faGamepad} size="2x" />
        <button onClick={toggleJoystickConnection} className="joystick-button">
          {joystickConnected ? 'Joystick Connected' : 'Joystick Disconnected'}
        </button>
      </div>

      <div className="sidebar-item">
        <FontAwesomeIcon icon={faCamera} />
        <span>Pitch</span>
        <input
          type="range"
          min="-90"
          max="90"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
        />
        <span>{pitch}°</span>
      </div>

      <div className="sidebar-item">
        <FontAwesomeIcon icon={faSyncAlt} />
        <span>Yaw</span>
        <input
          type="range"
          min="-180"
          max="180"
          value={yaw}
          onChange={(e) => setYaw(e.target.value)}
        />
        <span>{yaw}°</span>
      </div>
    </div>
  );
};

export default Sidebar;
