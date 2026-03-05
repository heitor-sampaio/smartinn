const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://actions.google.com/sounds/v1/alarms/pop_up_notification.ogg';
const dest = path.join(__dirname, '..', 'public', 'notification.mp3');

const file = fs.createWriteStream(dest);
https.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
        file.close();
        console.log('Audio file downloaded.');
    });
}).on('error', function (err) {
    fs.unlink(dest, () => { });
    console.error(err.message);
});
