import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css'; // Import the CSS file

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null); // For referencing the Mapbox instance
  const markerRef = useRef(null); // For referencing the marker
  const pathRef = useRef([]); // To store the UAV's path
  const [gpsData, setGpsData] = useState(null); // Initially no GPS data
  const [fetchError, setFetchError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false); // Track map loading status

  // Function to fetch GPS data from the backend
  const fetchGPSData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/gps');
      if (!response.ok) {
        throw new Error('Failed to fetch GPS data');
      }
      const data = await response.json();
      setGpsData({ latitude: data.lat, longitude: data.lon });
      setFetchError(null); // Clear any previous error
    } catch (error) {
      console.error('Error fetching GPS data:', error);
      setFetchError('Could not fetch GPS data. Please try again.');
    }
  };

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW5kby1zb2Z0IiwiYSI6ImNsemdyYjdnbDFsOHMyanF6aGh4djF4N3oifQ.HYLq-WHVTMdJznecmdtGoQ';

    // Initialize the map once
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-122.4194, 37.7749], // Default center (San Francisco)
        zoom: 15,
      });

      // Add zoom and rotation controls to the map
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Wait for the map to fully load before allowing any modifications
      mapRef.current.on('load', () => {
        setMapLoaded(true); // Mark the map as fully loaded
      });

      // Adjust map style on window resize
      const resizeMap = () => mapRef.current.resize();
      window.addEventListener('resize', resizeMap);

      return () => {
        window.removeEventListener('resize', resizeMap);
        mapRef.current.remove();
        mapRef.current = null;
      };
    }
  }, []);

  useEffect(() => {
    // Set up the marker on the map for the first time if GPS data is available
    if (mapRef.current && gpsData && !markerRef.current) {
      markerRef.current = new mapboxgl.Marker()
        .setLngLat([gpsData.longitude, gpsData.latitude])
        .addTo(mapRef.current);
    }
  }, [gpsData]);

  useEffect(() => {
    // Fetch GPS data every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchGPSData();
    }, 500); // Adjust the interval time if needed

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update marker and path whenever gpsData changes
    if (markerRef.current && mapRef.current && mapLoaded && gpsData) {
      markerRef.current.setLngLat([gpsData.longitude, gpsData.latitude]);

      // Fly to the new location for a smooth transition
      mapRef.current.flyTo({
        center: [gpsData.longitude, gpsData.latitude],
        essential: true,
      });

      // Add new GPS position to the path (after first fetch)
      if (pathRef.current.length === 0 || pathRef.current[pathRef.current.length - 1] !== [gpsData.longitude, gpsData.latitude]) {
        pathRef.current.push([gpsData.longitude, gpsData.latitude]);

        // Update the path line
        if (mapRef.current.getSource('uav-path')) {
          // If the source already exists, update it
          mapRef.current.getSource('uav-path').setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: pathRef.current, // Use the pathRef array to draw the line
            },
          });
        } else {
          // Add a new source and layer for the path only if map is fully loaded
          if (mapLoaded) {
            mapRef.current.addSource('uav-path', {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: pathRef.current,
                },
              },
            });

            mapRef.current.addLayer({
              id: 'uav-path',
              type: 'line',
              source: 'uav-path',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#ff0000', // Red color for the path
                'line-width': 4,
              },
            });
          }
        }
      }
    }
  }, [gpsData, mapLoaded]);

  return (
    <>
      {fetchError && <div className="error">{fetchError}</div>}
      <div className="map-container" ref={mapContainerRef} />
    </>
  );
};

export default Map;
