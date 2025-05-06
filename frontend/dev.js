const open = require("open");
const { exec } = require("child_process");

const PORT = 3000; // Change if needed
exec("next dev", (err, stdout, stderr) => {
    if (err) {
        console.error(`Error starting dev server: ${err}`);
        return;
    }
    console.log(stdout);
});

setTimeout(() => {
    open(`http://localhost:${PORT}`);
}, 3000); // Give some time for the server to start
