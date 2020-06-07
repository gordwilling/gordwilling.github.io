export function initMapsApi(key) {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.defer = true
    document.head.append(script)
    mapURI = initMapURI(key)
}

const initMapURI = key => () => {
    return `https://maps.googleapis.com/maps/api/staticmap?key=${key}&size=200x200`
}

export function mapURI() {
    return "invoke initMapsApi with a valid key first"
}

export function directionsURI(originCoords, destinationCoords) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originCoords.latitude},${originCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}`
}

/**
 * Wraps navigator.getCurrentPosition in a promise
 * @returns {Promise} a Promise resolving to {latitude, longitude}
 */
export function currentPosition() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                }, error => {
                    reject(error)
                }
            )
        } else {
            reject("Location services is not enabled")
        }
    })
}

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
            avoidHighways: false,
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
