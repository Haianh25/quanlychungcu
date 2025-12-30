function validateVehicleQuota(currentActiveCount, currentPendingCount, maxAllowed, vehicleType) {
    const active = parseInt(currentActiveCount) || 0;
    const pending = parseInt(currentPendingCount) || 0;
    const max = (maxAllowed === null || maxAllowed === undefined) ? 0 : parseInt(maxAllowed);
    const totalVehicles = active + pending;
    if (totalVehicles >= max) {
        return {
            isValid: false,
            message: `Limit reached for Room Type: Max ${max} ${vehicleType}(s) allowed.`
        };
    }

    return { isValid: true, message: null };
}

module.exports = { validateVehicleQuota };