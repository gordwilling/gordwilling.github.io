
export function initMapsApi(key) {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.defer = true
    document.head.append(script)
    mapURI = initMapURI(key)
}

const initMapURI = key => () => {
    return ""
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
        resolve({
            address: "Mock Address",
            coords: {
                latitude: 43.0,
                longitude: -79.0
            }
        })
    })
}

export function geocodingReverseLookup(lat, lon) {
    const location = new google.maps.LatLng(lat, lon)
    const geocoder = new google.maps.Geocoder;
    return new Promise((resolve, reject) => {
        resolve("8 The Mock Address")
    })
}

export function distanceBetween(coordsA, coordsB) {
    const origin = new google.maps.LatLng(coordsA.latitude, coordsA.longitude);
    const destination = new google.maps.LatLng(coordsB.latitude, coordsB.longitude);
    const service = new google.maps.DistanceMatrixService();
    return new Promise((resolve, reject) => {
        resolve(4200)
    })
}
