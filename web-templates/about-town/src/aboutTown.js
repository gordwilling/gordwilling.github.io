import {currentPosition, initMapsApi, geocodingReverseLookup} from "../../lib/geolocation.js";
import {fetchApiKey} from "../../lib/geolocationApiKey.js";
import {info} from "../../lib/logging.js";

function initLocation() {
    const near = document.getElementById("near")

    fetchApiKey()
        .then(initMapsApi)
        .then(currentPosition)
        .then(coords => {
            document.getElementById("latitude").value = coords.latitude
            document.getElementById("longitude").value = coords.longitude
            return geocodingReverseLookup(coords.latitude, coords.longitude)
        })
        .then(address => {
            document.getElementById("address").value = address
            near.innerHTML = `Near ${address}`
        })
        .catch(info)
}

window.onload = initLocation
