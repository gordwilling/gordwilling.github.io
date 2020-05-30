import {BasicHttpRequest} from "./http.js";

export const githubToLocationIQApiToken = "pk.078f360ba5712af8cd4c6ee4fb82c0b2"
export const devToLocationIQApiToken = "pk.5daf8473c483849c31f9a4344a16af55"

export const staticMapURI = `https://maps.locationiq.com/v2/staticmap?key=${devToLocationIQApiToken}&maptype=roadmap&size=320x200`
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
    http.open("GET",`${reverseLookupURI}&showdistance=1&lat=${lat}&lon=${lon}`,true)
    http.send()
}

export function distanceBetween(coordsA, coordsB) {
    const http = new XMLHttpRequest()
    http.open("GET", `https://us1.locationiq.com/v1/matrix/driving/${coordsA.longitude},${coordsA.latitude};${coordsB.longitude},${coordsB.latitude}?key=${devToLocationIQApiToken}&sources=0;0&annotations=distance`, true)
    return new Promise((resolve, reject) => {
        http.send()
        http.onreadystatechange = () => {
            if (http.readyState === 4 && http.status === 200) {
                resolve(http.response)
            }
        }
        http.onabort = http.onerror = http.ontimeout = event => reject(event)
    })
}
