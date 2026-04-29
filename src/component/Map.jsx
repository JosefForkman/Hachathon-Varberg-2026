import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export function Map() {
    // Funktion för att visa info när man klickar på ett område
    const onEachFeature = (feature, layer) => {
        if (feature.properties && feature.properties.NAMN) {
            layer.bindPopup(
                `<strong>Naturreservat:</strong> ${feature.properties.NAMN}`,
            );
        }
    };

    // Stil för områdena
    const geojsonStyle = {
        color: "#2ecc71",
        weight: 2,
        fillOpacity: 0.5,
    };

    return (
        <MapContainer
            center={[56.4, 12.7]} // Centrerat kring Bjäre/Hallandsåsen
            zoom={10}
            style={{ height: "500px", width: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <GeoJSON
                data={hallandData}
                style={geojsonStyle}
                onEachFeature={onEachFeature}
            />
        </MapContainer>
    );
}
