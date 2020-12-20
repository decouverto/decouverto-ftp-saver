const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), './.env') });

const request = require('request');
const report = require('./lib/report');
const fs = require('fs-extra');
const jsftp = require("jsftp");
const series = require('async-series');
const colors = require('colors');

let localFolder = 'tmp';
if (process.env.ENABLE_FTP == 'false')   { 
    localFolder = 'save';
} else {
    const ftp = new jsftp({
        host: process.env.FTP_SERVER
    });
}
fs.mkdirpSync(path.join(process.cwd(), localFolder));

console.log('Téléchargement de la liste'.yellow);
request.get('https://decouverto.fr/walks/index.json', function (err, res, body) {
    if (err) return report(err, 'Impossible de télécharger la liste des balades.');
    console.log('Liste téléchargée'.green);
    if (process.env.ENABLE_FTP == 'false') {
        let p = path.join(process.cwd(), localFolder, 'index.json');
        fs.writeFile(p, body, function(err, data) {
            if (err) {
                report(err, 'Erreur lors de l\'écriture de index.json');
            }
            console.log('Sauvegarde de la liste réussie.'.green);
        });
    } else {
        ftp.put(Buffer.from(body, 'utf8'), process.env.FTP_SERVER_PATH + '/index.json', err => {
            if (err) return report(err, 'Impossible de sauvegarder la liste des balades sur le serveur.');
            console.log('Liste sauvegardée'.green);
        });
    }
    const files = JSON.parse(body);

    

    const tasks = files.map(element => {
        let p = path.join(process.cwd(), localFolder, element.id + '.zip');
        return function (callback) {
            request.get('https://decouverto.fr/walks/' + element.id + '.zip')
            .on('error', function (err) {
                console.log(colors.red('Erreur lors du téléchargement de ' + element.id + '.zip'));
                return callback(err);
            })
            .pipe(fs.createWriteStream(p))
            .on('finish', function () {
                if (process.env.ENABLE_FTP == 'false') {
                    console.log(colors.green('Sauvegarde de ' + element.id + '.zip réussie'));
                    callback(null);
                } else {
                    fs.readFile(p, 'binary', function(err, data) {
                        if (err) {
                            console.log(colors.red('Erreur lors de la lecture de ' + element.id + '.zip'));
                            return callback(err);
                        }
                        console.log(colors.green('Lecture de ' + element.id + '.zip réussie'));
                        let buffer = Buffer.from(data, 'binary');
                        ftp.put(buffer, process.env.FTP_SERVER_PATH + '/' + element.id + '.zip', err => {
                            if (err) {
                                console.log(colors.red('Erreur lors de la sauvegarde de ' + element.id + '.zip'));
                                return callback(err);
                            }
                            console.log(colors.green('Sauvegarde de ' + element.id + '.zip réussie'));
                            fs.remove(p, callback);
                        });
                    });
                }
            });
        }
    });

    series(tasks, function (err) {
        if (err) {
            return report(err, 'Une erreur est survenue lors de la sauvegarde des balades.');
        }
        let body = 'Les balades suivantes ont été sauvegardées:'
        files.forEach(element => {
            body+= '\n - ' + element.title;
        });
        report(null, 'Sauvegarde des balades réussie', body);
    });

});

