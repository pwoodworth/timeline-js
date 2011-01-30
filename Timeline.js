/* `
Timeline.js

Joshua Moore 
With the generous help of the stackoverflow.com community

Dependencies:
jquery-1.4.4.min.js
// jquery.mousewheel.min.js

*/

/*
Timeline's two major functions are setup and draw. After instantiating a 
timeline object, the developer calls setup() to initialize the object. Later,
the developer repeatedly calls on draw() to animate the canvas.
In between, resizing the window may trigger the resize() function which 
adjusts the timeline's dimensions and other settings.
*/
function Timeline() {
	/*
	Implementation Details:

	For each piece of functionality, decide whether it belongs in setup, draw, resizeHandler,
	sliderChangedHandler or a combination of the aforementioned.
	*/

	// constants
	Timeline._BORDER_SIDES = 20; // The border on each side of the timeline,
	// We'll need this value later when calculating back's top offset
	Timeline._OFFSET_LEFT = '8px';
	Timeline._OFFSET_TOP = '8px'; // top border, 8px seems to be chrome default
	Timeline._BUTTON_WIDTH = 17; // The length of the back and forward buttons
	Timeline._WIDTH_FACTOR = 2 / 3; // How much height timeline should take up
	Timeline._MAGIC_DISTANCE = '6px'; // I don't know why this number works for
	// all sizes, but it does. Maybe it has something to do with the margin
	// of eight
	Timeline._BODY_MARGINS = 8;
	Timeline._SCALE_MARGIN = 5;

	Timeline._HEIGHT_FACTOR = 3 / 5;

	// The following constants are used in the sliderChangedHandler
	// use integers to aid in calculating latestFullHour
	Timeline._MS_PER_MINUTE = 60 * 1000;
	Timeline._MS_PER_HOUR = Timeline._MS_PER_MINUTE * 60;
	Timeline._MS_PER_DAY = Timeline._MS_PER_HOUR * 24;
	Timeline._MS_PER_WEEK = Timeline._MS_PER_DAY * 7;
	Timeline._MS_PER_MONTH = Timeline._MS_PER_WEEK * 4;
	Timeline._MS_PER_YEAR = Timeline._MS_PER_MONTH * 12;

	// How long should the length of the now tickmark be?
	Timeline._NOW_TICKMARK_HALF_LENGTH = 15;

	Timeline._MINUTE_TICKMARK_HALF_LENGTH = 5;
	Timeline._HOUR_TICKMARK_HALF_LENGTH = 10;
	Timeline._DAY_TICKMARK_HALF_LENGTH = 15;
	Timeline._WEEK_TICKMARK_HALF_LENGTH = 20;

	Timeline._START_END_BORDER = 40;

	// variables
	Timeline._id = 0; // An id wich is unique for each instance of Timeline

	// methods
	Timeline._showSettings = function (id) {
		$('#settings' + id).show(500).children().show();
		$('#showHideSettings' + id).attr('href', 'javascript:Timeline._hideSettings(' + id + ');');
	};

	Timeline._hideSettings = function (id) {
		$('#settings' + id).hide(500);
		$('#showHideSettings' + id).attr('href', 'javascript:Timeline._showSettings(' + id + ');');
	};

	Timeline._SLIDER_MIN = 0;
	Timeline._SLIDER_MAX = 100;
	Timeline._SLIDER_STEP = 1;
	Timeline._SLIDER_DEFAULT = 50;

	Timeline._BEYOND_SLIDER_MAX = 80; // this value lets us actually get past years

	Timeline._scale = function (value) {
		var minIn = Timeline._SLIDER_MIN;
		var maxIn = Timeline._SLIDER_MAX;

		var minOut = Math.log(Timeline._MS_PER_MINUTE);
		var maxOut = Math.log(Timeline._MS_PER_YEAR);

		var scale = (maxOut - minOut) / (maxIn - minIn);

		return Math.exp(minOut + scale * (value - minIn));
	};

	/* Here's how the timeline slider works: 
	The sliderChangedHandler detects what range the current value fits in, and adjusts the step accordingly, to allow
	for an easier transition. The slider determines how many minutes pass between startX and endX
	*/
	Timeline._DEFAULT_RANGE_DESCRIPTION = "Seconds";
	Timeline._sliderChangedHandler = function (id) {
		// get the value from scale_slider and scale it.
		var val = Timeline._scale($('#scale_slider' + id).val());
		var rangeDescription = Timeline._DEFAULT_RANGE_DESCRIPTION;

		if (Timeline._MS_PER_MINUTE <= val && val < Timeline._MS_PER_HOUR) {
			rangeDescription = 'Minutes';
		} else if (Timeline._MS_PER_HOUR <= val && val < Timeline._MS_PER_DAY) {
			rangeDescription = 'Hours';
		} else if (Timeline._MS_PER_DAY <= val && val < Timeline._MS_PER_WEEK) {
			rangeDescription = "Days";
		} else if (Timeline._MS_PER_WEEK <= val && val < Timeline._MS_PER_MONTH) {
			rangeDescription = 'Weeks';
		} else if (Timeline._MS_PER_MONTH <= val) {
			rangeDescription = 'Months';
		} 

		// display the current range to the user
		$('#zoom_range' + id).text(rangeDescription);

		Timeline._timelines[id]._rangeInMilliseconds = val;

		Timeline._timelines[id]._pixelsPerMs = (Timeline._timelines[id]._endX - Timeline._timelines[id]._startX) / Timeline._timelines[id]._rangeInMilliseconds;
	};

	Timeline._msToMin = function (ms) {
		return ms / (60 * 1000);
	};

	Timeline._minToMs = function (min) {
		return min * (60 * 1000);
	};

	Timeline._drawTick = function (timeline, x, halflength) {
		timeline._context.beginPath();

		timeline._context.moveTo(x, timeline._timelineY - halflength);
		timeline._context.lineTo(x, timeline._timelineY + halflength);

		timeline._context.closePath();
		timeline._context.stroke();
	};

	this._labelId = 0;
	Timeline._label = function(text, x, y, callback){
		$('#timeline_wrapper' + this._id).append('<div id="label' + this._id + '_' + this._labelId + '">' + text + '</div>');
		$('#label' + this._id + '_' + this._labelId)
			.css({
				'position': 'absolute',
				'left': x,
				'top': y,
				'z-index': 1
			})
			.click(callback)
	};

	// member functions

	/*
	timeline.setup()
	Create canvas, back and forward button, as well as slider for scale.
	timeline_wrapper_id is the id of an element which is to contain this
	specific timeline. 
	*/
	Timeline._timelines = [];
	this.setup = function (timeline_wrapper_id) {

		// add canvas
		this._id = Timeline._id++; // get id, create next id for next instance
		this._timeline_wrapper_id = timeline_wrapper_id;
		$('#' + timeline_wrapper_id).css('position', 'relative');
		// Thanks to css-tricks.com/absolute-positioning-inside-relative-positioning

		// add this to collection of timelines, so it is retrievable by id, in cases where
		// an event handler turns this from an instance of Timeline to an instance of event
		// details.
		Timeline._timelines[this._id] = this;

		this._canvas = document.createElement('canvas');
		this._canvas.setAttribute('id', 'canvas' + this._id);
		this._canvas.setAttribute('width', $(window).width() - Timeline._BODY_MARGINS * 2);
		this._canvas.setAttribute('height', $(window).height() - Timeline._BODY_MARGINS * 2);
		$('#' + timeline_wrapper_id).append(this._canvas);

		// add back button
		this._back = document.createElement('div');
		this._back.setAttribute('id', 'back' + this._id);
		// id's help us jquery stuff, ensuring their unique across instances
		// lets us potentially put several instance on the same page.

		$('#' + timeline_wrapper_id).append(this._back);


		// add forward button
		this._forward = document.createElement('div');
		this._forward.setAttribute('id', 'forward' + this._id);
		$('#' + timeline_wrapper_id).append(this._forward);


		// Add a settings panel
		/*
		this._settings = document.createElement('div');
		this._settings.setAttribute('id', 'settings' + this._id);
		this._settings.innerText = 'Settings\n';
		*/
		$('#' + timeline_wrapper_id).append($('<div id="settings_wrapper' + this._id + '"><center><a id="showHideSettings' + this._id + '" href="javascript:Timeline._showSettings(' + this._id + ');">Settings</a></center></div>'));
		// Add some settings to the settings panel
		$('#settings_wrapper' + this._id).append($('<div id="settings' + this._id + '"></div>'));
		$('#settings' + this._id).hide();

		// If lock_scale is set, the scale feature should disable
		$('#settings' + this._id).append($('<input type="checkbox" id="lock_scale' + this._id + '">'));
		// label the checkbox
		$('#settings' + this._id).append($('<label for="#lock_scale' + this._id + '">Lock Time Zoom</label>'));

		$('#settings' + this._id).append($('<hr>'));

		// Issue 3: Add user-mechanism for changing scale
		/* This will be implemented using the html slider */
		$('#timeline_wrapper').append($('<div id="scale_wrapper' + this._id + '"></div>'));
		$('#scale_wrapper' + this._id).text('Time Zoom: ').append(
			'<span id="zoom_range' + this._id + '">' + Timeline._DEFAULT_RANGE_DESCRIPTION + '</span>'
		);
		// use SLIDER_MIN, SLIDER_MAX and SLIDER_STEP above to modify the following line of code!!!
		$('#scale_wrapper' + this._id).append(
			$('<input type="range" id="scale_slider' + this._id + '" min="' + Timeline._SLIDER_MIN + '" max="' + (Timeline._SLIDER_MAX + Timeline._BEYOND_SLIDER_MAX) + '" step="' + Timeline._SLIDER_STEP + '" value="' + Timeline._SLIDER_DEFAULT + '" onchange="Timeline._sliderChangedHandler(' + this._id + ');" />')
		);

		// debug
		//		$('#scale_wrapper' + this._id).append($('<div id="range

		/* The _resizeHandler is called to fit the Timeline on the screen.
		It sets the canvas dimensions, as well as those of the back and 
		forward buttons. General rule of thumb: If a values should change with resize,
		it should be calculated as part of this function.
		*/
		this._resizeHandler = function (self) {
			// First, we clear all style so as to prevent duplicates
			$('#canvas' + self._id).removeAttr('style');
			$('#back' + self._id).removeAttr('style');
			// later we'll insert an empty style before modifying the style.


			// set canvas attributes

			// Width of canvas is window width, with space for borders either 
			// side.
			var canvas_width = $(window).width() - Timeline._BORDER_SIDES;
			var canvas_height = $(window).height() * Timeline._HEIGHT_FACTOR;


			/* The core feature of this block is the z-index. Everything else 
			is there because otherwise I can't determine the z-index. At 
			least that's what I read somewhere.
	       
			The z-index determines how overlapping elements are drawn.
			The higher the z-index, the "closer to the user" the element is.
	       
			In this case, we want to draw everything on top of the canvas,
			hence the lowest z-index in our application: 0.
			*/
			$('#canvas' + self._id).attr('style', '');
			// this undoes our removeAttr('style') from earlier

			self._canvas.setAttribute('width', canvas_width);
			self._canvas.setAttribute('height', canvas_height);
			$('#canvas' + self._id).css({
				//width: canvas_width,
				//height: canvas_height,
				border: '1px solid', // to see what's going on
				position: 'relative', // "take canvas out of flow"-rough quote
				top: Timeline._BORDER_TOP, // seems to be the chrome default
				left: Timeline._BORDER_LEFT, // ditto
				'z-index': 0
			});

			/* Here we define the back button's visual properties. 
			Where possible, we calculate them in terms of canvas attributes,
			to achieve a consistent layout as the browser is resized.
			*/
			var back_left = $('#canvas' + self._id).css('left') + 'px';
			// same distance from left timeline_wrapper as canvas

			// This one is a little more difficult: An explanation will follow
			// as soon as I've figured it out myself.
			var back_top = ((-1) * $('#canvas' + self._id).height() - 6) + 'px';

			$('#back' + self._id).attr('style', '');
			$('#back' + self._id).css({
				'background-color': '#336699',
				width: Timeline._BUTTON_WIDTH,
				height: $('#canvas' + self._id).height(), // fill canvas height
				position: 'absolute', // same reason as for canvas
				bottom: Timeline._MAGIC_DISTANCE,
				left: '0px',
				'z-index': 1
			});

			// Now, let's define the forward code.
			// forward_left is defined by the space to the left of canvas,
			// plus the width of the canvas, minus the width of the button.
			var forward_left = ($('#canvas' + self._id).css('left') +
				$('#canvas').width() -
				Timeline._BUTTON_WIDTH) + 'px';
			var forward_top = back_top;

			$('#forward' + self._id).attr('style', '');
			$('#forward' + self._id).css({
				'background-color': '#336699',
				width: Timeline._BUTTON_WIDTH,
				height: $('#canvas' + self._id).height(),
				position: 'absolute',
				bottom: Timeline._MAGIC_DISTANCE,
				right: '2px',
				'z-index': 1
			});

			/* The settings panel should be centered at the top of the 
			timeline.
			*/
			$('#settings_wrapper' + self._id).css({
				position: 'absolute',
				width: '200px',
				left: ($('#canvas' + self._id).width() - 200) / 2 + 'px',
				top: '1px', // canvas border thickness, or was it timeline_wrapper?
				'background-color': '#99ccff',
				'z-index': 1
			});

			// where to draw the now tickmark
			self._initialNowX = self._canvas.width / 8;
			self._timelineY = self._canvas.height * 4 / 5 + 0.5;

			// this.draw()

			self._startX = Timeline._START_END_BORDER;
			self._endX = self._canvas.width - Timeline._START_END_BORDER;

			// call resizeHandler to sliderChangedHandler to define rangeMin and minPerPixel
			Timeline._sliderChangedHandler(self._id);

			
			
		};


		this._resizeHandler(this);

		var thisTimeline = this; // todo make this safe for multiple timelines
		$(window).resize(function () {
			thisTimeline._resizeHandler(thisTimeline);
		});

		// and now, finally, the timeline
		this._context = this._canvas.getContext('2d'); // we'll use the context
		// to draw on the canvas in the draw() function.

		// the offset will determine the visible range of time
		this._offsetT = 0; // it begins with 0

		// establish the startDate, endDate, so it may be used in draw
		this._startDate = new Date();
		this._endDate = new Date();

		$('#range_slider' + self._id).change(function () {
			Timeline._sliderChangedHandler(self._id);
		});

		//		// use jquery.mousewheel to scroll the time zoom
		//		$('#canvas' + self._id).mousewheel(function (event, delta) {
		//			alert('test');
		//			$('#range_slider' + self._id).val(parseInt($('#range_slider' + self._id).val()) + delta);
		//		});

		// Issue 11: Scroll nowx and recalculate startDate and endDate when back or forward are clicked
		this._offset = 0;
		self = this;
		$('#back' + self._id).mouseout(function () {
			clearInterval(self._incOffsetInterval);
		}).mouseup(function () {
			clearInterval(self._incOffsetInterval);
		}).mousedown(function () {
			self._incOffsetInterval = setInterval('self._offset++;', 30);
		});

		$('#forward' + self._id).mouseout(function () {
			clearInterval(self._decOffsetInterval);
		}).mouseup(function () {
			clearInterval(self._decOffsetInterval);
		}).mousedown(function () {
			self._decOffsetInterval = setInterval('self._offset--;', 30);
		});

		
	};  // end of setup

	/*
	timeline.draw()
	Update (or set for the first time) the styles of back and forward button,
	as well as the canvas.
	Assumes setup has been called.

	Implementation: 
	All times are calculated as an offset from NOW before being displayed on the timeline.
	*/
	this.draw = function () {
		// calculate nowX as a function of initialNowX
		this._nowX = this._initialNowX + this._offset;

		// let's find out what time it is.
		this._nowDate = new Date();

		this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

		var gradient = this._context.createLinearGradient(0, 0, this._canvas.width, 0);
		gradient.addColorStop(0, 'orange');
		gradient.addColorStop(1, 'white');
		this._context.fillStyle = gradient;
		this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);

		this._context.lineWidth = 1;
		// draw timeline
		this._context.beginPath();
		this._context.moveTo(0, this._timelineY);
		this._context.lineTo(this._canvas.width, this._timelineY);
		this._context.closePath();
		this._context.stroke();

		// draw tickmark for now
		Timeline._drawTick(this, this._nowX, Timeline._NOW_TICKMARK_HALF_LENGTH);


		// draw Tickmarks for start and end
		// start
		Timeline._drawTick(this, this._startX, Timeline._NOW_TICKMARK_HALF_LENGTH);

		// end
		Timeline._drawTick(this, this._endX, Timeline._NOW_TICKMARK_HALF_LENGTH);

		// calculate the time of startX
		/*
		* segmentTime = (segmentPixels / totalPixels) * totalTime
		* startTime = nowTime - segmentTime
		* startTime = nowTime - (segmentPixels / totalpixels * totalTime)
		*/
		var totalPixels = this._endX - this._startX;
		var segmentPixels = this._nowX - this._startX;
		var startTime = this._nowDate.getTime() - Math.floor(segmentPixels / totalPixels * this._rangeInMilliseconds);
		this._startDate.setTime(startTime);

		// calculate the time of endX
		var endTime = this._nowDate.getTime() + Math.floor((this._rangeInMilliseconds / totalPixels) * (this._endX - this._nowX));
		this._endDate.setTime(endTime);
		// Issue 7: Label startx, nowX and endx
		function drawText(text, x, y, timeline) {
			timeline._context.beginPath();
			timeline._context.font = '14px mono sans serif';
			timeline._context.strokeText(text, Math.floor(x) + 0.5, Math.floor(y) + 0.5);
			timeline._context.closePath();
			timeline._context.stroke();
		}

		function formatDate(date) {
			str = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
			return str;
		}

		function formatTime(date) {
			str = date.getHours() + ':' + (date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes());
			return str;
		}

		var fontSize = 14;
		var padding = 1;
		// startx
		drawText(formatDate(this._startDate), this._startX, this._timelineY + Timeline._DAY_TICKMARK_HALF_LENGTH, this);
		drawText(formatTime(this._startDate), this._startX, this._timelineY + Timeline._DAY_TICKMARK_HALF_LENGTH + fontSize, this);
		drawText('past', this._startX, this._timelineY - Timeline._DAY_TICKMARK_HALF_LENGTH - padding, this);

		// nowX
		drawText(formatDate(this._nowDate), this._nowX, this._timelineY + Timeline._DAY_TICKMARK_HALF_LENGTH, this);
		drawText(formatTime(this._nowDate), this._nowX, this._timelineY + Timeline._DAY_TICKMARK_HALF_LENGTH + fontSize, this);
		drawText('now', this._nowX, this._timelineY - Timeline._DAY_TICKMARK_HALF_LENGTH - padding, this);

		// endX
		var endXtext = this._endX - this._context.measureText(formatDate(this._endDate)).width;
		drawText(formatDate(this._endDate), endXtext, this._timelineY + Timeline._DAY_TICKMARK_HALF_LENGTH, this);
		drawText(formatTime(this._endDate), endXtext, this._timelineY + Timeline._DAY_TICKMARK_HALF_LENGTH + fontSize, this);
		drawText('future', endXtext, this._timelineY - Timeline._DAY_TICKMARK_HALF_LENGTH - padding, this);

		// Todo 9: Add tickmarks for hours, days, etc
		// begin by calculating the position of the latest full hour


		Timeline._timeToX = function (timeline, pixelsPerMs, time) {
			// calculate how many minutes are in a pixel
			var x = timeline._nowX + (time - timeline._nowDate.getTime()) * pixelsPerMs;
			return x;
		}

		var latestFullHour = Math.floor(this._endDate.getTime() / Timeline._MS_PER_HOUR) * Timeline._MS_PER_HOUR;
		var latestFullHourX = Timeline._timeToX(this, this._nowX, this._pixelsPerMs, latestFullHour);

		// calculate all hours between end and start
		Timeline._drawHours = function (timeline, hour) {
			if (hour <= timeline._startDate.getTime()) {
				return;
			}

			Timeline._drawTick(timeline, Timeline._timeToX(timeline, timeline._pixelsPerMs, hour), Timeline._HOUR_TICKMARK_HALF_LENGTH);

			Timeline._drawHours(timeline, hour - Timeline._MS_PER_HOUR);
		}

		// calculate how many minutes are in a pixel

		Timeline._drawHours(this, latestFullHour);
	};
}