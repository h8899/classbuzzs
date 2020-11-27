const fs = require('fs');
const randomString = require('randomstring');

// Process service worker
fs.readFile('./build/service-worker.js', 'utf8', (err, data) => {
    if (err) return console.error('Error during build-fix, service-worker not found');
    const matches = data.match(/\/precache-manifest\.(.*)\.js/);
    if (matches.length < 2) return console.error('Error during build-fix, no match in regex');
    const manifestHash = matches[1];

    fs.readFile('./build/service-worker-custom.js', 'utf8', (err, data) => {
        if (err) return console.error('Error during build-fix, service-worker-custom not found');
        data = data.replace('|PRECACHE_MANIFEST_HASH|', manifestHash);

        fs.writeFile('./build/service-worker-custom.js', data, 'utf8', (err) => {
            if (err) return console.error('Error during build-fix, service-worker-custom write failed');
            processStyles(manifestHash);
        });
    });
});

// TODO: Support relative build
// Process styles
function processStyles(manifestHash) {
    fs.readFile('./build/asset-manifest.json', 'utf8', (err, data) => {
        if (err) return console.error('Error during build-fix, asset-manifest not found');
        let json;
        try {
            json = JSON.parse(data);
        } catch (e) {
            return console.error('Error during build-fix, asset-manifest parse failed');
        }

        const hash = randomString.generate({
            length: 8,
            charset: 'hex'
        });
        const cssFile = `/static/css/styles.${hash}.css`;

        json['styles.css'] = cssFile;
        json = JSON.stringify(json);

        // Update asset-manifest
        fs.writeFile('./build/asset-manifest.json', json, 'utf8', (err) => {
            if (err) return console.error('Error during build-fix, asset-manifest write failed');

            // Update precache-manifest
            fs.readFile(`./build/precache-manifest.${manifestHash}.js`, 'utf8', (err, data) => {
                if (err) return console.error('Error during build-fix, precache-manifest not found');
                const prefix = 'self.__precacheManifest = [';
                data = data.replace(prefix, `${prefix}\n  {"revision": "${hash}", "url": "${cssFile}"},`);

                fs.writeFile(`./build/precache-manifest.${manifestHash}.js`, data, 'utf8', (err) => {
                    if (err) return console.error('Error during build-fix, precache-manifest write failed');

                    // Move styles
                    fs.rename(`./build/styles.css`, `./build${cssFile}`, function(err) {
                        if (err) return console.error('Error during build-fix, styles move failed');

                        // Update index
                        fs.readFile('./build/index.html', 'utf8', (err, data) => {
                            if (err) return console.error('Error during build-fix, index not found');
                            data = data.replace('/styles.css', cssFile);

                            fs.writeFile('./build/index.html', data, 'utf8', (err) => {
                                if (err) return console.error('Error during build-fix, index write failed');
                                console.log('build-fix completed');
                            });
                        });
                    });
                });
            });
        });
    });
}
