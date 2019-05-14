const request = require('request');
const fs = require('fs');
const readLine = require('readline');

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

const headers = {
    'Host': 'metanit.com',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Mobile Safari/537.36',
    'DNT': '1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,images/webp,images/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    'Accept-Encoding': 'br',
    'Accept-Language': 'ru,en-US;q=0.9,en;q=0.8,uk;q=0.7'
};


let options = {
    url: '',
    method: 'GET',
    headers: headers
};

let imageOptions = {
    url: '',
    method: 'GET',
    headers: headers,
    encoding: 'binary'
};

function parseBody(strHTMLBody) {
    let parsedBody = {};
    try {
        parsedBody.nextPage = strHTMLBody.match(/<a href="[0-9]+\.[0-9]+\.php">Вперед<\/a>/)[0].match(/[0-9]+\.[0-9]+\.php/)[0];
    } catch (error) {
        parsedBody.nextPage = null;
    }
    parsedBody.name = strHTMLBody.match(/<title>.+<\/title>/)[0].replace("<title>", "").replace("</title>", "");
    parsedBody.images = strHTMLBody.match(/<img src="pics\/.+\.png" alt=/ig);
    //normalize images name
    if (parsedBody.images !== null) {
        for (let i = 0; i < parsedBody.images.length; i++) {
            parsedBody.images[i] = parsedBody.images[i].match(/pics\/.+\.png/ig);
        }
    }
    return parsedBody;
}

function saveHTMLPage(dirName, url, next, pageNum) {
    let file;
    let parsedBody = {};
    options.url = url + next;
    request(options, function (error, response, body) {
        console.log('make request to : ' + options.url);
        if (!error && response.statusCode === 200) {
            parsedBody = parseBody(body.toString());
            file = fs.createWriteStream(dirName + '/' + pageNum + '_' + parsedBody.name + '.html', 'utf8');
            file.write(body);
            if (parsedBody.images !== null) {
                saveImages(url, parsedBody.images, dirName);
            }
            // console.log(parsedBody);
            if (parsedBody.nextPage == null) {
                console.log('=== Finish saving ===');
                return;
            }
            saveHTMLPage(dirName, url, parsedBody.nextPage, ++pageNum);
        } else {
            console.log('Page not found - ' + url);
        }
    });
}

function saveImages(url, images, dirName) {
    images.forEach((element) => {
        imageOptions.url = url + element;
        request(imageOptions, function (error, response, body) {
            fs.writeFile(dirName + '/' + element, body, 'binary', function (err) {
            });
        });
    });
}

function start() {
    let pageNum = 1;
    console.log('Enter page url witch from start saving like : \'https://metanit.com/web/nodejs/1.1.php\'');
    rl.on('line', (input) => {
        if (input.toLowerCase() === 'exit') {
            process.exit();
        }
        try {
            let url = input.replace(/ /g, '').replace(/[0-9]+\.[0-9]+\.php$/, '');
            let dirName = url.replace('https://metanit.com/', '').replace(/\//g, '.');
            let startFrom = input.match(/[0-9]+\.[0-9]+\.php/);
            if (startFrom == null) {
                console.log('Error... Check url.');
                return;
            }
            fs.mkdir(dirName, () => {
            });
            fs.mkdir(dirName + '/' + 'pics', () => {
            });
            saveHTMLPage(dirName, url, startFrom, pageNum);
        } catch (error) {
            console.log('Error... Check url.');
        }
    });
}

start();