define(['histmap', 'tin', 'aigle'], function(ol, Tin, Promise) {
    ol.source.HistMap_tin = function(optOptions) {
        var options = optOptions || {};

        ol.source.HistMap.call(this, options);

        this.tin = new Tin({
            wh: [this.width, this.height]
        });
    };
    ol.inherits(ol.source.HistMap_tin, ol.source.HistMap);

    ol.source.HistMap_tin.createAsync = function(options) {
        if (options.noload) {
            if (options.attr && !options.attributions) {
                options.attributions = [
                    new ol.Attribution({
                        html: options.attr
                    })
                ];
            }
            return Promise.resolve(new ol.source.HistMap_tin(options));
        }
        return new Promise(function(resolve, reject) {
            var url = options.setting_file || 'maps/' + options.mapID + '.json';
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'json';

            xhr.onload = function(e) {
                if (this.status == 200 || this.status == 0 ) { // 0 for UIWebView
                    try {
                        var resp = this.response;
                        options.title = options.title || resp.title;
                        options.width = options.width || resp.width;
                        options.height = options.height || resp.height;
                        options.label = options.label || resp.label || resp.year;
                        options.attr = options.attr || resp.attr;
                        options.urls = options.urls || resp.urls;
                        options.url = options.url || resp.url;
                        if (options.attr && !options.attributions) {
                            options.attributions = [
                                new ol.Attribution({
                                    html: options.attr
                                })
                            ];
                        }
                        var obj = new ol.source.HistMap_tin(options);
                        var proj = new ol.proj.Projection({
                            code: 'Illst:' + obj.mapID,
                            extent: [0.0, 0.0, obj.width, obj.height],
                            units: 'm'
                        });
                        ol.proj.addProjection(proj);
                        ol.proj.addCoordinateTransforms(proj, 'EPSG:3857', function(xy) {
                            return obj.tin.transform(xy, false);
                        }, function(merc) {
                            return obj.tin.transform(merc, true);
                        });
                        ol.proj.transformDirect('EPSG:4326', proj);
                        if (resp.compiled) {
                            obj.tin.setCompiled(resp.compiled);
                            resolve(obj);
                        } else {
                            obj.finalizeCreateAsync_(resp.gcps, resolve);
                        }
                    } catch(err) {
                        throw err;
                    }
                } else {
                    throw 'Fail to load map json';
                    // self.postMessage({'event':'cannotLoad'});
                }
            };
            xhr.send();
        });
    };

    ol.source.HistMap_tin.prototype.finalizeCreateAsync_ = function(points, resolve) {
        var self = this;
        this.tin.setPoints(points);
        this.tin.updateTinAsync()
            .then(function() {
                resolve(self);
            });
    };

    ol.source.HistMap_tin.prototype.xy2MercAsync_ = function(xy) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(xy, 'Illst:' + self.mapID, 'EPSG:3857'));
        }).catch(function(err) {
            throw err;
        });
    };
    ol.source.HistMap_tin.prototype.merc2XyAsync_ = function(merc) {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(ol.proj.transformDirect(merc, 'EPSG:3857', 'Illst:' + self.mapID));
        }).catch(function(err) {
            throw err;
        });
    };

    return ol;
});
