export function notDefined(value) {
    return typeof value === 'undefined';
}

export function isDefined(value) {
    return typeof value !== 'undefined';
}

export function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

export function nonBlank(str) {
    return !isBlank(str)
}
