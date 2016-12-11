#!/usr/local/bin/node

var fs       = require('fs-extra'),
    path     = require('path'),
    argv     = require('argv'),
    readline = require('readline'),
    request  = require('request'),
    turf     = require('../js/turf.min'),
    Tin      = require('../js/tin'),
    csv      = require('csv');

Tin.setTurf(turf);

var args = argv.option( [{
    name: 'points',
    short: 'p',
    type: 'path',
    description: 'Defines source points file. Maplat format file can be set.',
    example: "'createelevation.js --source=path' or 'createelevation.js -s path'"
},{
    name: 'output',
    short: 'o',
    type: 'path',
    description: 'Defines output folder',
    example: "'createelevation.js --output=path' or 'createelevation.js -o path'"
},{
    name: 'size',
    short: 's',
    type: 'csv,int',
    description: 'Defines size of images.',
    example: "'createelevation.js --size=x,y' or 'createelevation.js -s x,y'"
}] ).run();

var gsi_cache = {};

var MERC_MAX = 20037508.342789244;
var pointFile = args.options.points;
var outFolder = args.options.output;
var wh        = args.options.size;
if (!pointFile) stop('Points option is mandatory.');
if (!wh) stop('Size option is mandatory.');

var basename = path.basename(pointFile).split(".")[0].replace(/_points$/,"");
var points = require(pointFile);
if (!outFolder) {
    outFolder = "./elevs";
}

var maxzoom = Math.ceil(Math.log(Math.max(wh[0],wh[1]) / 256) / Math.log(2));
console.log(maxzoom);

var tin = new Tin({
    points: points,
    wh: wh
});

var vtxtiles = [
    [0,0],
    [wh[0],0],
    [0,wh[1]],
    wh
].map(function(vtx){
    var mercxy = tin.transform(vtx, false);
    var pixxy = [mercxy[0] + MERC_MAX, MERC_MAX - mercxy[1]].map(function (merc) {
        return Math.pow(2, 14) * 256 * merc / MERC_MAX / 2;
    });
    var tilexy = pixxy.map(function (pix) {
        return Math.floor(pix / 256);
    });
    return tilexy;
});

var vtxxs = vtxtiles.map(function(xy){return xy[0]});
var vtxys = vtxtiles.map(function(xy){return xy[1]});

var minx = Math.min(vtxxs[0],vtxxs[1],vtxxs[2],vtxxs[3]) - 1;
var maxx = Math.max(vtxxs[0],vtxxs[1],vtxxs[2],vtxxs[3]) + 1;
var miny = Math.min(vtxys[0],vtxys[1],vtxys[2],vtxys[3]) - 1;
var maxy = Math.max(vtxys[0],vtxys[1],vtxys[2],vtxys[3]) + 1;

var promises = [];
for (var x = minx;x<=maxx;x++) {
    for (var y = miny;y<=maxy;y++) {
        promises.push(getElevationByTileXyAsync([x,y],[0,0]));
    }
}
Promise.all(promises).then(function(){
    for (var tx=0;tx<Math.pow(2,maxzoom);tx++) {
        var dx = tx * 256;
        if (dx >= wh[0] ) continue;
        for (var ty=0;ty<Math.pow(2,maxzoom);ty++) {
            var dy = ty * 256;
            if (dy >= wh[1] ) continue;
            var tree = outFolder + "/" + basename +'/' + maxzoom + '/' + tx;
            fs.mkdirsSync(tree);
            var file = tree + '/' + ty + '.txt';
            fs.writeFileSync(file, "");

            for (var py = 0; py < 256; py++) {
                var result = [];
                var y = dy + py + 0.5;
                for (var px = 0; px < 256; px++) {
                    var x = dx + px + 0.5;
                    if (x >= wh[0] || y >= wh[1]) {
                        result.push("e");
                    } else {
                        var mercxy = tin.transform([x, y], false);
                        var pixxy = [mercxy[0] + MERC_MAX, MERC_MAX - mercxy[1]].map(function (merc) {
                            return Math.pow(2, 14) * 256 * merc / MERC_MAX / 2;
                        });
                        var tilexy = pixxy.map(function (pix) {
                            var tile = Math.floor(pix / 256);
                            return [tile, Math.floor(pix - tile * 256)];
                        });
                        var ret = getElevationByTileXy([tilexy[0][0], tilexy[1][0]], [tilexy[0][1], tilexy[1][1]]);
                        result.push(ret);
                    }
                }
                fs.appendFileSync(file, result.join(",") + "\n");
            }
        }
    }
});




/*var result = [];

for (var x=0;x<256;x++) {
    var cx = x + 0.5;
    for (var y=0;y<256;y++) {
        var cy = y + 0.5;
        var mercxy = tin.transform([cx, cy], false);
        var pixxy = [mercxy[0] + MERC_MAX, MERC_MAX - mercxy[1]].map(function (merc) {
            return Math.pow(2, 14) * 256 * merc / MERC_MAX / 2;
        });
        var tilexy = pixxy.map(function (pix) {
            var tile = Math.floor(pix / 256);
            return [tile, Math.floor(pix - tile * 256)];
        });
        var promise = getElevationByTileXyAsync([tilexy[0][0], tilexy[1][0]], [tilexy[0][1], tilexy[1][1]]);
        if (!result[tilexy[1][0]]) result[tilexy[1][0]] = [];
        result[tilexy[1][0]][tilexy[0][0]] = promise;
    }
}
Promise.all(result.map(function(line){
    return Promise.all(line);
})).then(function(result){
    console.log(result);
})



/*

var mercxy  = tin.transform([0.5,0.5],false);
var pixxy   = [mercxy[0]+MERC_MAX,MERC_MAX-mercxy[1]].map(function(merc){
    return Math.pow(2,14) * 256 * merc / MERC_MAX / 2;
});
var tilexy  = pixxy.map(function(pix){
    var tile = Math.floor(pix / 256);
    return [tile, pix - tile*256];
});

console.log(tilexy);*/

//getElevationByTileXyAsync([14616,6220],[255,255])//[tilexy[0][0],tilexy[1][0]])
//    .then(function(val){
//        console.log(val);
//    });

function stop (message) {
    console.log(message);
    process.exit(1);
}

function getElevationByTileXy(txy,lxy) {
    if (gsi_cache[txy[0]+ "," + txy[1]]) {
        return gsi_cache[txy[0]+ "," + txy[1]][lxy[1]][lxy[0]];
    } else {
        stop("Tile " + txy[0]+ "," + txy[1] + " is not fetched");
    }
}

function getElevationByTileXyAsync(tilexy,localxy) {
    return (function(txy,lxy) {
        return new Promise(function(res,rej){
            if (gsi_cache[txy[0]+ "," + txy[1]]) {
                res(gsi_cache[txy[0]+ "," + txy[1]][lxy[1]][lxy[0]]);
            } else {
                var url = "http://cyberjapandata.gsi.go.jp/xyz/dem/14/" + txy[0] + "/" + txy[1] + ".txt";
                request(url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        csv.parse(body,function(err, data){
                            gsi_cache[txy[0]+ "," + txy[1]] = data;
                            res(data[lxy[1]][lxy[0]]);
                        });
                    } else {
                        console.log('error: '+ response.statusCode);
                    }
                });
            }
        });
    })(tilexy,localxy);
}
