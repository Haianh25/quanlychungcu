const isValidEmail = (email) => {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const isStrongPassword = (password) => {
    if (!password) return false;
    if (password.length < 6) return false;
    return true;
};

const isValidPhoneNumber = (phone) => {
    if (!phone) return false;
    const regex = /^0\d{9}$/;
    return regex.test(phone);
};

module.exports = {
    isValidEmail,
    isStrongPassword,
    isValidPhoneNumber
};