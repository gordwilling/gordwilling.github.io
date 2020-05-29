import {geocodingReverseLookup, geocodingLookup} from "../../lib/geolocation.js";
import {isBlank, isDefined, nonBlank} from "../../lib/valueSafety.js";

function showLocationElement(visibleElementId) {
    const locationLoading = document.getElementById("locationLoading")
    const locationLoaded = document.getElementById("locationLoaded")
    const locationEditing = document.getElementById("locationEditing")

    switch (visibleElementId) {
        case "locationLoading":
            locationLoading.style.removeProperty("display")
            locationLoaded.style.display = "none"
            locationEditing.style.display = "none"
            break;
        case "locationLoaded":
            locationLoading.style.display = "none"
            locationLoaded.style.removeProperty("display")
            locationEditing.style.display = "none"
            break;
        case "locationInput":
            locationLoading.style.display = "none"
            locationLoaded.style.display = "none"
            locationEditing.style.removeProperty("display")
            break;
        default:
            throw "Unhandled case in switch"
    }
}

function editLocationTerms() {
    const locationTermsInput = document.getElementById("locationTermsInput")
    showLocationElement("locationInput")
    locationTermsInput.value = ""
    locationTermsInput.focus()
}

function commitEditLocationTerms() {
    const locationTermsInput = document.getElementById("locationTermsInput")
    const locationTermsView = document.getElementById("locationTermsView")
    const latitudeInput = document.getElementById("latitude")
    const longitudeInput = document.getElementById("longitude")
    const queryString = encodeURI(locationTermsInput.value)
    if (nonBlank(queryString)) {
        geocodingLookup(queryString, json => {
            const matches = JSON.parse(json)
            const node = matches.filter(node => node["osm_type"] === "node").shift()
            if (isDefined(node)) {
                latitudeInput.value = node["lat"]
                longitudeInput.value = node["lon"]
                locationTermsInput.value = node["display_name"]
                locationTermsView.value = limitLength(node["display_name"])
                showLocationElement("locationLoaded")
            } else {
                locationTermsInput.value = "We had trouble finding that"
                locationTermsInput.select()
            }
        })
    }
}

function discardEditLocationTerms() {
    const locationTermsInput = document.getElementById("locationTermsInput")
    const latitudeInput = document.getElementById("latitude")
    const longitudeInput = document.getElementById("longitude")
    if (nonBlank(latitudeInput.value) && nonBlank(longitudeInput.value)) {
        showLocationElement("locationLoaded")
    }
    else {
        locationTermsInput.value = "Help us Help you..."
        locationTermsInput.select()
    }

}

function lookupLocationName(searchCoords) {
    geocodingReverseLookup(searchCoords.latitude, searchCoords.longitude, json => {
        const details = JSON.parse(json)
        const locationName = details["display_name"]
        const locationTermsInput = document.getElementById("locationTermsInput")
        const locationTermsView = document.getElementById("locationTermsView")

        locationTermsInput.value = locationName
        locationTermsView.value = limitLength(locationName)
        showLocationElement("locationLoaded")
    })
}

function limitLength(displayName, limit=40) {
    const terms = displayName.split(/[,\s]/).filter(nonBlank)
    const uniqueTerms = new Set(terms)
    let truncatedTerms = ""
    for (let i = 0; i < terms.length; i++) {
        if (uniqueTerms.has(terms[i])) {
            if (truncatedTerms.length + terms[i].length < limit) {
                truncatedTerms += terms[i] + " "
                uniqueTerms.delete(terms[i])
            } else {
                break
            }
        }
    }
    return truncatedTerms.trimEnd()
}

function load() {
    const requestParams = new URL(location.href).searchParams
    const searchTerms = requestParams.get("searchTerms")
    const searchCoords = {
        latitude: requestParams.get("latitude"),
        longitude: requestParams.get("longitude")
    }

    document.getElementById("searchTermsInput").value = searchTerms
    document.getElementById("latitude").value = searchCoords.latitude
    document.getElementById("longitude").value = searchCoords.longitude

    if (isBlank(searchCoords.latitude) || isBlank(searchCoords.longitude)) {
        showLocationElement("locationInput")
    } else if (searchCoords.latitude && searchCoords.longitude) {
        showLocationElement("locationLoading");
        lookupLocationName(searchCoords);
    }

    const locationTermsInput = document.getElementById("locationTermsInput")
    locationTermsInput.addEventListener("keydown", (e) => {
        if (e.code === "Enter") {
            commitEditLocationTerms()
        } else if (e.code === "Escape") {
            console.log("pressed Escape")
            discardEditLocationTerms()
        }
    })
    locationTermsInput.addEventListener("focusout", () => {
        console.log("lost focus")
        discardEditLocationTerms()
    })
}

window.editLocationTerms = editLocationTerms
window.commitEditLocationTerms = commitEditLocationTerms
window.discardEditLocationTerms = discardEditLocationTerms
window.onload = load
