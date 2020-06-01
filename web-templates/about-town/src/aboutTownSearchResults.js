import {distanceBetween, geocodingReverseLookup, initMapsApi, staticMapURI} from "../../lib/geolocation.js";
import {isBlank, isDefined, nonBlank} from "../../lib/valueSafety.js";
import {downloadTemplateData} from "../../lib/download.js";
import {fillTemplateData} from "../../lib/templates.js";
import {fetchApiKey} from "../../lib/geolocationApiKey.js";

fetchApiKey().then(initMapsApi).then(() => {

    function showAddressElement(visibleElementId) {
        const addressLoaded = document.getElementById("addressLoaded")
        const addressEditing = document.getElementById("addressEditing")

        switch (visibleElementId) {
            case "addressLoaded":
                addressLoaded.style.removeProperty("display")
                addressEditing.style.display = "none"
                break;
            case "addressInput":
                addressLoaded.style.display = "none"
                addressEditing.style.removeProperty("display")
                break;
            default:
                throw "Unhandled case in switch"
        }
    }

    function editaddressInput() {
        const addressInput = document.getElementById("addressInput")
        showAddressElement("addressInput")
        addressInput.value = ""
        addressInput.focus()
    }

    function commitEditaddressInput(place) {
        const addressInput = document.getElementById("addressInput")
        const addressView = document.getElementById("addressView")
        const latitudeInput = document.getElementById("latitude")
        const longitudeInput = document.getElementById("longitude")

        console.log(place)
        if (isDefined(place)) {
            latitudeInput.value = place["geometry"].location.lat()
            longitudeInput.value = place["geometry"].location.lng()
            addressInput.value = place["formatted_address"]
            addressView.value = place["formatted_address"]
            showAddressElement("addressLoaded")
        }
    }

    function discardEditaddressInput() {
        console.log("what happened")
        const addressInput = document.getElementById("addressInput")
        const latitudeInput = document.getElementById("latitude")
        const longitudeInput = document.getElementById("longitude")
        if (nonBlank(latitudeInput.value) && nonBlank(longitudeInput.value)) {
            showAddressElement("addressLoaded")
        } else {
            addressInput.value = "Help us Help you..."
            addressInput.select()
        }
    }

    function lookupAddress(searchCoords) {
        geocodingReverseLookup(
            parseFloat(searchCoords.latitude),
            parseFloat(searchCoords.longitude)
        ).then(address => {
            const addressInput = document.getElementById("addressInput")
            const addressView = document.getElementById("addressView")

            addressInput.value = address
            addressView.value = address
            showAddressElement("addressLoaded")
        })
    }

    function mapImageURLFor(userCoords, storeCoords) {
        return `${staticMapURI()}&markers=size:mid|color:blue|${userCoords.latitude},${userCoords.longitude}&markers=size:mid|color:red|${storeCoords.latitude},${storeCoords.longitude}`
    }

    function currentUserCoords() {
        return {
            latitude: parseFloat(document.getElementById("latitude").value),
            longitude: parseFloat(document.getElementById("longitude").value)
        }
    }

    function fetchUserDataForTemplates(data) {
        const userCoords = currentUserCoords()
        const distancePromises = []
        for (const entry of data) {
            const storeCoords = {
                latitude: entry.latitude,
                longitude: entry.longitude
            }
            entry.mapImageURL = mapImageURLFor(userCoords, storeCoords)
            distancePromises.push(distanceBetween(userCoords, storeCoords)
                .then(distanceInMetres => {
                    const distanceInKm = (distanceInMetres / 1000).toFixed(2)
                    entry.distance = {
                        magnitude: distanceInKm,
                        units: "km"
                    }
                })
            )
        }
        return distancePromises;
    }

    function fillSearchResultTemplates(dataReadyEvent) {
        if (dataReadyEvent.detail.dataSetName === 'searchResults') {
            const data = dataReadyEvent.detail.dataSet
            const distancePromises = fetchUserDataForTemplates(data);
            Promise.all(distancePromises).then(() => {
                fillTemplateData(dataReadyEvent)
            })
        }
    }

    function search() {
        const userCoords = currentUserCoords()
        if (isBlank(userCoords.latitude) || isBlank(userCoords.longitude)) {
            showAddressElement("addressInput")
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
        const address = requestParams.get("address")
        const userCoords = {
            latitude: requestParams.get("latitude"),
            longitude: requestParams.get("longitude")
        }

        document.getElementById("searchTermsInput").value = searchTerms
        document.getElementById("latitude").value = userCoords.latitude
        document.getElementById("longitude").value = userCoords.longitude
        document.getElementById("addressView").value = address

        if (isBlank(userCoords.latitude) || isBlank(userCoords.longitude)) {
            showAddressElement("addressInput")
        } else if (isBlank(address)) {
            lookupAddress(userCoords);
        } else {
            showAddressElement("addressLoaded")
        }

        const addressInput = document.getElementById("addressInput")
        addressInput.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                commitEditaddressInput()
            } else if (e.code === "Escape") {
                discardEditaddressInput()
            }
        })

        const currentLocation = new google.maps.LatLng(
            parseFloat(userCoords.latitude),
            parseFloat(userCoords.longitude))

        const options = {
            location: currentLocation,
            origin: currentLocation,
            types: ["geocode"],
            fields: ["formatted_address", "geometry.location"]
        }
        const autocomplete = new google.maps.places.Autocomplete(addressInput, options)
        autocomplete.addListener('place_changed', () => {
            console.log("place changed")
            commitEditaddressInput(autocomplete.getPlace())
        })
        search()
    }

    window.editaddressInput = editaddressInput
    window.commitEditaddressInput = commitEditaddressInput
    window.discardEditaddressInput = discardEditaddressInput
    window.search = search
    window.onload = load
})

