const request = require('request');
const report = require('./lib/report');
const fs = require('fs-extra');
const path = require('path');
const jsftp = require("jsftp");
const series = require('async-series');

const ftp = new jsftp({
    host: 'mafreebox.freebox.fr'
});

request.get('https://decouverto.fr/walks/index.json', function (err, res, body) {
    if (err) return report(err, 'Impossible de télécharger la liste des balades.');
    ftp.put(new Buffer(body, 'utf8'), '/Disque dur/decouverto/index.json', err => {
        if (err) return report(err, 'Impossible de sauvegarder la liste des balades sur le serveur.');
    });
    const files = JSON.parse(body);

    const tasks = files.map(element => {
        let p = path.join(process.cwd(), 'tmp', element.id + '.zip');
        return function (callback) {
            request.get('https://decouverto.fr/walks/' + element.id + '.zip').on('error', function(err) {
                if (err) return callback(err);
            })
            .on('error', function (err) {
                return callback(err);
            })
            .pipe(fs.createWriteStream(p))
            .on('finish', function () {
                if (err) return callback(err);
                fs.readFile(p, 'binary', function(err, data) {
                    let buffer = new Buffer(data, 'binary');
                    ftp.put(buffer, '/Disque dur/decouverto/' + element.id + '.zip', err => {
                        if (err) return callback(err);
                        fs.remove(p, callback);
                    });
                });
            });
        }
    });

    series(tasks, function (err) {
        if (err) {
            return report(err, 'Une erreur est survenue lors de la sauvegarde des balades.');
        }
        let body = 'Les balades suivantes ont été téléchargé:'
        files.forEach(element => {
            body+= '\n - ' + element.title;
        });
        report(null, 'Sauvegarde réussie', body);
    });

});

