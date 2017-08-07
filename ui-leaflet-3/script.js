var app = angular.module("demoapp", ['ui-leaflet']);
app.controller("MarkersClusteringController", ["$scope", "$http", "$log", "$q", "leafletData", function(
    $scope, $http, $log, $q, leafletData) {

    var constants = {
        CITIES: "cities",
        POINTS: "points"
    }
    var utils = {};

    utils.randomNumber = function randomNumber(min, max) {
        return Math.floor((Math.random() * max) + min);
    }

    utils.createFontAwsomeIcon = function createFontAwsomeIcon(value, type) {
        var icon, color;

        if (type === constants.POINTS) {
            color = "blue";
            icon = "flag";
        } else if (value < 3) {
            color = "red";
            icon = "star";
        } else if (value >= 3 && value <= 7) {
            color = "orange";
            icon = "star";
        } else {
            color = "green";
            icon = "star";
        }
        return {
            type: "awesomeMarker",
            icon: icon,
            markerColor: color
        }
    }

    utils.pointsToMarkers = function pointsToMarkers(points, targetLayer) {
        var index, randomValue;
        var markers = angular.copy($scope.markers);
        points.data.forEach(function(apoint) {
            randomValue = utils.randomNumber(1, 10);
            markers[apoint.id] = {
                id: apoint.id,
                lat: apoint.lat,
                lng: apoint.lng,
                title: apoint.name,
                message: apoint.name,
                layer: targetLayer,
                value: randomValue,
                icon: utils.createFontAwsomeIcon(randomValue, targetLayer)
            };
        });
        return markers;
    };

    angular.extend($scope, {
        center: {
            lat: 51.611043,
            lng: 12.360218,
            zoom: 7
        },
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
                    type: "markercluster",
                    visible: true,
                    layerOptions: {
                        showCoverageOnHover: false,
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
                            return new L.DivIcon({ html: '<div><span>' + sum + '(' + childCount + ')' + '</span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) });
                        }
                    }
                },
                points: {
                    name: "Points",
                    type: "markercluster",
                    visible: true
                }
            }
        }
    });

    utils.loadData = function loadData() {
        angular.extend($scope, {
            markers: {}
        });
        var citiesPromise = $http.get("../data/cities.json").then(
            function success(data) {
                return utils.pointsToMarkers(data, constants.CITIES);
            }
        );
        var pointsPromise = $http.get("../data/points.json").then(
            function success(data) {
                return utils.pointsToMarkers(data, constants.POINTS);
            }
        );
        $q.all([citiesPromise, pointsPromise]).then(function success(data) {
            var markers = angular.extend({}, data[0], data[1]);
            leafletData.getDirectiveControls().then(function(controls) {
                controls.markers.create(markers, $scope.markers);
                $scope.markers = markers;
            });
        });
    };

    // on load
    utils.loadData();
    setInterval(function() {
        if (angular.isUndefined($scope.markers)) {
            return;
        }
        var markerIndex = utils.randomNumber(0, Object.keys($scope.markers).length);
        var newValue = utils.randomNumber(1, 10);
        var marker = $scope.markers[Object.keys($scope.markers)[markerIndex]];
        marker.value = newValue;
        marker.icon = utils.createFontAwsomeIcon(newValue, marker.layer);
        leafletData.getLayers().then(function(layers) {
            var clMarkers = [];
            layers.overlays.cities.eachLayer(function(clMarker) {
                clMarker.refreshIconOptions(clMarker.options.icon.options, true);
                clMarker.update();
                clMarkers.push(clMarker);
            });
            layers.overlays.cities.refreshClusters(clMarkers);
        });
    }, 1000);
}]);