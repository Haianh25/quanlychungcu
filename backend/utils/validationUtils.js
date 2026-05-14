const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

const isValidDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
};

module.exports = {
    isValidEmail,
    isStrongPassword,
    isValidPhoneNumber,
    isValidDate
};