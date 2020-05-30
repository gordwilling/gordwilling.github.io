import {geocodingReverseLookup, geocodingLookup, distanceBetween, staticMapURI} from "../../lib/geolocation.js";
import {isBlank, isDefined, nonBlank} from "../../lib/valueSafety.js";
import {downloadTemplateData} from "../../lib/download.js";
import {fillTemplateData} from "../../lib/templates.js";
import {info} from "../../lib/logging.js";

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
        geocodingLookup(queryString, async json => {

            // locationIQ limits us to 2 requests per second :(
            await new Promise(r => setTimeout(r, 1100))

            const matches = JSON.parse(json)
            const node = matches.filter(node => node["osm_type"] === "node").shift()
            if (isDefined(node)) {
                latitudeInput.value = node["lat"]
                longitudeInput.value = node["lon"]
                locationTermsInput.value = node["display_name"]
                locationTermsView.value = limitLength(node["display_name"], 40)

                console.log(
                    `"latitude": "${latitudeInput.value}",
                    "longitude": "${longitudeInput.value}"`
                )

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
    } else {
        locationTermsInput.value = "Help us Help you..."
        locationTermsInput.select()
    }

}

function lookupLocationName(searchCoords) {
    geocodingReverseLookup(searchCoords.latitude, searchCoords.longitude, async json => {

        // locationIQ limits us to 2 requests per second :(
        await new Promise(r => setTimeout(r, 1100))

        const details = JSON.parse(json)
        const locationName = details["display_name"]
        const locationTermsInput = document.getElementById("locationTermsInput")
        const locationTermsView = document.getElementById("locationTermsView")

        locationTermsInput.value = locationName
        locationTermsView.value = limitLength(locationName, 40)
        showLocationElement("locationLoaded")
    })
}

function limitLength(displayName, limit) {
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

function mapImageURLFor(userCoords, storeCoords) {
    return `${staticMapURI}&markers=icon:small-purple-cutout|${userCoords.latitude},${userCoords.longitude}&markers=icon:small-red-cutout|${storeCoords.latitude},${storeCoords.longitude}`
}

function currentUserCoords() {
    return {
        latitude: document.getElementById("latitude").value,
        longitude: document.getElementById("longitude").value
    }
}

function fillSearchResultTemplates(dataReadyEvent) {
    if (dataReadyEvent.detail.dataSetName === 'searchResults') {
        const data = dataReadyEvent.detail.dataSet
        info("adding user-specific to data to template data")
        const userCoords = currentUserCoords()
        const distancePromises = []
        for (const entry of data) {
            const storeCoords = {
                latitude: entry.latitude,
                longitude: entry.longitude
            }
            entry.mapImageURL = mapImageURLFor(userCoords, storeCoords)
            distancePromises.push(distanceBetween(userCoords, storeCoords).then(async json => {

                    // locationIQ limits us to 2 requests per second :(
                    await new Promise(r => setTimeout(r, 1100))

                    const response = JSON.parse(json)
                    if (response.code === "Ok") {
                        const distanceInMetres = response["distances"][0][1]
                        const distanceInKm = (distanceInMetres / 1000).toFixed(2)
                        entry.distance = {
                            magnitude: distanceInKm,
                            units: "km"
                        }
                        return Promise.resolve()
                    } else {
                        return Promise.reject(json)
                    }
                })
            )
        }
        Promise.all(distancePromises).then(() => {
            fillTemplateData(dataReadyEvent)
        })
    }
}

function search() {
    const userCoords = currentUserCoords()
    if (isBlank(userCoords.latitude) || isBlank(userCoords.longitude)) {
        showLocationElement("locationInput")
    } else {
        const dataLocations = {
            searchResults: "./data/listItem.json"
        }
        const searchResultDiv = document.querySelector("[data-template]")
        searchResultDiv.innerHTML = ""
        downloadTemplateData([searchResultDiv], dataLocations, fillSearchResultTemplates)
    }
}

function load() {
    const requestParams = new URL(location.href).searchParams
    const searchTerms = requestParams.get("searchTerms")
    const userCoords = {
        latitude: requestParams.get("latitude"),
        longitude: requestParams.get("longitude")
    }

    document.getElementById("searchTermsInput").value = searchTerms
    document.getElementById("latitude").value = userCoords.latitude
    document.getElementById("longitude").value = userCoords.longitude

    if (isBlank(userCoords.latitude) || isBlank(userCoords.longitude)) {
        showLocationElement("locationInput")
    } else if (userCoords.latitude && userCoords.longitude) {
        showLocationElement("locationLoading");
        lookupLocationName(userCoords);
    }

    const locationTermsInput = document.getElementById("locationTermsInput")
    locationTermsInput.addEventListener("keydown", (e) => {
        if (e.code === "Enter") {
            commitEditLocationTerms()
        } else if (e.code === "Escape") {
            discardEditLocationTerms()
        }
    })
    locationTermsInput.addEventListener("focusout", () => {
        discardEditLocationTerms()
    })
    search()
}

window.editLocationTerms = editLocationTerms
window.commitEditLocationTerms = commitEditLocationTerms
window.discardEditLocationTerms = discardEditLocationTerms
window.search = search
window.onload = load

