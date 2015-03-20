var myModule = angular.module('myModule', ['pragmatic-angular']);
myModule.factory('socket', function($rootScope) {
  var socket = io.connect();
  return {
	 on: function(eventName, callback) {
		socket.on(eventName, function() {
		  var args = arguments;
		  $rootScope.$apply(function() {
			 callback.apply(socket, args);
		  });
		});
	 },
	 emit: function(eventName, data, callback) {
		socket.emit(eventName, data, function() {
		  var args = arguments;
		  $rootScope.$apply(function() {
			 if(callback) {
				callback.apply(socket, args);
			 }
		  });
		});
	 }
  };
});


function myController($scope, $timeout, socket) {
  // Incoming
  socket.on('onNoteOn', function(data) {
    var note = data.id;
    MIDI.noteOn(0, note, $scope.velocity);
    $scope.note.push(note); $timeout(function() {
      $scope.$apply($scope.note);
    }, 0);  
  });
  
  socket.on('onNoteOff', function(data) {
    var note = data.id;
    $scope.note.splice($scope.note.indexOf(note),1); MIDI.noteOff(0, note);
    $timeout(function() {
      $scope.$apply($scope.note);
    }, 0); 
  });

  // Outgoing
  $scope.noteOn = function(channel, note, velocity) {
	 var note_id = {
		channel: channel,
		id: note,
		velocity: velocity			
	 };
	 socket.emit('noteOn', note_id);
  };

  $scope.noteOff = function(channel, note) {
	 var note_id = {
		channel: channel,
		id: note		
	 };
	 socket.emit('noteOff', note_id);
  };
  
  $scope.note = []; 
  $scope.scales = Scales;
  $scope.W = window.innerWidth * 0.81;
  $scope._scale='natural major,ionian';
  $scope.velocity = 81;

  $scope.color = function(i){return '#'+(Math.random() * 0xFFFFFF << 0).toString(16);}
  $scope.keys = {
    b: [22,'|',25,27,'|',30,32,34,'|',37,39,'|',42,44,46,'|',49,51,'|',54,56,58,'|',61,63,'|',66,68,70,'|',73,75,'|',78,80,82,'|',85,87,'|',90,92,94,'|',97],
    w: [21,23,24,26,28,29,31,33,35,36,38,40,41,43,45,47,48,50,52,53,55,57,59,60,62,64,65,67,69,71,72,74,76,77,79,81,83,84,86,88,89,91,93,95,96,98]
  }
  $scope.down = function(id){ $scope.pressed = true;
    $scope.note.push(id); MIDI.noteOn(0, id, $scope.velocity); 
    $scope.id = id; n  = id;
    root = teoria.note.fromMIDI(id);
    $scope.root = root.name.toUpperCase() + root.accidental.sign;
    $scope.noteOn(0, id, $scope.velocity);
  }	
  $scope.up = function(id){ $scope.pressed = false;
    $scope.note.splice($scope.note.indexOf(id),1); MIDI.noteOff(0, id);
    $scope.noteOff(0, id);
  }
  steps = keys;
  $scope.Keys = [];
  if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {steps = _keys};
  $scope.current_scale = 0;
  keyAllowed = {};

  $scope.$watchCollection('note', function(notes) {
    notes.length == 0 ? $scope.colors = [] : $scope.colors[notes.length]=$scope.color();
  });  
  
  $scope.isSelected = function (id) {
    if( $scope.note.indexOf(id) > -1){
      return true;
    }
    return false;
  };
  
  $scope.isCol = function (id) {
    if( $scope.Keys.indexOf(id) > -1){
      return true;
    }
    return false;
  };
  
    $scope.onKeyDown = function ($event) {
    var theKey = arguments[0].keyCode;
    if (keyAllowed [theKey] === false) return;
    keyAllowed [theKey] = false;
    $scope.Keys = [];
    if (theKey == 38) {
      Object.keys(steps[$scope.current_scale]).map(function(value, index){
        steps[$scope.current_scale][value] ++;
        $scope.Keys = []; $scope.highlight();
      });
    }; 
    if (theKey == 40) {
      Object.keys(steps[$scope.current_scale]).map(function(value, index){
        steps[$scope.current_scale][value] --;
        $scope.Keys = []; $scope.highlight();
      })
    };   
    var key = steps[$scope.current_scale][theKey];
    if(key){ 
      $scope.note.push(key); MIDI.noteOn(0, key, $scope.velocity);
      $scope.noteOn(0, key, $scope.velocity);
    }   
  };

  $scope.onKeyUp = function ($event) {
    var theKey = arguments[0].keyCode;
    keyAllowed [theKey] = true;
    var key = steps[$scope.current_scale][theKey];
    if(key) {
      $scope.note.splice($scope.note.indexOf(key),1); MIDI.noteOff(0, key);
      $scope.noteOff(0, key);
    }
  };   
    
  $scope.changeScale = function() {$scope.Keys = [];
    $scope.current_scale = $scope.scales.indexOf($scope._scale);
    $scope.highlight();
    $('select').blur();
  };
    $scope.highlight = function() {
    $.each(steps[$scope.current_scale], function(k, v) {
      $scope.Keys.push(v);
    });
  };
  
  $scope.onStop = function(event, ui) {
    $scope.velocity = ui.value;
    $scope.$apply();
  };

  angular.element(document).ready(function() {console.log(MIDI);
    MIDI.loader = new widgets.Loader;
	 MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		callback: function(){ 
		   MIDI.loader.stop();
			MIDI.programChange(0, 0);
		}
	 });
  });

  var vals = [];
  for (i = 0; i <= 127; i++){vals.push(i)};

  $scope.OnChange = function(c) {
    MIDI.chordOff(0, vals);
    $timeout.cancel($scope.timer);
    if (angular.isUndefined($scope.root)) return; 
    $scope.chord = $scope.root + c;
    var chord = teoria.chord($scope.chord); 
    console.log(chord.intervals + ";" + chord.quality());
    var _chord = [];
    angular.forEach(chord.intervals, function(d, i) {
      semiton = d.semitones(); var notes = $scope.id + semiton;
  	   _chord.push(notes);
    });  
    $scope.Keys = _chord;
    MIDI.chordOn(0, _chord, $scope.velocity); 
    $scope.timer = $timeout(function() {
      MIDI.chordOff(0, _chord); $scope.Keys = []; $scope.$apply();
    }, 2600);   
  };
     
  $scope.major = ["", "add9", "add9b5", "add9add11", "add9add13", "add11", "add13", "maj", "majb5", "majadd11", "majadd13", "maj9", "maj9add13", "maj11", "maj13", "maj13#11", "6", "6b5", "6add9", "6add9add11", "6add11", "6add13", "7b5", "7b5#9", "7b5b9", "9b5", "11b5", "13b5"];
  $scope.dominant = ["7", "9", "11", "9add#11", "11#9", "11b9", "13", "7add11", "7b9#11", "7add13", "9add13", "7add#9", "7addb9", "7addb9b5", "13#9", "13b9", "13b9b5", "11add#13", "13#11", "13b9#11", "11addb13", "7b13#9", "7b13#9#11"]; 
  $scope.minor = ["m", "m6", "m7", "m#5", "m7#5", "m9", "m9#5", "m11", "m11#5", "7b13#9", "m13", "m13#5", "m11addb13", "madd9", "m6add9", "m7add11", "m7add13", "mmaj7", "mmaj9", "mmaj11", "mmaj13", "mmaj7add11", "mmaj7add13"]; 
  $scope.suspended = ["sus", "sus2", "7sus", "7sus2", "9sus", "7sus2b5", "9susb5", "9sus2", "11sus", "11sus2", "11sus#5", "13sus", "13sus2", "13susb5", "13sus2#5", "13sus#5", "6sus", "6susb5", "6sus#5", "6sus2", "6sus2b5", "6sus2#5"];
  $scope.augmented = ["aug", "aug7", "maj#5", "maj9#5", "maj11#5", "maj13#5", "aug9", "aug7b9", "augb9", "aug7#9", "aug11", "aug11b9", "aug11#9", "aug13", "aug13b9", "aug13#9"];
  $scope.diminished = ["dim", "dim7", "dim9", "dim11", "dim13"];
  $scope.half_diminished = ["m7b5", "m9b5", "m11b5", "m13b5"];
  //$scope.simple = ["3", "m3", "1"]; 

  $scope.blur = function() { $("input").blur(); }

}
