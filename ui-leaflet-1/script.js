var app = angular.module("demoapp", ['ui-leaflet']);
app.controller("MarkersClusteringController", ["$scope", "$http", "$log", "$q", "leafletData", function(
    $scope, $http, $log, $q, leafletData) {

    var utils = {};

    utils.pointsToMarkers = function pointsToMarkers(points, targetLayer) {
        var index;
        var markers = {};
        points.data.forEach(function(attributes) {
            markers[attributes.id] = {
                id: attributes.id,
                lat: attributes.lat,
                lng: attributes.lng,
                title: attributes.name,
                message: attributes.name,
                layer: targetLayer
            };
        });
        return markers;
    };

    utils.initMap = function initMap() {
        angular.extend($scope, {
            center: {
                lat: 48.7793504,
                lng: 9.0371302,
                zoom: 10
            },
            markers: {},
            layers: {
                baselayers: {
                    xyz: {
                        name: 'OpenStreetMap (XYZ)',
                        url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        type: 'xyz'
                    }
                },
                overlays: {
                    cities: {
                        name: "Cities",
                        type: "group",
                        visible: true
                    },
                    points: {
                        name: "Points",
                        type: "group",
                        visible: true
                    }
                }
            }
        });
    };

    utils.loadMarkers = function loadMarkers() {
        var citiesPromise = $http.get("../data/cities.json").then(
            function success(data) {
                return utils.pointsToMarkers(data, "cities");
            }
        );
        var pointsPromise = $http.get("../data/points.json").then(
            function success(data) {
                return utils.pointsToMarkers(data, "points");
            }
        );
        $q.all([citiesPromise, pointsPromise]).then(function success(data) {
            var markers = angular.extend({}, data[0], data[1]);
            angular.extend($scope, {
                markers: markers
            });
        });
    };

    // do on load
    utils.initMap();
    utils.loadMarkers();
}]);