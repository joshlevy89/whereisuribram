document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    const map = L.map('map').setView([0, 0], 2);


    // Add OpenStreetMap tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Function to fetch coordinates from Nominatim API
    async function fetchCoordinates(locationName) {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            return { lat: parseFloat(lat), lng: parseFloat(lon) };
        }
        return null;
    }

    // Read locations from the JSON file
    fetch('locations.json')
        .then(response => response.json())
        .then(async locations => {
            // Create an array to store the coordinates for the polyline
            const coordinates = [];

            // Get the total number of locations
            const totalLocations = locations.length;

            // Get the current location
            const currentLocation = locations[totalLocations - 1];

            // Function to add locations to the map and list with a delay
            const addLocationWithDelay = (index, location) => {
                setTimeout(async () => {
                    const coords = await fetchCoordinates(location.name);
                    if (coords) {
                        // Determine if the location is the current location
                        const isCurrentLocation = index === totalLocations - 1;
                        // Calculate the label for the arrowhead
                        const label = totalLocations - index - 1;
                        const labelText = isCurrentLocation ? 'Current location' : `Visited ${label} location${label > 1 ? 's' : ''} ago`;

                        // Add circle markers with the appropriate text
                        L.circleMarker([coords.lat, coords.lng], { color: 'blue', radius: 4 }).addTo(map)
                            .bindPopup(`<strong>${location.name}</strong><br>${labelText}`)
                            .openPopup();
                        coordinates.push([coords.lat, coords.lng]);

                        // Draw lines between the locations
                        if (index > 0) {
                            L.polyline([coordinates[index - 1], coordinates[index]], { color: 'blue' }).addTo(map);
                        }

                        // Update the prior locations list
                        if (!isCurrentLocation) {
                            const priorLocationsList = document.getElementById('prior-locations');
                            const listItem = document.createElement('li');
                            listItem.innerText = `${location.name} (${labelText})`;
                            if (priorLocationsList.firstChild) {
                                priorLocationsList.insertBefore(listItem, priorLocationsList.firstChild);
                            } else {
                                priorLocationsList.appendChild(listItem);
                            }
                        }
                    }
                }, index * 500);
            };

            // Iterate through the locations and add markers with negative numbering
            for (const [index, location] of locations.entries()) {
                addLocationWithDelay(index, location);
            }

            // Get the location container element
            const locationContainer = document.getElementById('location');
            // Get the location name element and question mark element within the container
            const locationNameElement = locationContainer.querySelector('.location-name');
            const questionMarkElement = locationContainer.querySelector('.question-mark');
            // Add the spinner class to the question mark
            questionMarkElement.classList.add('spinner');

            // Center the map on the current location after all locations have been added
            setTimeout(async () => {
                const currentCoords = await fetchCoordinates(currentLocation.name);
                if (currentCoords) {
                    map.setView([currentCoords.lat, currentCoords.lng], 6);
                    // Reveal the current location
                    locationNameElement.textContent = currentLocation.name;
                    // Add the revealed-location class to style the revealed location text
                    locationNameElement.classList.add('revealed-location');
                    // Add the hide class to the question mark to stop spinning and hide it
                    questionMarkElement.classList.add('hide');
                }
            }, totalLocations * 500);
        });
});
