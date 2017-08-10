var app = angular.module("demoapp", []);
app.controller("MarkersClusteringController", ["$scope", "$http", "$log", "$q", function(
    $scope, $http, $log, $q, leafletData) {

    var markers;
    var pois;

    function randomNumber(min, max) {
        return Math.floor((Math.random() * max) + min);
    }

    var constants = {
        CITIES: "cities",
        POINTS: "points"
    }

    var config = {
        center: {
            lat: 51.132034,
            lng: 10.403093,
            zoom: 6
        },
        osm: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        baselayers: {
            "OSM": L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { id: 'map.osm', attribution: 'bla' })
        }
    };

    function createFontAwsomeIcon(value, type) {
        var color;

        if (type === constants.POINTS) {
            color = 'blue';
        } else if (value < 3) {
            color = 'red';
        } else if (value >= 3 && value <= 7) {
            color = 'orange';
        } else {
            color = 'green';
        }
        return L.AwesomeMarkers.icon({
            type: 'awesomeMarker',
            icon: 'star',
            markerColor: color
        });
    }

    function createMarker(point, layer) {
        var value = randomNumber(0, 10);
        var options = {
            id: point.id,
            lat: point.lat,
            lng: point.lng,
            title: point.name,
            message: point.name,
            layer: layer,
            value: value,
            icon: createFontAwsomeIcon(value, layer)
        };
        return L.marker(L.latLng(point.lat, point.lng), options);
    }

    function createSimpleMarker(point) {
        return L.marker(L.latLng(point.lat, point.lng));
    }

    function loadData() {
        angular.extend($scope, {
            markers: {}
        });
        var citiesPromise = $http.get("../data/cities.json").then(
            function success(data) {
                return data;
            }
        );
        var pointsPromise = $http.get("../data/points.json").then(
            function success(data) {
                return data;
            }
        );
        $q.all([citiesPromise, pointsPromise]).then(function success(data) {
            pois.cities = data[0];
            pois.cities.data.forEach(function(marker) {
                createMarker(marker, constants.CITIES).bindPopup('Test').addTo(markers.cities);
            });
            pois.points = data[1];
            pois.points.data.forEach(function(marker) {
                createSimpleMarker(marker).bindPopup('Test').addTo(markers.points);
            });
        });
    };

    function init() {
        pois = {};
        markers = {};
        markers.cities = L.markerClusterGroup({
            maxClusterRadius: 60,
            iconCreateFunction: function(cluster) {
                var childCount = cluster.getChildCount();
                var childs = cluster.getAllChildMarkers();
                var sum = 0;
                childs.forEach(function(marker) {
                    sum += marker.options.value;
                });
                var c = ' marker-cluster-';
                if (childCount < 10) {
                    c += 'small';
                } else if (childCount < 100) {
                    c += 'medium';
                } else {
                    c += 'large';
                }
                $log.info('c: ' + sum + '(' + childCount + ')');
                return new L.DivIcon({
                    html: '<div><span>' + sum + '(' + childCount + ')' + '</span></div>',
                    className: 'marker-cluster' + c,
                    iconSize: new L.Point(40, 40)
                });
            }
        });
        markers.points = L.layerGroup();
        map = L.map('map', {
            center: L.latLng(config.center.lat, config.center.lng),
            zoom: config.center.zoom,
            layers: [config.baselayers.OSM, markers.cities, markers.points]
        });
        L.control.layers(config.baselayers, {
            'cities': markers.cities,
            'points': markers.points
        }).addTo(map);
        loadData();
    }

    function randomUpdate() {
        if (angular.isUndefined(markers.cities) || angular.isUndefined(pois.cities)) {
            return;
        }
        var markerIndex = randomNumber(0, Object.keys(pois.cities.data).length);
        var newValue = randomNumber(0, 10);
        var icon = createFontAwsomeIcon(newValue, constants.CITIES);

        markers.cities.eachLayer(function(clMarker) {
            if (clMarker.options.id === pois.cities.data[markerIndex].id) {
                clMarker.options.value = newValue;
                clMarker.refreshIconOptions(icon.options, true);
            }
        });
        markers.cities.refreshClusters();
    }

    //on load
    init();
    setInterval(randomUpdate, 1000);
}]);