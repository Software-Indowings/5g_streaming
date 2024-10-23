import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css'; // Import the CSS file

const Map = () => {
  const mapContainerRef = useRef(null);
  const [gpsData, setGpsData] = useState({ latitude: 37.7749, longitude: -122.4194 }); // Default to San Francisco

  useEffect(() => {
    // Fetch GPS data from the backend
    const fetchGPSData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/gps');
        const data = await response.json();
        setGpsData({ latitude: data.lat, longitude: data.lon });
      } catch (error) {
        console.error('Error fetching GPS data:', error);
      }
    };

    fetchGPSData();
  }, []);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW5kby1zb2Z0IiwiYSI6ImNsemdyYjdnbDFsOHMyanF6aGh4djF4N3oifQ.HYLq-WHVTMdJznecmdtGoQ';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [gpsData.longitude, gpsData.latitude],
      zoom: 15, // Adjusted zoom level
    });

    new mapboxgl.Marker().setLngLat([gpsData.longitude, gpsData.latitude]).addTo(map);

    // Add zoom and rotation controls to the map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Adjust map style on window resize
    const resizeMap = () => map.resize();
    window.addEventListener('resize', resizeMap);

    return () => {
      map.remove();
      window.removeEventListener('resize', resizeMap);
    };
  }, [gpsData]);

  return <div className="map-container" ref={mapContainerRef} />;
};

export default Map;
