const bcrypt = require('bcryptjs');

const password = 'Admin@12345';

const generateHash = async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('Origin Password:', password);
    console.log('New Hash:', hash);
};

generateHash();