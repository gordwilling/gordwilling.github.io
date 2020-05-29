import {BasicHttpRequest} from "./http.js";

export const githubToLocationIQApiToken = "pk.078f360ba5712af8cd4c6ee4fb82c0b2"
export const devToLocationIQApiToken = "pk.5daf8473c483849c31f9a4344a16af55"

const lookupURI = `https://us1.locationiq.com/v1/search.php?key=${devToLocationIQApiToken}&format=json`
const reverseLookupURI = `https://us1.locationiq.com/v1/reverse.php?key=${devToLocationIQApiToken}&format=json`

export function geocodingLookup(queryString, onSuccess) {
    const http = new BasicHttpRequest()
    http.onSuccess = onSuccess
    http.open("GET",`${lookupURI}&q=${queryString}`,true)
    http.send()
}

export function geocodingReverseLookup(lat, lon, onSuccess) {
    const http = new BasicHttpRequest()
    http.onSuccess = onSuccess
    http.open("GET",`${reverseLookupURI}&lat=${lat}&lon=${lon}`,true)
    console.log(http)
    http.send()
}
