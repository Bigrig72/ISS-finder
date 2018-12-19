'use strict';

let issCoords = {};
let userLoc = {};
let locationCoords = {};
let issMarker;
let issCirc;
let mymap;
let range = 0;

// Get ISS coordinates then create map with ISS marker
$.ajax({
  url: '/issLoc',
  method: 'GET',
})
  .then(issLoc => {
    issCoords.lat = issLoc[0].issLat;
    issCoords.lng = issLoc[0].issLng;

    mymap = L.map('map').setView([issCoords.lat, issCoords.lng], 2);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWJnb3NlY28iLCJhIjoiY2pwdTNoZGh0MGNvejQybWhxMThsNXc0OCJ9.LShDX_H_VSZYAOy_vQD-nQ', {
      maxZoom: 18,
      id: 'mapbox.streets'
    }).addTo(mymap);
    issMarker = L.marker([issCoords.lat, issCoords.lng]).addTo(mymap);
    issCirc = L.circle([issCoords.lat, issCoords.lng], {radius: 2270000}).addTo(mymap);
    issMapUpdate();
  }).catch(error => console.error(error));
console.log('ISS coords: ', issCoords);

// Get user coordinates and formatted address
$.ajax({
  url: '/userLoc',
  method: 'GET'
})
  .then(location => {
    userLoc.lat = location.lat;
    userLoc.lng = location.lng;
    let address = getUserAddress(location);
    userLoc.address = address;

    range = checkRange(userLoc.lat, userLoc.lng);

    if (range <= 2270000) {
      $('.mid').text(`Your current location at ${userLoc.address} is currenty in viewable range. Go grab a telescope and look for it!`);
    } else {
      $('#mid-ul').text(`You current location at ${userLoc.address} is not in viewable range of the ISS. The next pass will be on:`);
      $.getJSON(`http://api.open-notify.org/iss-pass.json?lat=${userLoc.lat}&lon=${userLoc.lng}&n=5&callback=?`, function(data) {
        data.response.forEach(d => {
          let date = new Date(d.risetime*1000);
          $('#mid-ul').append('<li>' + date.toString() + '</li>');
        });
      });
      console.log('user not in range', range);
    }

  }).catch(error => console.error(error));
console.log('user location: ', userLoc);

// Updates the map every 5 seconds
function issMapUpdate() {
  $.ajax({
    url: '/issLoc',
    method: 'GET',
  })
    .then(issLoc => {
      issCoords.lat = issLoc[0].issLat;
      issCoords.lng = issLoc[0].issLng;

      issMarker.setLatLng([issCoords.lat, issCoords.lng]);
      issCirc.setLatLng([issCoords.lat, issCoords.lng]);

    }).catch(error => console.error(error));
  setTimeout(issMapUpdate, 5000);
}

function getUserAddress(location) {
  $.get('/userAddress', {data: location})
    .then(address => {
      console.log('user address', address);
      userLoc.address = address;
      return address;
    }).catch(error => console.error(error));
}

// On search submit, get location data, measure distance to ISS, and show results if visible or not
$('#searchForm').on('submit', getSearchLoc);

function getSearchLoc(event) {
  event.preventDefault();
  let input = $('#inputLoc').val();
  console.log('input: ', input);

  $.ajax({
    url: '/issLoc',
    method: 'GET',
  })
    .then(issLoc => {
      issCoords.lat = issLoc[0].issLat;
      issCoords.lng = issLoc[0].issLng;

      issMarker.setLatLng([issCoords.lat, issCoords.lng]);
      issCirc.setLatLng([issCoords.lat, issCoords.lng]);

    }).catch(error => console.error(error));

  $.ajax({
    url: '/search',
    method: 'GET',
    data: {data: input}
  })
    .then(location => {
      locationCoords.lat = location.lat;
      locationCoords.lng = location.lng;
      let searchMarker = L.marker([location.lat, location.lng]).addTo(mymap);
      mymap.flyTo([location.lat, location.lng], 3);

      let range = checkRange(location.lat, location.lng);

      if (range <= 2270000) {
        console.log('search is in range', range);
      } else {
        console.log('search not in range', range);
      }
    }).catch(error => console.error(error));
}

function checkRange(lat, lng) {
  let pointA = new google.maps.LatLng(issCoords.lat, issCoords.lng);
  let pointB = new google.maps.LatLng(lat, lng);

  let distance = Math.floor(google.maps.geometry.spherical.computeDistanceBetween(pointA, pointB));
  console.log('distance: ', distance);
  return distance;
}
