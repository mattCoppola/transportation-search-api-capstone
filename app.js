// Declare Global Variables
const busURL = 'https://transit.land/api/v1/stops.geojson';
let currentLat = '41.8781';
let currentLong = '-87.6298';

// Error Handler - Message Display
function displayError(message) {
    $("#messageBox span").html(message);
    $("#messageBox").fadeIn();
    $("#messageBox").fadeOut(8000);
};

// Listen for Show Current Location Button Click
function currentLocationClicked() {
    $('.currentLocation').on('click', function () {
        event.preventDefault();
        //        $('.landing').hide();
        //        $('#map').css('opacity', '1');
        getBusData(currentLat, currentLong, displayBusAPI);
        map.flyTo({
            center: [
                currentLong,
                currentLat],
            zoom: 16
        });
    });
}

// reset Map and return to Landing Page
function resetMap() {
    $('.reset').on('click', function () {
        console.log('reset clicked!');
        $('.landing').show();
        $('#map').css('opacity', '1');
        $('.listings').html('').css('visibility', 'hidden');
        map.removeLayer('busses');
        map.removeSource('busses');
    });
}

// Add Bus icons to map and setMarkers
function displayBusAPI(data) {
    console.log(data);
    if (!data.features.length) {
        console.log("no results!!!");
        displayError('No Data Available.  Search another location');
    } else {
        $('.landing').hide();
        $('#map').css('opacity', '1');
        displayBusListings(data);
        // Add the data to your map as a layer
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

        setMarkers(data);
    }
}

// set markers at time of rendering
function setMarkers(data) {
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
                .setHTML('<h3>' + marker.properties.name + '</h3><p>' + marker.properties.routes_serving_stop[0].operator_name + '</p><p>Route # : ' + marker.properties.routes_serving_stop[0].route_name + '</p><p>Wheelchair: ' + marker.properties.wheelchair_boarding + '</p>'))
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

function renderBusListings(listing, index) {
    return `
            <li>
            <div class=listing data-id=${index}>
            <h3 class="list-title">${listing.properties.name}</h3>
            <div class="list-details"><p>Operator: ${listing.properties.routes_serving_stop[0].operator_name}</p>
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

function displayBusListings(data) {
    let results = data.features.map((listing, index) => renderBusListings(listing, index))
    $('.listings').html('<ul>' + results.join('') + '</ul>');
    $('.listings').css('visibility', 'visible');
    showListDetails();
    flyToStore(data);
}

//Fly to store when listing is clicked
function flyToStore(data) {
    $('.listing').click(function () {
        let clickedListing = data.features[this.dataset.id];
        map.flyTo({
            center: clickedListing.geometry.coordinates,
            speed: 1.8,
            zoom: 20
        });
        createPopUp(clickedListing);
    });
}

// Create Popup while flying to store
function createPopUp(clickedListing) {
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


// Show/Hide List Details on-click
function showListDetails() {
    $('.list-title').click(function () {
        $(this).next('.list-details').slideToggle();
    });
}


// MAPBOX - INITIALIZE AND GEOLOCATE CURRENT LAT/LONG

mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGNvcHBvbGEiLCJhIjoiY2ptb3ZsdmFuMTh1YTNrbWowa3gzZm82ZiJ9.S7EhnqCwmFeZmy-obXH41g';

map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
    center: [currentLong, currentLat], // starting position [lng, lat]
    zoom: 10 // starting zoom
});

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
    if (typeof mapLayer !== 'undefined') {
        // Remove map layer & source.
        map.removeLayer('busses').removeSource('busses');
    }
    map.getSource('single-point');
    let coord = (ev.result.geometry);
    let long = coord.coordinates[0];
    let lat = coord.coordinates[1];
    getBusData(lat, long, displayBusAPI);
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

navigator.geolocation.getCurrentPosition(success, error, options);

$(currentLocationClicked);
$(resetMap);
