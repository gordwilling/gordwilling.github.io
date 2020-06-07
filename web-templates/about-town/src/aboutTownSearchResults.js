import {directionsURI, distanceBetween, geocodingReverseLookup, initMapsApi, mapURI} from "../../lib/geolocation.js";
import {isBlank, isDefined, nonBlank, notDefined} from "../../lib/valueSafety.js";
import {readResponse, verifyStatus} from "../../lib/download.js";
import {fetchApiKey} from "../../lib/geolocationApiKey.js";
import {createRow} from "./shopifyTemplate.js";

fetchApiKey().then(initMapsApi).then(() => {

    let searchData = undefined

    class SearchResultsReadyEvent extends CustomEvent {
        constructor(dataSet) {
            super('search-results-ready', {
                detail: {
                    dataSet: dataSet
                }
            });
        }
    }

    function overlayImage(image, idOfOverlayTarget) {
        const img = document.createElement("img")
        const overlayTarget = document.getElementById(idOfOverlayTarget)
        const div = document.getElementById("overlay")
        if (div.innerHTML !== "") {
            div.innerHTML = ""
        }

        div.style.setProperty("position", "fixed")
        div.style.setProperty("top", `${overlayTarget.getBoundingClientRect().top}px`)
        div.style.setProperty("left", `${overlayTarget.getBoundingClientRect().left}px`)
        div.style.setProperty("z-index", "1000")
        div.appendChild(img)

        img.src = image.src
        img.height = overlayTarget.height

        const closeOverlay = () => div.innerHTML = ""
        document.addEventListener('click', closeOverlay, {capture: true})
        document.addEventListener('scroll', closeOverlay)
    }

    function selectBanner(event) {
        const banner = document.getElementById("banner")
        const searchResults = document.getElementById("search-results")

        if (event.type === 'scroll') {
            let bannerClass = banner.classList.contains('banner-large')
                ? 'banner-large'
                : 'banner-small'

            const largeBannerHeight = 150
            const smallBannerHeight = 67

            if (window.scrollY <= largeBannerHeight) {
                if (bannerClass === "banner-small") {
                    banner.classList.remove("banner-small")
                    banner.classList.add("banner-large")
                    banner.style.setProperty("top", "0")
                    searchResults.style.setProperty("margin-top", "0")
                }
            } else if (largeBannerHeight < window.scrollY < largeBannerHeight + smallBannerHeight) {
                if (bannerClass === "banner-large") {
                    banner.classList.remove("banner-large")
                    banner.classList.add("banner-small")
                    banner.style.setProperty("top", `-${smallBannerHeight}px`)
                    searchResults.style.setProperty("margin-top", `${window.scrollY}px`)
                }
                const bannerTop = Math.min(0, window.scrollY - largeBannerHeight - smallBannerHeight)
                banner.style.setProperty("top", `${bannerTop}px`)
            }
        }
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

    function uniqueIdFor(store) {
        const storeCoords = {
            latitude: store.latitude,
            longitude: store.longitude
        }
        return JSON.stringify(storeCoords)
    }

    function uniqueStoresIn(dataWithMatchWeights) {
        const uniqueStores = new Map()
        for (const entryWithMatchWeight of dataWithMatchWeights) {
            const entry = entryWithMatchWeight[0]
            uniqueStores.set(uniqueIdFor(entry.store), entry.store)
        }
        return uniqueStores
    }

    function fetchUserDataForTemplates(dataWithMatchWeights) {
        const userCoords = currentUserCoords()
        const uniqueStoresMap = uniqueStoresIn(dataWithMatchWeights)
        const storeDistancePromises = []
        const storeDistanceMap = new Map()

        for (const storeCoords of uniqueStoresMap.keys()) {
            storeDistancePromises.push(distanceBetween(userCoords, JSON.parse(storeCoords))
                .then(distanceInMetres => {
                    const distanceInKm = (distanceInMetres / 1000).toFixed(2)
                    storeDistanceMap.set(storeCoords, {
                        magnitude: distanceInKm,
                        units: "km"
                    })
                })
                .catch(_ => {
                    storeDistanceMap.set(storeCoords, {
                        magnitude: "?",
                        units: "km"
                    })
                })
            )
        }
        return Promise.all(storeDistancePromises)
            .then(() => {
                for (const entryWithMatchWeight of dataWithMatchWeights) {
                    const entry = entryWithMatchWeight[0]
                    const storeCoords = {
                        latitude: entry.store.latitude,
                        longitude: entry.store.longitude
                    }
                    entry.store.mapImageURL = mapImageURLFor(userCoords, storeCoords)
                    entry.store.directionsURL = directionsURI(userCoords, storeCoords)
                    entry.store.distance = storeDistanceMap.get(uniqueIdFor(entry.store))
                }
            })
    }

    function showSearchResults(searchResultsReadyEvent) {
        if (searchResultsReadyEvent.detail.dataSet) {
            searchData = searchResultsReadyEvent
            const data = searchResultsReadyEvent.detail.dataSet
            const searchTerms = document.getElementById("searchTermsInput").value
            const keywords = searchTerms.toLowerCase().split(/[\s\-]/)
            if (nonBlank(searchTerms)) {
                const filteredDataWithMatchWeights = data.map(record => {
                        const matches = keywords
                            .map(keyword => {

                                // optimization: we can also look for exact keywords matches against each
                                // word in the title... maybe weigh at 200 - 500

                                if (record.title.toLowerCase().includes(keyword)) {
                                    return [100, true]
                                }
                                if (record.description.toLowerCase().includes(keyword)) {
                                    return [20, true]
                                }
                                for (const spec of record.specs) {
                                    if (spec.toLowerCase().includes(keyword)) {
                                        return [20, true]
                                    }
                                }
                                return [0, false]
                            })
                            .reduce((x, y) => [x[0] + y[0], x[1] && y[1]])
                        return [record, matches]
                    }
                ).filter(recordWithMatchWeights => {
                    return recordWithMatchWeights[1][1]
                })

                fetchUserDataForTemplates(filteredDataWithMatchWeights)
                    .then(() => {
                            const filteredSortedResults = filteredDataWithMatchWeights
                                .sort((x, y) => {
                                    // sort by best match, then distance (details requires lots of experimentation and ultimately should be configurable)
                                    const xRecord = x[0]
                                    const yRecord = y[0]
                                    const xScore = x[1][0]
                                    const yScore = y[1][0]
                                    let score = yScore - xScore
                                    if (score === 0) {
                                        // this could have a weight too, like 10 points per km distance, here for example
                                        score = xRecord.store.distance.magnitude - yRecord.store.distance.magnitude
                                    }
                                    return score
                                })
                                .map(filteredRecordWithMatchWeight => filteredRecordWithMatchWeight[0])
                            const searchResultsDiv = document.getElementById("search-results")
                            searchResultsDiv.innerHTML = ""
                            for (const row of filteredSortedResults) {
                                searchResultsDiv.innerHTML += createRow(row)
                            }
                        }
                    ).catch(console.log)
            }
        }
    }

    function search() {
        const userCoords = currentUserCoords()
        if (isBlank(userCoords.latitude) || isBlank(userCoords.longitude)) {
            showAddressElement("addressInput")
        } else {
            document.body.addEventListener('search-results-ready', showSearchResults)
            if (notDefined(searchData)) {
                const dataLocations = {
                    searchResults: "./data/media/catalog.json"
                }
                fetch(dataLocations.searchResults, {mode: "same-origin"})
                    .then(verifyStatus)
                    .then(readResponse)
                    .then(data => document.body.dispatchEvent(new SearchResultsReadyEvent(data)))
                    .catch(console.log)
            } else {
                document.body.dispatchEvent(new SearchResultsReadyEvent(searchData.detail.dataSet))
            }
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

    window.onscroll = selectBanner
    window.overlayImage = overlayImage
    window.editaddressInput = editaddress
    window.commitEditaddressInput = commitEditaddress
    window.discardEditaddressInput = discardEditaddress
    window.search = search
    window.onload = load
})

