/* `
Timeline.js
Joshua Marshall Moore

(Requires jquery, developed with jquery-1.4.4.min.js in mind)   
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
	Timeline._MS_PER_MINUTE = 60 * 1000;
	Timeline._MS_PER_HOUR = Timeline._MS_PER_MINUTE * 60.0;
	Timeline._MS_PER_DAY = Timeline._MS_PER_HOUR * 24.0;
	Timeline._MS_PER_WEEK = Timeline._MS_PER_DAY * 7.0;
	Timeline._MS_PER_MONTH = Timeline._MS_PER_WEEK * 4.0;
	Timeline._MS_PER_YEAR = Timeline._MS_PER_MONTH * 12.0;

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
		$('#settings' + id).show().children().show();
		$('#showHideSettings' + id).attr('href', 'javascript:Timeline._hideSettings(' + id + ');');
	};

	Timeline._hideSettings = function (id) {
		$('#settings' + id).hide();
		$('#showHideSettings' + id).attr('href', 'javascript:Timeline._showSettings(' + id + ');');
	};

	Timeline._SLIDER_MIN = 0;
	Timeline._SLIDER_MAX = 100;
	Timeline._SLIDER_STEP = 1;

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
		} else if (Timeline._MS_PER_MONTH <= val && val < Timeline._MS_PER_YEAR) {
			rangeDescription = 'Months';
		} else if (Timeline._MS_PER_YEAR <= val) {
			rangeDescription = 'Years';
		}

		// display the current range to the user
		$('#zoom_range' + id).text(rangeDescription);

		Timeline._timelines[id]._rangeInMilliseconds = val;
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

	// member functions
	/* This function is called when the user clicks the back div*/
	this._backHandler = function () {
		alert('back clicked');
	};

	this._forwardHandler = function () {
		alert('forward clicked');
	};

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

		this._back.onclick = this._backHandler; // set event handler: onclick
		$('#' + timeline_wrapper_id).append(this._back);


		// add forward button
		this._forward = document.createElement('div');
		this._forward.setAttribute('id', 'forward' + this._id);
		this._forward.onclick = this._forwardHandler;
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

		// If stop_moving is set, the timeline should stop scrolling
		$('#settings' + this._id).append($('<input type="checkbox" id="stop_moving' + this._id + '">'));
		// label the checkbox
		$('#settings' + this._id).append($('<label for="#stop_moving' + this._id + '">Stop moving the timeline</label><br>'));

		// If lock_scale is set, the scale feature should disable
		$('#settings' + this._id).append($('<input type="checkbox" id="lock_scale' + this._id + '">'));
		// label the checkbox
		$('#settings' + this._id).append($('<label for="#lock_scale' + this._id + '">Lock Time Zoom</label>'));

		$('#settings' + this._id).append($('<hr>'));

		// Issue 3: Add user-mechanism for changing scale
		/* This will be implemented using the html slider */
		$('#timeline_wrapper').append($('<div id="scale_wrapper' + this._id + '"></div>'));
		$('#scale_wrapper' + this._id).text('Time Zoom: ').append('<span id="zoom_range' + this._id + '">Minutes</span>');
		// use SLIDER_MIN, SLIDER_MAX and SLIDER_STEP above to modify the following line of code!!!
		$('#scale_wrapper' + this._id).append($('<input type="range" id="scale_slider' + this._id + '" min="' + Timeline._SLIDER_MIN + '" max="' + Timeline._SLIDER_MAX + '" step="' + Timeline._SLIDER_STEP + '" value="' + Timeline._SLIDER_MIN + '" onchange="Timeline._sliderChangedHandler(' + this._id + ');" />'));

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
				top: '0px',
				'background-color': '#99ccff',
				'z-index': 1
			});

			// where to draw the now tickmark
			self._nowX = self._canvas.width / 8;
			self._timelineY = self._canvas.height * 4 / 5 + 0.5;

			// this.draw()

			self._startX = Timeline._START_END_BORDER;
			self._endX = self._canvas.width - Timeline._START_END_BORDER;

			// call resizeHandler to sliderChangedHandler to define rangeMin and minPerPixel
			Timeline._sliderChangedHandler(self._id);

			// calculate how many minutes are in a pixel
			self._minutesPerPixel = self._rangeInMinutes / (self._endX - self._startX);
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
	};

	/*
	timeline.draw()
	Update (or set for the first time) the styles of back and forward button,
	as well as the canvas.
	Assumes setup has been called.

	Implementation: 
	All times are calculated as an offset from NOW before being displayed on the timeline.
	*/
	this.draw = function () {
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
		console.log(this._nowDate.toString() + '\n' + this._startDate.toString());
		// console.log(this._rangeInMilliseconds + ', ' + this._startDate.toString());
	};
}