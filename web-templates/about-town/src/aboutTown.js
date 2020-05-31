import {currentPosition, initMapsApi, geocodingReverseLookup} from "../../lib/geolocation.js";
import {fetchApiKey} from "../../lib/geolocationApiKey.js";

function initLocation() {
    const locationAnchor = document.getElementById("location-anchor")

    fetchApiKey()
        .then(initMapsApi)
        .then(currentPosition)
        .then(coords => {
            document.getElementById("latitude").value = coords.latitude
            document.getElementById("longitude").value = coords.longitude
            return geocodingReverseLookup(coords.latitude, coords.longitude)
        })
        .then(locationName => {
            locationAnchor.innerText = locationName
        })
        .catch(
            () => locationAnchor.innerText = "We can't find you! Marco..."
        )
}

window.onload = initLocation
