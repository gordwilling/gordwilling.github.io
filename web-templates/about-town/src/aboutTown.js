import {currentPosition, initMapsApi, geocodingReverseLookup} from "../../lib/geolocation.js";
import {fetchApiKey} from "../../lib/geolocationApiKey.js";

function initLocation() {
    const yourLocation = document.getElementById("your-location")

    fetchApiKey()
        .then(initMapsApi)
        .then(currentPosition)
        .then(coords => {
            document.getElementById("latitude").value = coords.latitude
            document.getElementById("longitude").value = coords.longitude
            return geocodingReverseLookup(coords.latitude, coords.longitude)
        })
        .then(locationName => {
            yourLocation.innerHTML = `Searching Near ${locationName}`
        })
        .catch(
            () => yourLocation.innerHTML = "We can't find you! Marco..."
        )
}

window.onload = initLocation
