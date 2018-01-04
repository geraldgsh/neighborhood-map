// Creates a global map marker
var map;

// Globally declare Foursquare API Client
var fsqClient_id = "client_id=YA02WKOBJL3G02FJMHOE5O4KUZJ4MVFPLWOYWVQZCIUMDMDN";
var fsqClient_secret = "&client_secret=BA4Q0JRNT0VGZHXFX3J5KOEZNAM2KFOY0YYADQZBP4BBGL2U";
var fsqVersion = "&v=20131016";

// Get Map to show up on page
function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
        center: new google.maps.LatLng(4.901335, 114.927559), // Map center
        styles: styles,
        mapTypeControl: false
    });
    // An Info Window is created 
    var infowindow = new google.maps.InfoWindow();

    // The following group uses the location array to create an array of markers on initialize.
    locations.forEach(function(location,i) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].title;
        var lat = locations[i].lat;
        var lng = locations[i].lng;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            lat: lat,
            lng: lng,
            position: {lat: lat, lng: lng},
            title: title,
            animation: google.maps.Animation.DROP,
            map: map,
            id: i
        });
        locations[i].marker = marker;

        // Set default marker
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
        // Change marker color on mouseover
        marker.addListener('mouseover', function() {
            this.setIcon('http://maps.google.com/mapfiles/ms/icons/yellow-dot.png');
        });
        // Revert to default marker on mouseout
        marker.addListener('mouseout', function() {
            this.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
        });

        // This function populates the infowindow when the marker is clicked. 
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
        // Built UrL for foursquare api call
        var queryUrl = 'https://api.foursquare.com/v2/venues/search?ll=' + marker.lat + ',' + 
                      marker.lng + '&' + fsqClient_id + '&' + fsqClient_secret + 
                      fsqVersion + '&query=' + marker.title;
        // Get JSON request to get venue data from FourSquare
        $.when($.getJSON(queryUrl).done(function(data) {
            $.ajaxSetup({ cache: false});
            var response = data.response.venues["0"];
            var venue_id = response.id;
            self.category = response.categories[0].shortName;
            self.address = response.location.formattedAddress;
            console.log("First API call");
            var baseUrl = 'https://api.foursquare.com/v2/venues/';
            var fsParam = '/?client_id=YA02WKOBJL3G02FJMHOE5O4KUZJ4MVFPLWOYWVQZCIUMDMDN&client_secret=BA4Q0JRNT0VGZHXFX3J5KOEZNAM2KFOY0YYADQZBP4BBGL2U&v=20131016';
            var picUrl = baseUrl + venue_id + fsParam;
            $.getJSON(picUrl).done(function(pic){
                $.ajaxSetup({ cache: false});
                var venue_data = pic.response.venue;
                self.img_url = venue_data.bestPhoto.prefix + '192x144' + venue_data.bestPhoto.suffix;
                console.log("Second API call");
                }).then(function() {
                    console.log('Infowindow ready!');

                    // Sets content for infowindow after 1st & 2nd JSON was made
                    infowindow.setContent('<div>' + '<h4>' + locations[i].title + '</h4>' + 
                                          '<h5>(' + self.category +
                                          ')</h5>' + '<div>' +'<div>' +
                                          '<img src='+self.img_url+'>'+
                                          '<h6> Address: </h6>' +
                                          '<p>' + self.address + '</p>' +
                                          '</p>' + '</div>' + '</div>');

                    // Alert User that there was a data request fail from third part API
                });
            }).fail(function() {
                alert("Unable to perform Foursquare API call. Please reload page.");
            }));
            infowindow.open(map, marker);
            // Sets animation to bounce 2 times when marker is clicked
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                marker.setAnimation(null);
            }, 2000);
        };
    })(marker, i));
    });
    // Apply knockout bindings from initmap function to ViewModel function
    ko.applyBindings(new ViewModel()); 
}

// Location object constructor
var Locale = function(data) {
  this.title = data.title;
  this.marker = data.marker;
};

var ViewModel = function() {
    var self = this;

    // Search and filter venue
    this.listVenue = ko.observableArray([]);
    locations.forEach(function(venueItem) {
      self.listVenue.push(new Locale(venueItem));
    });
    this.filter = ko.observable('');
    this.filteredVenues = ko.computed(function() {
      var filter = self.filter().toLowerCase();
      if (!filter) {
        self.listVenue().forEach(function(item){
            item.marker.setVisible(true);
        });
        return self.listVenue();
      } else {
        return ko.utils.arrayFilter(self.listVenue(), function(item) {
          // Set all markers visible (false)
          var string = item.marker.title.toLowerCase();
          var result = (string.search(filter) >= 0);
          item.marker.setVisible(result);
          return result;
        });
      }
    });

    // Clicking a location on the list animates its associated map marker
    self.setLocale = function(clickedVenue) {

        // Triggers Infowindow to open when item on list is clicked
        google.maps.event.trigger(clickedVenue.marker, 'click');
        clickedVenue.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            clickedVenue.marker.setAnimation(null);
        }, 2000);
    };
};

// Alerts User that there was an error loading map
gMapsError = function() {
    alert("Issue loading Google Map. Please reload page");
}
