import {mapsApiKey} from "./geolocationApiKey.js";
export const staticMapURI = `https://maps.googleapis.com/maps/api/staticmap?key=${mapsApiKey}&size=320x200`

export function geocodingLookup(queryString) {
    const geocoder = new google.maps.Geocoder;
    return new Promise((resolve, reject) => {
        geocoder.geocode({address: queryString}, (response, status) => {
            if (status === "OK") {
                const item = response.find(location => location.types[0] === "street_address")
                if (item) {
                    const location = item.geometry.location
                    const address = item["formatted_address"]
                    resolve({
                        address: address,
                        coords: {
                            latitude: location.lat(),
                            longitude: location.lng()
                        }
                    })
                } else {
                    reject({status, response})
                }
            } else {
                reject({status, response})
            }
        })
    })
}

export function geocodingReverseLookup(lat, lon) {
    const location = new google.maps.LatLng(lat, lon)
    const geocoder = new google.maps.Geocoder;
    return new Promise((resolve, reject) => {
        geocoder.geocode({location: location}, (response, status) => {
            if (status === "OK") {
                resolve(response[0]["formatted_address"])
            } else {
                reject({status, response})
            }
        })
    })
}

export function distanceBetween(coordsA, coordsB) {
    const origin = new google.maps.LatLng(coordsA.latitude, coordsA.longitude);
    const destination = new google.maps.LatLng(coordsB.latitude, coordsB.longitude);
    const service = new google.maps.DistanceMatrixService();
    return new Promise((resolve, reject) => {
        service.getDistanceMatrix({
            origins: [origin],
            destinations: [destination],
            travelMode: 'DRIVING',
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: true,
            avoidTolls: true,
        }, (response, status) => {
            if (status === "OK") {
                resolve(response.rows[0].elements[0].distance.value)
            } else {
                reject({status, response})
            }
        })
    })
}
