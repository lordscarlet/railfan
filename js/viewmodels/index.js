// bounding box: 38.902451,-77.005844,38.894789,-77.003526
// -77.005844,38.902451,-77.003526,38.894789&date=2016-08-27&operator_onestop_id=o-9-amtrak

// transit.land Amtrak: https://transit.land/feed-registry/operators/o-9-amtrak

// union station: http://transit.land/api/v1/stops/s-dqcjr8vxkm-washingtonunionstationamtrak
var onestop_id = "s-dqcjr8vxkm-washingtonunionstationamtrak";
var endpoint = "http://transit.land/api/v1/stops/" + onestop_id;
var start = '2016-08-29';
var end = '2016-08-30';
var per_page = 1000;
var scheduleendpoint = "http://transit.land/api/v1/schedule_stop_pairs?per_page=" + per_page + "&service_from_date=" + start + "&service_before_date=" + end + "&origin_onestop_id="
var destinationendpoint = "http://transit.land/api/v1/schedule_stop_pairs?per_page=" + per_page + "&service_from_date=" + start + "&service_before_date=" + end + "&destination_onestop_id="

function stationViewModel(data) {
    var self = this;
    
    self.interval = ko.observable(30);
    
    ko.mapping.fromJS(data, {}, self);
    
    self.segments = ko.pureComputed( function() {
        var segments = new Array();

        for (var segment = 0; segment <= 24 * 60 / self.interval(); segment++) {
            var hour_segment = segment % (60 / self.interval());
            var hour = Math.floor(segment / (60 / self.interval()));
            var minutes = hour_segment * self.interval();

            var inbound = $.grep(self.pairs.schedule_stop_pairs(), function (pair, i) {
                var time = pair.origin_onestop_id() == onestop_id ? pair.origin_arrival_time() : pair.destination_arrival_time();
                var arrival_time = time.split(':');
                var hour = arrival_time[0] % 24;
                var hour_segment = Math.floor(arrival_time[0] / self.interval());
                var origin_arrival_segment = hour * (60 / self.interval()) + hour_segment;

                return origin_arrival_segment == segment;
            }).reduce(function (pairs, p1) {
                var matches = pairs.filter(function (p2) {
                    return p1.trip_short_name() == p2.trip_short_name();
                })
                if (matches.length == 0)
                    pairs.push(p1);
                return pairs;
            }, []);

            var outbound = $.grep(self.pairs.schedule_stop_pairs(), function (pair, i) {
                var time = pair.origin_onestop_id() == onestop_id ? pair.origin_departure_time() : pair.destination_departure_time();
                var departure_time = time.split(':');
                var hour = departure_time[0] % 24;
                var hour_segment = Math.floor(departure_time[0] / self.interval());
                var origin_arrival_segment = hour * (60 / self.interval()) + hour_segment;

                return origin_arrival_segment == segment;
            }).reduce(function (pairs, p1) {
                var matches = pairs.filter(function (p2) {
                    return p1.trip_short_name() == p2.trip_short_name();
                })
                if (matches.length == 0)
                    pairs.push(p1);
                return pairs;
            }, []);

            segments.push( 
                {
                    position: segment,
                    hour: hour,
                    minutes: minutes,
                    inbound: inbound,
                    outbound: outbound
                });
        }
        return segments; 
    }, self);
   
}

function pairsViewModel(data) {
    var self = this;
    
    ko.mapping.fromJS(data, {}, self);
    
}

ko.applyBindings(function() {
    var self = this;
    
    self.station = undefined;
    self.pairs = undefined;
    self.segments = ko.observableArray();
    
    self.loaded = ko.observable(false);
    
    self.init = function() {
        $.getJSON(endpoint, function(data) {
            self.station = new stationViewModel(data);
            $.getJSON(scheduleendpoint + station.onestop_id(), function(data) {
                

                // TODO: segments, minutes, etc should be observables
                for (var segment = 0; segment <= 24 * 60 / self.station.interval(); segment++) {
                    var hour_segment = segment % (60 / self.station.interval());
                    var hour = Math.floor(segment / (60 / self.station.interval()));
                    self.segments.push(
                        {
                            position: segment, 
                            hour: hour, 
                            minutes: hour_segment * self.station.interval(), 
                        }
                    );
                }

                $.getJSON(destinationendpoint + station.onestop_id(), function (data_in) {
                    console.log(data);
                    console.log(data_in);
                    $.merge(data.schedule_stop_pairs, data_in.schedule_stop_pairs)
                    self.station.pairs = new pairsViewModel(data);

                    self.loaded(true);
                })


                
                // $.each(self.pairs, function(i, pair) {
                //     var origin_arrival_time = pair.origin_arrival_time.split(':');
                //     var hour = origin_arrival_time[0] % 24;
                //     var hour_segment = Math.floor(origin_arrival_time[0]/interval);
                //     var segmentPosition = hour * (60/interval) + hour_segment;

                //     // in-bound trains                    
                //     var index = $.map(self.segments(), function(seg) {
                //         return seg.position;
                //     }).indexOf(segmentPosition);
                //     if (index < 0) {
                //         self.segments.push({ position: segmentPosition, hour: hour, minutes: hour_segment * interval, in: ko.observableArray([pair]), out: ko.observableArray([])})
                //     }
                //     else {
                //         self.segments()[index].in().push(pair);
                //     }
                    
                //     // out-bound trains
                //     var origin_departure_time = pair.origin_departure_time.split(':');
                //     hour = origin_departure_time[0] % 24;
                //     hour_segment = 
                    
                //     if (i >= self.pairs.length - 1) {
                //         console.log("done");
                        
                //         self.loaded(true);
                //     }
                // });

                
            });
        });
        
    }
    
    
    self.init();
});