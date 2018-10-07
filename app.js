// Declare Global Variables
const busURL = 'https://transit.land/api/v1/stops.geojson';
let currentLat = '';
let currentLong = '';

$('.currentLocation').on('click', function () {
    event.preventDefault();
    console.log('clicked!');
    $('.landing').hide();
    $('#map').css('opacity', '1');
    getBusData(currentLat, currentLong, displayBusAPI);
});

function displayBusAPI(data) {
    console.log(data);
    console.log(data.features[0].properties.name);
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
}

function getBusData(lat, lon, callback) {
    let query = {
        lat: `${currentLat}`,
        lon: `${currentLong}`,
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

function renderBusListings(listing) {
    return `
            <li>
            <div class=listing>
            <h3 class="list-title">${listing.properties.name}</h3>
            <p>${listing.properties.tags.stop_desc}</p>
            </div>
            <div class="get-directions">
            <a href="">Get Directions</a>
            </div>
            </li>
        `;
}

function displayBusListings(data) {
    let results = data.features.map((listing, index) => renderBusListings(listing))
    console.log(results);
    $('.listings').html('<ul>' + results.join('') + '</ul>');
}
// map initialize and geolocate

mapboxgl.accessToken = 'pk.eyJ1IjoibWF0dGNvcHBvbGEiLCJhIjoiY2ptb3ZsdmFuMTh1YTNrbWowa3gzZm82ZiJ9.S7EhnqCwmFeZmy-obXH41g';
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
    center: [-87.7191804, 41.923792], // starting position [lng, lat]
    zoom: 16 // starting zoom
});

map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
}));

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
