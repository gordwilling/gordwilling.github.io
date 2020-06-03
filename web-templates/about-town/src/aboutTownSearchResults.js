import {directionsURI, distanceBetween, geocodingReverseLookup, initMapsApi, mapURI} from "../../lib/mockGeolocation.js";
import {isBlank, isDefined, nonBlank} from "../../lib/valueSafety.js";
import {downloadTemplateData} from "../../lib/download.js";
import {fillTemplateData} from "../../lib/templates.js";
import {fetchApiKey} from "../../lib/geolocationApiKey.js";

fetchApiKey().then(initMapsApi).then(() => {

    function overlayImage(image) {
        const img = document.createElement("img")
        const div = document.getElementById("overlay")
        if (div.innerHTML !== "") {
            div.innerHTML = ""
        }

        div.style.setProperty("position", "absolute")
        div.style.setProperty("z-index", "1000")
        div.style.setProperty("left", "200px")
        div.appendChild(img)

        img.src = image.src
        img.height = window.innerHeight / 2

        const closeOverlay = () => div.innerHTML = ""
        document.addEventListener('click', closeOverlay,{capture: true})
    }

    function setBannerStyle() {

    }

    function showAddressElement(visibleElementId) {
        const addressLoaded = document.getElementById("addressLoaded")
        const addressEditing = document.getElementById("addressEditing")
        const addressInput = document.getElementById("addressInput")

        switch (visibleElementId) {
            case "addressLoaded":
                addressLoaded.style.removeProperty("display")
                addressEditing.style.display = "none"
                break;
            case "addressInput":
                addressLoaded.style.display = "none"
                addressEditing.style.removeProperty("display")
                addressInput.select()
                addressInput.focus()
                break;
            default:
                throw "Unhandled case in switch"
        }
    }

    function editaddress() {
        showAddressElement("addressInput")
    }

    function commitEditaddress(place) {
        const addressInput = document.getElementById("addressInput")
        const addressView = document.getElementById("addressView")
        const latitudeInput = document.getElementById("latitude")
        const longitudeInput = document.getElementById("longitude")
        const searchTermsInput = document.getElementById("searchTermsInput")

        if (isDefined(place)) {
            latitudeInput.value = place["geometry"].location.lat()
            longitudeInput.value = place["geometry"].location.lng()
            addressInput.value = place["formatted_address"]
            addressView.value = place["formatted_address"]
            showAddressElement("addressLoaded")
            searchTermsInput.focus()
        }
    }

    function discardEditaddress() {
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
        return `${mapURI()}&markers=size:mid|color:blue|${userCoords.latitude},${userCoords.longitude}&markers=size:mid|color:red|${storeCoords.latitude},${storeCoords.longitude}`
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
            entry.directionsURL = directionsURI(userCoords, storeCoords)
        }
        return distancePromises;
    }

    function fillSearchResultTemplates(dataReadyEvent) {
        if (dataReadyEvent.detail.dataSetName === 'searchResults') {
            const data = dataReadyEvent.detail.dataSet
            const distancePromises = fetchUserDataForTemplates(data);
            Promise.all(distancePromises).then(() => {
                data.sort((x, y) => {
                    return x.distance.magnitude - y.distance.magnitude
                })
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
        document.getElementById("addressInput").value = address

        if (isBlank(userCoords.latitude) || isBlank(userCoords.longitude)) {
            showAddressElement("addressInput")
        } else if (isBlank(address)) {
            lookupAddress(userCoords);
        } else {
            showAddressElement("addressLoaded")
        }

        const searchTermsInput = document.getElementById("searchTermsInput")
        searchTermsInput.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                search()
            }
        })

        const addressInput = document.getElementById("addressInput")
        addressInput.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                commitEditaddress()
            } else if (e.code === "Escape") {
                discardEditaddress()
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
            commitEditaddress(autocomplete.getPlace())
        })
        search()
    }

    window.overlayImage = overlayImage
    window.editaddressInput = editaddress
    window.commitEditaddressInput = commitEditaddress
    window.discardEditaddressInput = discardEditaddress
    window.search = search
    window.onload = load
})

