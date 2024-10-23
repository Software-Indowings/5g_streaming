import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const pathRef = useRef([]);
  const [gpsData, setGpsData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const fetchGPSData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/gps');
      if (!response.ok) {
        throw new Error('Failed to fetch GPS data');
      }
      const data = await response.json();
      setGpsData({ latitude: data.lat, longitude: data.lon });
      setFetchError(null);
    } catch (error) {
      console.error('Error fetching GPS data:', error);
      setFetchError('Could not fetch GPS data. Please try again.');
    }
  };

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoicHJhdmVlbmluZG8xMiIsImEiOiJjbTJpd3Yyd2EwanhqMnFzYmlqN3Rlb2VkIn0.jdFJ_oi85VB7b2HblP4KCg';

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-122.4194, 37.7749],
        zoom: 15,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      mapRef.current.on('load', () => {
        setMapLoaded(true);
      });

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
    if (mapRef.current && gpsData && !markerRef.current) {
      markerRef.current = new mapboxgl.Marker()
        .setLngLat([gpsData.longitude, gpsData.latitude])
        .addTo(mapRef.current);
    }
  }, [gpsData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGPSData();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (markerRef.current && mapRef.current && mapLoaded && gpsData) {
      markerRef.current.setLngLat([gpsData.longitude, gpsData.latitude]);

      mapRef.current.flyTo({
        center: [gpsData.longitude, gpsData.latitude],
        essential: true,
      });

      if (pathRef.current.length === 0 || pathRef.current[pathRef.current.length - 1] !== [gpsData.longitude, gpsData.latitude]) {
        pathRef.current.push([gpsData.longitude, gpsData.latitude]);

        if (mapRef.current.isStyleLoaded()) {
          if (mapRef.current.getSource('uav-path')) {
            mapRef.current.getSource('uav-path').setData({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: pathRef.current,
              },
            });
          } else {
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
                'line-color': '#ff0000',
                'line-width': 4,
              },
            });
          }
        }
      }
    }
  }, [gpsData, mapLoaded]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (mapRef.current) {
      mapRef.current.setStyle(darkMode ? 'mapbox://styles/mapbox/streets-v11' : 'mapbox://styles/mapbox/dark-v10');
      mapRef.current.once('styledata', () => {
        // Re-add the UAV path when the style changes
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
            'line-color': '#ff0000',
            'line-width': 4,
          },
        });
      });
    }
  };

  return (
    <>
      {fetchError && <div className="error">{fetchError}</div>}
      <div className="map-container" ref={mapContainerRef} />
      <button className="dark-mode-button" onClick={toggleDarkMode}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </>
  );
};

export default Map;
