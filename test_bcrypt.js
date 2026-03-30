const bcrypt = require('bcrypt');
(async () => {
    try {
        console.log("Starting bcrypt test...");
        const hash = await bcrypt.hash("password123", 10);
        console.log("Hash:", hash);
        const match = await bcrypt.compare("password123", hash);
        console.log("Match:", match);
    } catch (e) {
        console.error("Bcrypt Error:", e);
    }
})();
