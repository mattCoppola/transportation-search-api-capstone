// Declare Global Variables
const busURL = 'https://transit.land/api/v1/stops.geojson';
const bikeURL = 'https://api.coord.co/v1/sv/location';
let currentLat = '41.8781'; //center on Chicago on App Load
let currentLong = '-87.6298';
let busLayer = 'busses'; // set global bus layer (Mapbox)
let bikeLayer = 'bikes'; // set global bike layer (Mapbox)
let COORD = ''; //capturing geocoding first result (landing search)
let DIRECTIONSCOORD = ''; //capturing geocoding first result (directions search)
let startCoord = ''; //initialize for directions

// Error Handlers - Message Displays for Bus and Bike
function displayBusError(message) {
    //    console.log('bus error displayed');
    $("#messageBox-bus").fadeIn();
    $("#messageBox-bus").fadeOut(3000);
    $("#messageBox-bus .bus").html(message);
};

function displayBikeError(message) {
    //    console.log('bike error displayed');
    $("#messageBox-bike").fadeIn();
    $("#messageBox-bike").fadeOut(3000);
    $("#messageBox-bike .bike").html(message);
};

// Listen for 'Show Current Location' Button Click
$('.currentLocation').on('click', function (e) {
    e.preventDefault();
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

// reset Map and return to Landing Page on Reset Button Click
$('.reset').on('click', function () {
    $('.mapboxgl-popup').remove();
    $('.landing').show();
    $('#directions').css('visibility', 'hidden');
    $('#instructions').css('visibility', 'hidden');
    $('.reset').hide();
    $(".reset").css('top', '');
    $('#map').css('opacity', '.4');
    $('.listings').css('visibility', 'hidden');
    $('.bus-listings').html('');
    $('.bike-listings').html('');
    removeBikeLayers();
    removeBusLayers();
});

// ************** BIKE FUNCTIONS ************** //
// Add Bike icons to map and set Bike Markers
function displayBikeAPI(data) {
    //    console.log('Bike Data:', data);
    if (data.features === null) {
        displayBikeError('No Bike Data Available for this location.');
        removeBikeLayers();
    } else {
        $('.landing').hide();
        $('.reset').show();
        $('#map').css('opacity', '1');
        displayBikeListings(data);
        removeBikeLayers(); //remove existing Bike Layers
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
                'icon-size': 1.5,
                'icon-allow-overlap': true,
            }
        });
        setBikeMarkers(data);
    }
}

// set Bike Marker HTML - using if statement to catch missing info
function setBikeHTMLOutput(marker) {
    let htmlOutput = '';
    htmlOutput += '<h3>' + marker.properties.system_id + '</h3>';
    htmlOutput += '<p>' + marker.properties.name + '</p>';
    htmlOutput += '<p>Bikes Available: ' + marker.properties.num_bikes_available + '</p>';
    if (marker.properties.num_docks_available === null || marker.properties.num_docks_available === undefined) {
        htmlOutput += '<p>No Dock Info</p>';
    } else {
        htmlOutput += '<p>Docks Available: ' + marker.properties.num_docks_available + '</p>';
    }
    return htmlOutput;
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
                .setHTML(setBikeHTMLOutput(marker)))
            .addTo(map);
    });
}

// API CALL To Coord (For Bike Data)
function getBikeData(lat, lon, callback) {
    let query = {
        access_key: 'liETJic1H2dGU29EVfgqfA9SyWR6kjgJjRgzQtO_4AU',
        radius_km: 1,
        latitude: lat,
        longitude: lon
    }
    $.getJSON(bikeURL, query, function () {
            //            console.log('Bike API starting...');
        })
        .done(callback)
        .fail(function () {
            console.log('error');
        })
        .always(function () {
            //            console.log('Bike API complete');
        })
}

// Render HTML for Bike listings container
function renderBikeListings(listing, index) {
    let htmlOutput = '';

    htmlOutput += `<li>`;
    htmlOutput += `<div class=bike-listing data-id=${index}>`;
    htmlOutput += `<img class="bike-icon" src="images/bicycle.png" alt="Bicycle Image"/>`;
    if (listing.properties.name === '') {
        htmlOutput += 'This bike has no name';
    } else {
        htmlOutput += `<h3 class="bike-list-title">${listing.properties.name}</h3>`;
    }
    htmlOutput += `<div class="bike-list-details">`;
    htmlOutput += `<p>Operator: ${listing.properties.system_id}</p>`;
    htmlOutput += `<p>Bikes Available: ${listing.properties.num_bikes_available}</p>`;
    if (listing.properties.num_docks_available === null || listing.properties.num_docks_available === undefined) {
        htmlOutput += `Type: ${listing.properties.location_type}`;
    } else {
        htmlOutput += `<p>Docks Available: ${listing.properties.num_docks_available}</p>`;
    }
    htmlOutput += `</div>`;
    htmlOutput += `</div>`;
    //    htmlOutput += `<div class="get-directions">`;
    //    htmlOutput += `<a data-id=${listing.geometry.coordinates} href="#">Get Directions</a>`;
    htmlOutput += `</div>`;
    htmlOutput += `</li>`;

    return htmlOutput;
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
            speed: 1.3,
            zoom: 15
        });
        createBikePopUp(clickedListing);
    });
}

// ************** BUS FUNCTIONS ************** //
// Add Bus icons to map and set Bus Markers
function displayBusAPI(data) {
    //    console.log('Bus Data: ', data);
    if (!data.features.length) {
        displayBusError('No Bus Data Available for this location.');
        removeBusLayers();
    } else {
        $('.landing').hide();
        $('.reset').show();
        $('#map').css('opacity', '1');
        displayBusListings(data);
        // Remove existing map layers, add the data to your map as a layer
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
                'icon-size': 1.5,
                'icon-allow-overlap': true,
            }
        });
        setBusMarkers(data);
    }
}

// set Bus Marker HTML - using if statement to catch missing info
function setBusHTMLOutput(marker) {
    let htmlOutput = '';
    htmlOutput += '<h3>' + marker.properties.name + '</h3>';
    htmlOutput += '<p>' + marker.properties.operators_serving_stop[0].operator_name + '</p>';
    htmlOutput += '<p>Route #: ' + marker.properties.routes_serving_stop[0].route_name + '</p>';
    if (marker.properties.wheelchair_boarding === null || marker.properties.wheelchair_boarding === undefined) {
        htmlOutput += '<p>No Wheelchair Info</p>';
    } else {
        htmlOutput += '<p>Wheelchair: ' + marker.properties.wheelchair_boarding + '</p>';
    }
    return htmlOutput;
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
                .setHTML(setBusHTMLOutput(marker)))
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
            //            console.log('Bus API starting...');
        })
        .done(callback)
        .fail(function () {
            console.log('error');
        })
        .always(function () {
            //            console.log('Bus API complete');
        });
}

// Render HTML for Bus listings container
function renderBusListings(listing, index) {
    let busHTMLOutput = '';

    busHTMLOutput += `<li>`;
    busHTMLOutput += `<div class=bus-listing data-id=${index}>`;
    busHTMLOutput += `<img class="bike-icon" src="images/bus.svg" alt="Bus Image"/>`;
    busHTMLOutput += `<h3 class="bus-list-title">${listing.properties.name}</h3>`;
    if (listing.properties.operators_serving_stop[0] === undefined) {
        busHTMLOutput += `<div class="bus-list-details"><p>No Operator Info</p>`;
    } else {
        busHTMLOutput += `<div class="bus-list-details"><p>Operator: ${listing.properties.operators_serving_stop[0].operator_name}</p>`;
    }
    if (listing.properties.routes_serving_stop[0] === undefined) {
        busHTMLOutput += `<p>No Route Defined</p>`;
    } else {
        busHTMLOutput += `<p>Route: ${listing.properties.routes_serving_stop[0].route_name}</p>`;
    }
    if (listing.properties.tags.stop_desc === undefined) {
        busHTMLOutput += `No Stop Description`;
    } else {
        busHTMLOutput += `<p>${listing.properties.tags.stop_desc}</p>`;
    }
    busHTMLOutput += `</div>`;
    busHTMLOutput += `</div>`;
    //    busHTMLOutput += `<div class="get-directions">`;
    //    busHTMLOutput += `<a data-id=${listing.geometry.coordinates} href="#">Get Directions</a>`;
    busHTMLOutput += `</div>`;
    busHTMLOutput += `</li>`;

    return busHTMLOutput;
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
    let busHTMLOutput = '';
    busHTMLOutput += '<h3>' + clickedListing.properties.name + '</h3>';
    busHTMLOutput += '<p>' + clickedListing.properties.operators_serving_stop[0].operator_name + '</p>';
    busHTMLOutput += '<p>Route #: ' + clickedListing.properties.routes_serving_stop[0].route_name + '</p>';
    if (clickedListing.properties.wheelchair_boarding === null || clickedListing.properties.wheelchair_boarding === undefined) {
        busHTMLOutput += '<p>No Wheelchair Info</p>';
    } else {
        busHTMLOutput += '<p>Wheelchair: ' + clickedListing.properties.wheelchair_boarding + '</p>';
    }

    var popUps = document.getElementsByClassName('mapboxgl-popup');
    // Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) popUps[0].remove();
    var popup = new mapboxgl.Popup({
            closeOnClick: false
        })
        .setLngLat(clickedListing.geometry.coordinates)
        .setHTML(busHTMLOutput)
        //    '<h3>' + clickedListing.properties.name + '</h3><p>' + clickedListing.properties.routes_serving_stop[0].operator_name + '</p><p>Route # : ' + clickedListing.properties.routes_serving_stop[0].route_name + '</p><p>Wheelchair: ' + clickedListing.properties.wheelchair_boarding + '</p>'
        .addTo(map);
}

// Create Bike Popup while flying to store
function createBikePopUp(clickedListing) {
    let htmlOutput = '';
    htmlOutput += '<h3>' + clickedListing.properties.system_id + '</h3>';
    htmlOutput += '<p>' + clickedListing.properties.name + '</p>';
    htmlOutput += '<p>Bikes Available: ' + clickedListing.properties.num_bikes_available + '</p>';
    if (clickedListing.properties.num_docks_available === null || clickedListing.properties.num_docks_available === undefined) {
        htmlOutput += '<p>No Dock Info</p>';
    } else {
        htmlOutput += '<p>Docks Available: ' + clickedListing.properties.num_docks_available + '</p>';
    }

    var popUps = document.getElementsByClassName('mapboxgl-popup');
    // Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) popUps[0].remove();
    var popup = new mapboxgl.Popup({
            closeOnClick: false
        })
        .setLngLat(clickedListing.geometry.coordinates)
        .setHTML(htmlOutput)
        //    '<h3>' + clickedListing.properties.system_id + '</h3><p>' + clickedListing.properties.name + '</p><p>Bikes Available: ' + clickedListing.properties.num_bikes_available + '</p><p>Docks Available: ' + clickedListing.properties.num_docks_available + '</p>'




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
    style: 'mapbox://styles/mattcoppola/cjncdq5cp0k7r2rqjy96nfxv3',
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
    let coord = (ev.result.geometry);
    if (COORD === coord) {
        //        console.log(COORD, coord);
    } else {
        removeBikeLayers();
        removeBusLayers();
        //        console.log(coord);
        let long = coord.coordinates[0];
        let lat = coord.coordinates[1];
        COORD = coord;
        $('.mapboxgl-ctrl-geocoder input').val('');
        getBusData(lat, long, displayBusAPI);
        getBikeData(lat, long, displayBikeAPI);
    }
});


// get current position lat and longitude

let options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

function success(pos) {
    let crd = pos.coords;
    //    console.log('Your current position is:');
    //    console.log(`Latitude : ${crd.latitude}`);
    //    console.log(`Longitude: ${crd.longitude}`);
    //    console.log(`More or less ${crd.accuracy} meters.`);
    currentLat = crd.latitude;
    currentLong = crd.longitude;
}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

function removeBikeLayers() {
    if (map.getLayer(bikeLayer)) {
        map.removeLayer(bikeLayer);
    };
    if (map.getSource(bikeLayer)) {
        map.removeSource(bikeLayer);
    };
    if (map.getLayer('route')) {
        map.removeLayer('route');
    };
    if (map.getSource('route')) {
        map.removeSource('route');
    };
    if (map.getLayer('start')) {
        map.removeLayer('start');
    };
    if (map.getSource('start')) {
        map.removeSource('start');
    };
    if (map.getLayer('end')) {
        map.removeLayer('end');
    };
    if (map.getSource('end')) {
        map.removeSource('end');
    };
}

function removeBusLayers() {
    if (map.getLayer(busLayer)) {
        map.removeLayer(busLayer);
    };
    if (map.getSource(busLayer)) {
        map.removeSource(busLayer);
    };
    if (map.getSource('route')) {
        map.removeSource('route');
    };
    if (map.getLayer('start')) {
        map.removeLayer('start');
    };
    if (map.getSource('start')) {
        map.removeSource('start');
    };
    if (map.getLayer('end')) {
        map.removeLayer('end');
    };
    if (map.getSource('end')) {
        map.removeSource('end');
    };
}

navigator.geolocation.getCurrentPosition(success, error, options);

/***************************************************************************/
//***** Directions Functions - WORK IN PROGRESS - NOT FULLY FUNCTIONAL *****
/***************************************************************************/

//$('.listings').on('click', '.get-directions a', function () {
//    let Coords = $(this, 'data-id').data()
//    startCoord = Object.values(Coords).toString().split(',');
//    $('#directions').css('visibility', 'visible');
//});
//
//var directions = new MapboxGeocoder({
//    accessToken: mapboxgl.accessToken
//});
//
//document.getElementById('directions').appendChild(directions.onAdd(map));
//
//
//directions.on('result', function (ev) {
//    let directionsCoord = (ev.result.geometry.coordinates);
//    if (DIRECTIONSCOORD === directionsCoord) {
//        console.log('first directions catch', DIRECTIONSCOORD, directionsCoord);
//    } else {
//        DIRECTIONSCOORD = directionsCoord;
//        getRoute(startCoord, directionsCoord);
//        $('.mapboxgl-ctrl-geocoder input').val('');
//        $('.listings').css('visibility', 'hidden');
//        $('.directions').hide();
//    }
//});
//
//function getRoute(startCoord, directionsCoord) {
//    let start = startCoord;
//    let end = directionsCoord;
//    let directionsRequest = 'https://api.mapbox.com/directions/v5/mapbox/cycling/' + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;
//    $.ajax({
//        method: 'GET',
//        url: directionsRequest,
//    }).done(function (data) {
//        let route = data.routes[0].geometry;
//        map.addLayer({
//            id: 'route',
//            type: 'line',
//            source: {
//                type: 'geojson',
//                data: {
//                    type: 'Feature',
//                    geometry: route
//                }
//            },
//            paint: {
//                'line-width': 2
//            }
//        });
//        map.addLayer({
//            id: 'start',
//            type: 'circle',
//            source: {
//                type: 'geojson',
//                data: {
//                    type: 'Feature',
//                    geometry: {
//                        type: 'Point',
//                        coordinates: start
//                    }
//                }
//            }
//        });
//        map.addLayer({
//            id: 'end',
//            type: 'circle',
//            source: {
//                type: 'geojson',
//                data: {
//                    type: 'Feature',
//                    geometry: {
//                        type: 'Point',
//                        coordinates: end
//                    }
//                }
//            }
//        });
//        let instructions = document.getElementById('instructions');
//        let steps = data.routes[0].legs[0].steps;
//        steps.forEach(function (step) {
//            instructions.insertAdjacentHTML('beforeend', '<p>' + step.maneuver.instruction + '</p>');
//        });
//    });
//
//    $('#directions').css('visibility', 'hidden');
//    $('#instructions').css('visibility', 'visible');
//    $(".reset").css('top', '90%');
//}
