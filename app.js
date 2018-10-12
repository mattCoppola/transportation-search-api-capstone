// Declare Global Variables
const busURL = 'https://transit.land/api/v1/stops.geojson';
const bikeURL = 'https://api.coord.co/v1/sv/location';
let currentLat = '41.8781'; //center on Chicago on App Load
let currentLong = '-87.6298';
let busLayer = 'busses';
let bikeLayer = 'bikes';

// Error Handler - Message Display
function displayError(message) {
    $("#messageBox span").append(message);
    $("#messageBox").fadeIn();
    $("#messageBox").fadeOut(8000)
    $("#messageBox").queue(function () {
        $(this).empty().dequeue();
    });
};

// Listen for 'Show Current Location' Button Click
$('.currentLocation').on('click', function () {
    event.preventDefault();
    //        $('.landing').hide();
    //        $('#map').css('opacity', '1');
    removeBikeLayers();
    removeBusLayers();
    getBusData(currentLat, currentLong, displayBusAPI);
    getBikeData(currentLat, currentLong, displayBikeAPI);
    map.flyTo({
        center: [
                currentLong,
                currentLat],
        zoom: 16
    });
});

// reset Map and return to Landing Page
$('.reset').on('click', function () {
    console.log('reset clicked!');
    $('.landing').show();
    $('.reset').hide();
    $('#map').css('opacity', '.5');
    $('.listings').css('visibility', 'hidden');
    $('.bus-listings').html('');
    $('.bike-listings').html('');
    removeBikeLayers();
    removeBusLayers();
});

// ************** BIKE FUNCTIONS ************** //
// Add Bike icons to map and setBusMarkers
function displayBikeAPI(data) {
    console.log(data);
    if (data.features === null) {
        console.log("no Bike results!!!");
        displayError('<p>No Bike Data Available.  Search another location</p>');
        removeBikeLayers();
        //        if (map.getLayer('bikes')) {
        //            map.removeLayer('bikes');
        //        };
        //        if (map.getSource('bikes')) {
        //            map.removeSource('bikes');
        //        };
    } else {
        $('.landing').hide();
        $('.reset').show();
        $('#map').css('opacity', '1');
        displayBikeListings(data);
        // Add the data to your map as a layer
        removeBikeLayers();
        map.addLayer({
            id: 'bikes',
            type: 'symbol',
            // Add a GeoJSON source containing place coordinates and information.
            source: {
                type: 'geojson',
                data: data,
            },
            layout: {
                'icon-image': 'bicycle-15', //https://github.com/mapbox/maki/tree/master/icons
                'icon-allow-overlap': true,
            }
        });
        setBikeMarkers(data);
    }
}

// set Bike markers at time of rendering
function setBikeMarkers(data) {
    data.features.forEach(function (marker) {

        // create a HTML element for each feature
        var el = document.createElement('div');
        el.className = 'marker';

        // make a marker for each feature and add to the map
        new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)
            .setPopup(new mapboxgl.Popup({
                    offset: 25
                }) // add popups
                .setHTML('<h3>' + marker.properties.system_id + '</h3><p>' + marker.properties.name + '</p><p>Bikes Available: ' + marker.properties.num_bikes_available + '</p><p>Docks Available: ' + marker.properties.num_docks_available + '</p>'))
            .addTo(map);
    });

}

// API CALL TO Coord (For Bike Data)
function getBikeData(lat, lon, callback) {
    let query = {
        access_key: 'liETJic1H2dGU29EVfgqfA9SyWR6kjgJjRgzQtO_4AU',
        radius_km: 1,
        latitude: lat,
        longitude: lon
    }
    $.getJSON(bikeURL, query, function () {
            console.log('Bike API starting...');
        })
        .done(callback)
        .fail(function () {
            console.log('error');
        })
        .always(function () {
            console.log('Bike API complete');
        })
}

// Render HTML for Bike listings container
function renderBikeListings(listing, index) {
    return `
        <li>
        <div class=bike-listing data-id=${index}>
<img class="bike-icon" src="images/bicycle.png" alt="Bicycle Image"/>
        <h3 class="bike-list-title">${listing.properties.name}</h3>
        <div class="bike-list-details">
        <p>Operator: ${listing.properties.system_id}</p>
        <p>Bikes Available: ${listing.properties.num_bikes_available}</p>
        <p>Docks Available: ${listing.properties.num_docks_available}</p>
        </div>
        </div>
        <div class="get-directions">
        <a href="">Get Directions</a>
        </div>
        </li>
        `;
}

// Display Bike Listings to HTML
function displayBikeListings(data) {
    let bikeResults = data.features.map((listing, index) => renderBikeListings(listing, index))
    $('.bike-listings').html('<ul>' + bikeResults.join('') + '</ul>');
    $('.listings').css('visibility', 'visible');
    showBikeListDetails();
    flyToBike(data);
}

//Fly to bike when listing is clicked
function flyToBike(data) {
    $('.bike-listing').click(function () {
        let clickedListing = data.features[this.dataset.id];
        map.flyTo({
            center: clickedListing.geometry.coordinates,
            speed: 1.8,
            zoom: 20
        });
        createBikePopUp(clickedListing);
    });
}

// ************** BUS FUNCTIONS ************** //
// Add Bus icons to map and setBusMarkers
function displayBusAPI(data) {
    console.log(data);
    if (!data.features.length) {
        console.log("no Bus results!!!");
        displayError('No Bus Data Available.  Search another location');
        removeBusLayers();
        //        if (map.getLayer('busses')) {
        //            map.removeLayer('busses');
        //        };
        //        if (map.getSource('busses')) {
        //            map.removeSource('busses');
        //        };
    } else {
        $('.landing').hide();
        $('.reset').show();
        $('#map').css('opacity', '1');
        displayBusListings(data);
        // Add the data to your map as a layer
        removeBusLayers();
        map.addLayer({
            id: 'busses',
            type: 'symbol',
            // Add a GeoJSON source containing place coordinates and information.
            source: {
                type: 'geojson',
                data: data,
            },
            layout: {
                'icon-image': 'bus-15', //https://github.com/mapbox/maki/tree/master/icons
                'icon-allow-overlap': true,
            }
        });
        setBusMarkers(data);
    }
}

// set Bus markers at time of rendering
function setBusMarkers(data) {
    data.features.forEach(function (marker) {

        // create a HTML element for each feature
        var el = document.createElement('div');
        el.className = 'marker';

        // make a marker for each feature and add to the map
        new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)
            .setPopup(new mapboxgl.Popup({
                    offset: 25
                }) // add popups
                .setHTML('<h3>' + marker.properties.name + '</h3><p>' + marker.properties.operators_serving_stop[0].operator_name + '</p><p>Route # : ' + marker.properties.operators_serving_stop[0].route_name + '</p><p>Wheelchair: ' + marker.properties.wheelchair_boarding + '</p>'))
            .addTo(map);
    });

}

// API CALL TO TRANSIT LAND (For Bus Data)
function getBusData(lat, lon, callback) {
    let query = {
        lat: `${lat}`,
        lon: `${lon}`,
        r: '500',
        total: 'true'
    }
    $.getJSON(busURL, query, function () {
            console.log('Bus API starting...');
        })
        .done(callback)
        .fail(function () {
            console.log('error');
        })
        .always(function () {
            console.log('Bus API complete');
        });
}

// Render HTML for Bus listings container
function renderBusListings(listing, index) {
    if (listing.properties.operators_serving_stop[0] === undefined) {
        console.log('operators serving stop is blank...skipping...')
        console.error(TypeError);
    } else {
        return `
            <li>
            <div class=bus-listing data-id=${index}>
            <img class="bike-icon" src="images/bus.svg" alt="Bus Image"/>
            <h3 class="bus-list-title">${listing.properties.name}</h3>
            <div class="bus-list-details"><p>Operator: ${listing.properties.operators_serving_stop[0].operator_name}</p>
            <p>Route: ${listing.properties.routes_serving_stop[0].route_name}</p>
            <p>${listing.properties.tags.stop_desc}</p>
            </div>
            </div>
            <div class="get-directions">
            <a href="">Get Directions</a>
            </div>
            </li>
        `;
    }
}

// Display Bus Listings to HTML
function displayBusListings(data) {
    let results = data.features.map((listing, index) => renderBusListings(listing, index))
    $('.bus-listings').html('<ul>' + results.join('') + '</ul>');
    $('.listings').css('visibility', 'visible');
    showBusListDetails();
    flyToBus(data);
}

//Fly to bus when listing is clicked
function flyToBus(data) {
    $('.bus-listing').click(function () {
        let clickedListing = data.features[this.dataset.id];
        map.flyTo({
            center: clickedListing.geometry.coordinates,
            speed: 1.3,
            zoom: 15
        });
        createBusPopUp(clickedListing);
    });
}

// Create Bus Popup while flying to store
function createBusPopUp(clickedListing) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    // Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) popUps[0].remove();
    var popup = new mapboxgl.Popup({
            closeOnClick: false
        })
        .setLngLat(clickedListing.geometry.coordinates)
        .setHTML('<h3>' + clickedListing.properties.name + '</h3><p>' + clickedListing.properties.routes_serving_stop[0].operator_name + '</p><p>Route # : ' + clickedListing.properties.routes_serving_stop[0].route_name + '</p><p>Wheelchair: ' + clickedListing.properties.wheelchair_boarding + '</p>')
        .addTo(map);
}


// Create Bike Popup while flying to store
function createBikePopUp(clickedListing) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    // Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) popUps[0].remove();
    var popup = new mapboxgl.Popup({
            closeOnClick: false
        })
        .setLngLat(clickedListing.geometry.coordinates)
        .setHTML('<h3>' + clickedListing.properties.system_id + '</h3><p>' + clickedListing.properties.name + '</p><p>Bikes Available: ' + clickedListing.properties.num_bikes_available + '</p><p>Docks Available: ' + clickedListing.properties.num_docks_available + '</p>')
        .addTo(map);
}

// Show/Hide List Details on-click
function showBusListDetails() {
    $('.bus-list-title').click(function () {
        $(this).next('.bus-list-details').slideToggle();
    });
}

function showBikeListDetails() {
    $('.bike-list-title').click(function () {
        $(this).next('.bike-list-details').slideToggle();
    });
}

// ************** MAPBOX FUNCTIONS ************** //
// MAPBOX - INITIALIZE AND GEOLOCATE CURRENT LAT/LONG

mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGNvcHBvbGEiLCJhIjoiY2ptb3ZsdmFuMTh1YTNrbWowa3gzZm82ZiJ9.S7EhnqCwmFeZmy-obXH41g';

map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v9',
    //    style: 'mapbox://styles/mattcoppola/cjn3eukxx08912ro6xi9ci950',
    //    style: 'mapbox://styles/mattcoppola/cjn3eql0a008w2rpjazs9vkim',
    center: [currentLong, currentLat], // starting position [lng, lat]
    zoom: 10 // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
}));


var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// grab coordinates of entered address/landmark
geocoder.on('result', function (ev) {
    removeBikeLayers();
    removeBusLayers();
    let first = $('.mapboxgl-ctrl-geocoder input:first').val();
    console.log(first);
    map.getSource('single-point');
    let coord = (ev.result.geometry);
    console.log(coord);
    let long = coord.coordinates[0];
    let lat = coord.coordinates[1];
    $('.mapboxgl-ctrl-geocoder input').val('');
    getBusData(lat, long, displayBusAPI);
    getBikeData(lat, long, displayBikeAPI);
});


// get current position lat and longitude

let options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

function success(pos) {
    let crd = pos.coords;

    console.log('Your current position is:');
    console.log(`Latitude : ${crd.latitude}`);
    console.log(`Longitude: ${crd.longitude}`);
    console.log(`More or less ${crd.accuracy} meters.`);
    currentLat = crd.latitude;
    currentLong = crd.longitude;
}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

function removeBikeLayers() {
    console.log('removing bike layer: ' + bikeLayer)
    if (map.getLayer(bikeLayer)) {
        map.removeLayer(bikeLayer);
    };
    if (map.getSource(bikeLayer)) {
        map.removeSource(bikeLayer);
    };
}

function removeBusLayers() {
    console.log('removing bus layer: ' + busLayer)
    if (map.getLayer(busLayer)) {
        map.removeLayer(busLayer);
    };
    if (map.getSource(busLayer)) {
        map.removeSource(busLayer);
    };
}

navigator.geolocation.getCurrentPosition(success, error, options);
