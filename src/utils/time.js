/**
 * Utility for handling time in WIB (Western Indonesia Time / UTC+7)
 */

function getWIBTime() {
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    return new Date(now.getTime() + wibOffset);
}

function getWIBDateString() {
    return getWIBTime().toISOString().split('T')[0];
}

function getWIBISOString() {
    return getWIBTime().toISOString();
}

/**
 * Returns the SQLite modifier string for WIB time conversion from UTC
 */
const WIB_MODIFIER = '+7 hours';

module.exports = {
    getWIBTime,
    getWIBDateString,
    getWIBISOString,
    WIB_MODIFIER
};
