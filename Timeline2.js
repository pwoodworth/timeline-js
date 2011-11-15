/*
	Timeline2.js
	Joshua Marshall Moore
	Thursday, November 10, 2011
*/

Constants = {
	style: {
		border_sides: 20,
		button_width: 17, // the length of the back and forward buttons
		body_margins: 8,
		scale_margin: 5,
		start_end_border: 40,
		
		/* Window height * this value = canvas height */
		height_factor: 3/5,
		
		offset_left: '8px',
		offset_top: '8px', // top border, 8px seem to be the chrome default
		magic_distance: '6px',
		
		button_color: '#336699',
		settings_color: '#99ccff',
	},
	
	/* Some time constants */
	ms_per: {
		minute: 60*1000,
		hour: 60 * 1000 * 60,
		day:  24 * 60 * 1000 * 60,
		week: 7 * 24 * 60 * 1000 * 60,
		// these are for math, not entirely accurate:
		month: 4 * 7 * 24 * 60 * 1000 * 60,
		year: 12 * 4 * 7 * 24 * 60 * 1000 * 60
	},
	
	slider: {
		min: 0,
		max: 100,
		step: 0.25,
		_default: 50,
		beyond_max: 80
	},
	
	half: {
		now: 15,
		minute: 5,
		hour: 10,
		day: 15,
		week: 20,
		month: 25,
		year: 30
	},
	
	settings: {
		fadeTime: 500
	},
	
	strings: {
		range_description: {
			seconds: "Seconds",
			minutes: "Minutes",
			hours: "Hours",
			days: "Days",
			weeks: "Weeks",
			months: "Months",
			_default: "Seconds"
		}
	},
	
	text: {
		font: '14px mono sans serif',
		fontSize: 14,
		padding: 1
	},
	
	pixels: {
		minute_min: 1,
		hour_min: 10,
		day_min: 10,
		week_min: 10,
		month_min: 10,
		year_min: 10
	}
}

State = {
	rangeInMs: null,
	pixelsPerMs: null,
	startX: null,
	endX: null,
	nowX: null,
	
	timelineY: null,
	initialNowX: null,
	
	context: null,
	offsetT: null
}

Helper = {
	showSettings: function(){
		$('#settings').show(Constants.settings.fadeTime).children.show();
		$('#showHideSettings').attr('href', 'javascript:Helper.hideSettings()');
	},
	
	hideSettings: function(){
		$("#settings").hide(Constants.settings.fadeTime);
		$("#showHideSettings").attr("href", "javascript:Helper.showSettings()");
	},
	
	scale: function(value){
		var minIn = Constants.slider.min;
		var maxIn = Constants.slider.max;
		
		var minOut = Math.log(Constants.ms_per.minute);
		var maxOut = Math.log(Constants.ms_per.year);
		
		var scale = (maxOut - minOut) / (maxIn - minIn);
		
		return Math.exp(minOut + scale * (value - minIn));
	},
	
	calcPixelsPerMs: function(){
		State.pixelsPerMs = State.endX - State.startX / State.rangeInMs;
	},
	
	conversion: {
		msToMin: function(_ms){
			return _ms / Constants.ms_per.min;
		},
	
		minToMs: function(_min){
			return _min * Constants.ms_per.min;
		},
	
		timeToX: function(_time){
			var x = (((State.endX - State.startX) * (_time - State.startDate.getTime())) / (State.endDate.getTime() - State.startDate.getTime())) + State.startX;
			
			return x;
		}
	},
	
	handler: {
		sliderChanged: function(){
			// get value from scale_slider and scale it
			var val = Helper.scale($("#scale_slider").val());
			var rangeDescription = Constants.strings.range_description._default;
			
			if (Constants.ms_per.minute <= val && val < Constants.ms_per.hour){
				rangeDescription = Constants.strings.range_description.minutes;
			}else if (Constants.ms_per.hour <= val && val < Constants.ms_per.day){
				rangeDescription = Constants.strings.range_description.hours;
			}else if (Constants.ms_per.day <= val && val < Constants.ms_per.week){
				rangeDescription = Constants.strings.range_description.days;
			}else if (Constants.ms_per.week <= val && val < Constants.ms_per.month){
				rangeDescription = Constants.strings.range_description.weeks;
			}else if (Constants.ms_per.month <= val){
				rangeDescription = Constants.strings.range_description.months;
			}
			
			$("#soom_range").text(rangeDescription);
			
			State.rangeInMs = val;
			Helper.calcPixelsPerMs();
		},
	
		resize: function(){
			// First we clear all style so as to prevent duplicates
			$('#canvas').removeAttr('style');
			$('#back').removeAttr('style');
			$('#forward').removeAttr('style');
			// later, we'll insert an empty style before modifying the style
			
			// Set canvas attributes
			
			// Width of canvas is window width, with space
			var canvas_width = $(window).width() - Constants.style.border_sides;
			var canvas_height = $(window).height() * Constants.style.height_factor;
			
			/* 
				The core feature of this block is the z-index.
				Everything else is here because otherwise the z-index
				can't be determined. At least that's what I read some
				where when I first started this project.
				
				The z-index determines how overlapping elements are
				drawn. 
				
				In this case, we want to draw everything on top of
				the canvas, hence the the lowest z-index in this
				application: 0.
			*/
			$('#canvas').attr('style', ''); // this undoes our removeAttr(style) from earlier
			
			Elements.canvas.setAttribute('width', canvas_width);
			Elements.canvas.setAttribute('height', canvas_height);
			$('#canvas').css({
				// border: '1px solid', // to see what's going on
				position: 'relative', // take canvas out of flow - rough quote
				top: Constants.style.border_top, // seems to be the chrome default
				left: Constants.style.border_left, // ditto
				'z-index': 0
			});
			
			/* 
				Here we define the back button's visual properties
				Where possible, we calculate them in terms of canvas
				attributes, to achieve a consistent layout as the 
				browser is resized.
			*/
			var back_left = $('#canvas').css('left') + 'px'; // same distance from left timeline wrapper as canvas
			
			var back_top = ((-1) * $('#canvas').height() - 6) + 'px';
			
			$('#back').attr('style', '');
			$('#back').css({
				'background-color': Constants.style.button_color,
				width: Constants.style.button_width,
				height: $('#canvas').height(), // fill canvas height
				position: 'absolute', // same reason as for canvas
				bottom: Constants.style.magic_distance,
				left: '0px',
				'z-index': 1
			});
			
			/* 
				Now, let's define the forward code.
				forward_left is define by the space to the left of the
				canvas, plus the width of the canvas, minus the width
				of the button.
			*/
			var forward_left = ($('#canvas').css('left') + $('#canvas').width() - Constants.style.button_width) + 'px';
			var forward_top = back_top;
			
			$('#forward').attr('style', '');
			$('#forward').css({
				'background-color': Constants.style.button_color,
				width: Constants.style.button_width,
				height: $('#canvas').height(),
				position: 'absolute',
				bottom: Constants.style.magic_distance,
				right: '2px',
				'z-index': 1
			});
			
			/*
				The settings panel should be centered at the top of 
				the timeline.
			*/
			$('#settings_wrapper').css({
				position: 'absolute',
				width: '200px',
				left: (($('#canvas').width() - 200) / 2) + 'px',
				top: '1px',
				'background-color': Constants.style.settings_color,
				'z-index': 1
			});
			
			// where to draw the now tickmark
			State.initialNowX = Elements.canvas.width / 8;
			State.timelineY = Elements.canvas.height * 4 / 5 + 0.5;
			
			State.startX = Constants.style.start_end_border;
			State.endX = Elements.canvas.width - Constants.style.start_end_border;
			
			Helper.handler.sliderChanged();
		}
	},
	
	drawTick: function(_x, _half_y){
		State.context.beginPath();
		
		State.context.moveTo(_x, State.timelineY - _half_y);
		State.context.lineTo(_x, State.timelineY + _half_y);
		
		State.context.closePath();
		State.context.stroke();
	},
	
	drawText: function(_text, _x, _y){
		State.context.beginPath();
		State.context.font = Constants.text.font;
		State.context.strokeText(_text, Math.floor(_x) + 0.5, Math.floor(_y) + 0.5);
		State.context.closePath();
		State.context.stroke();
	},
	
	format:{
		date: function (_date){
			var str = (_date.getMonth() + 1) + '/' + _date.getDate() + '/' + _date.getFullYear();
			return str;
		},
		
		time: function(_date){
			var str = _date.getHours() + ':' + (_date.getMinutes() > 9 ? _date.getMinutes() : '0' + _date.getMinutes());
			return str;
		}
	},
	
	distance_between: {
	
		/*
			Calculates how much space is in between two, including one, hour tickmarks.
			Requires State.startDate, State.endDate, State.startX, State.endX
		*/
		minutes: function(){
			var pixels = (State.endX - State.startX * Constants.ms_per.minute) / (State.endDate.getTime() - State.startDate.getTime());
			return pixels;
		},
		
		hours: function(){
			var pixels = (State.endX - State.startX) * Constants.ms_per.hour / (State.endDate.getTime() - State.startDate.getTime());		
			return pixels;
		},
	
		days: function(){
			var pixels = (State.endX - State.startX) * Constants.ms_per.day / (State.endDate.getTime() - State.startDate.getTime());
			return pixels;
		},
		
		weeks: function(){
			var pixels = (State.endX - State.startX) * Constants.ms_per.week / (State.endDate.getTime() - State.startDate.getTime());
			return pixels;
		},
		
		months: function(){
			var pixels = (State.endX - State.startX) * Constants.ms_per.month / (State.endDate.getTime() - State.startDate.getTime());
			return pixels;
		},
		
		years: function(){
			var pixels = (State.end_X - State.startX) * Constants.ms_per_month / (State.endDate.getTime() - State.startDate.getTime());
			return pixels;
		}
	},
	
	isFull: {
		// determines whether a given time is 2400 hrs
		day: function(_time){
			var date = new Date(_time);
			return date.getHours() == 0;
		},
		
		week: function(_time){
			var date = new Date(_time);
			return date.getDay() == 0;
		},
		
		month: function(_time){
			var date = new Date(_time);
			return date.getDate() == 0;
		},
		
		year: function(_time){
			// assumes _time to be the beginning of a day
			var date = new Date(_time);
			return date.getDate() == 0 && date.getMonth() == 0;
		}
		
	},
	
	/* 
		The latest_full.hour and day functions exploit the fact that 
		the epoch began at on a full hour, and a full day (Midnight, January 1, 1970)
	*/
	latest_full: {
		hour: function(){
			Math.floor(State.endDate.getTime() / Constants.ms_per.hour) * Constants.ms_per.hour;
		}, 
		
		day: function(){
			Math.floor(State.endDate.getTime() / Constants.ms_per.day) * Constants.ms_per.day;
		}
	}
};

Elements = {
	canvas: null,
	back: null,
	forward: null,
	settings: null
};

function Timeline(){
	this.setup = function(_wrapper_id){
		// add canvas
		var jq_wrapper_id = '#' + _wrapper_id;
		$(jq_wrapper_id).css('position', 'relative');
		
		Elements.canvas = document.createElement('canvas');
		Elements.canvas.setAttribute('id', 'canvas');
		Elements.canvas.setAttribute('width', $(window).width() - Constants.style.body_margins * 2);
		Elements.canvas.setAttribute('height', $(window).height() - Constants.style.body_margins * 2);
		$('#' + _wrapper_id).append(Elements.canvas);
		
		// add back button
		Elements.back = document.createElement('div');
		Elements.back.setAttribute('id', 'back');
		$(jq_wrapper_id).append(Elements.back);
		
		// add forward button
		Elements.forward = document.createElement('div');
		Elements.forward.setAttribute('id', 'forward');
		$(jq_wrapper_id).append(Elements.forward);
		
		// add a settings panel
		$(jq_wrapper_id).append($('<div id="settings_wrapper"><center><a id="showHideSettings" href="javascript:Helper.showSettings();">Settings</a></center></div>'));
		
		// Add some settings to the settings panel
		
		$("#settings_wrapper").append($('<div id="settings"></div>'));
		$('#settings').hide();
		
		// If lock scale is set, the scale feature should be disabled.
		
		// ... skipped for now
		
		$('#settings').append('<hr>');
		
		$(jq_wrapper_id).append($('<div id="scale_wrapper"></div>'));
		$('#scale_wrapper').text('Time Zoom: ').append('<span id="zoom_range">' + Constants.strings.range_description._default);
		
		// Use slider.min, slider.max and slider.step above to modify the following line of code!!!
		$('#scale_wrapper').append($('<input type="range" id="scale_slider" min="' + Constants.slider.min + '" max="' + (Constants.slider.max + Constants.slider.beyond_max) + '" step="' + Constants.slider.step + '" value="' + Constants.slider._default + '" onchange="Helper.handler.sliderChanged();" />'));
		
		Helper.handler.resize();
		
		$(window).resize(Helper.handler.resize());
		
		/* 
			We'll use the context to draw on the canvas in the draw
			function.
		*/
		State.context = Elements.canvas.getContext('2d');
		
		// The offset will determine the visible range of time.
		State.offsetT = 0;
		
		State.startDate = new Date();
		State.endDate = new Date();
		
		$('#range_slider').change(Helper.handler.sliderChanged);
		
		/* 
			Scroll nowX and recalculate startDate and endDate when
			back or forward are clicked.
		*/
		State.offset = 0;
		self = this;
		$('#back').mouseout(function(){
			clearInterval(State.incOffsetInterval);
		}).mouseup(function(){
			clearInterval(State.incOffsetInterval);
		}).mousedown(function(){
			State.incOffsetInterval = setInterval('State.offset += 2;', 30);
		});
		
		$('#forward').mouseout(function(){
			clearInterval(State.decOffsetInterval);
		}).mouseup(function(){
			clearInterval(State.decOffsetInterval);
		}).mousedown(function(){
			State.decOffsetInterval = setInterval('State.offset -= 2', 30);
		});
		
		// setup the gradient for use in the draw function
		State.gradient = State.context.createLinearGradient(0, 0, Elements.canvas.width, 0);
		State.gradient.addColorStop(0, 'orange');
		State.gradient.addColorStop(1, 'white');
	}; // end of setup
	
	this.draw = function(){
		// calculate nowX as a function of initialNowX and offset
		State.nowX = State.initialNowX + State.offset;
		
		// let's find out what time it is
		State.nowDate = new Date();
		
		State.context.clearRect(0, 0, Elements.canvas.width, Elements.canvas.height);
		
		// gradient was here
		State.context.fillStyle = State.gradient;
		State.context.fillRect(0, 0, Elements.canvas.width, Elements.canvas.height);
		State.context.fill();
		
		State.context.lineWidth = 1;
		//draw timeline
		State.context.beginPath();
		State.context.moveTo(0, State.timelineY);
		State.context.lineTo(Elements.canvas.width, State.timelineY);
		State.context.closePath();
		State.context.stroke();
		
		// draw tickmark for now
		Helper.drawTick(State.nowX, Constants.half.now);
		
		// draw Tickmarks for start and end
		// start
		Helper.drawTick(State.startX, Constants.half.now);
		
		// end
		Helper.drawTick(State.endX, Constants.half.now);
		
		// calculate the time of startx
		var totalPixels = State.endX - State.startX;
		var segmentPixels = State.nowX - State.startX;
		var startTime = State.nowDate.getTime() - Math.floor(segmentPixels / totalPixels * State.rangeInMs);
		State.startDate.setTime(startTime);
		
		// calculate the time of endX
		var endTime = State.nowDate.getTime() + Math.floor((State.rangeInMs / totalPixels) * (State.endX - State.nowX));
		State.endDate.setTime(endTime);
		
		// label start ...
		// ... date
		Helper.drawText(Helper.format.date(State.startDate), State.startX, State.timelineY, Constants.half.day);
		// ... time
		Helper.drawText(Helper.format.time(State.startDate), State.startX, State.timelineY + Constants.half.day + Constants.text.fontSize);
		
		// label past
		Helper.drawText('past', State.startX, State.timelineY - Constants.half.day - Constants.text.padding);
		
		
		// label now ...
		// ... date
		Helper.drawText(Helper.format.date(State.nowDate), State.nowX, State.timelineY, Constants.half.day);
		// ... time
		Helper.drawText(Helper.format.time(State.nowDate), State.nowX, State.timelineY + Constants.half.day + Constants.text.fontSize);
		
		// label now
		Helper.drawText('now', State.nowX, State.timelineY - Constants.half.day - Constants.text.padding);
		
		
		// label future ...
		var endXText = State.endX - State.context.measureText(Helper.format.date(State.endDate)).width;
		// ... date
		Helper.drawText(Helper.format.date(State.endDate), endXText, State.timelineY + Constants.half.day);
		// ... time
		Helper.drawText(Helper.format.time(State.endDate), endXText, State.timelineY + Constants.half.day + Constants.text.fontSize);
		
		// label future
		Helper.drawText('future', endXText, State.timelineY - Constants.half.day - Constants.text.padding);
		
		// DRAW TICKMARKS FOR HOURS, DAYS, AND WEEKS
		/* 
			The following code is optimizes for the case where
			decrementing by hours becomes expensive, despite hours
			not being shown. 
			
			Hours and weeks are not shown on the same line.
		*/
		
		var endT = State.endDate.getTime();
		var latestFullHour = Math.floor(endT / Constants.ms_per.hour) * Constants.ms_per.hour;
		var latestFullDay = Math.floor(endT / Constants.ms_per.day) * Constants.ms_per.day;

		
		var hourPixels = Helper.distance_between.hours();
		var minutePixels = hourPixels / 60;
		var dayPixels = Helper.distance_between.days();
		var weekPixels = Helper.distance_between.weeks();
		var monthPixels = Helper.distance_between.months();
		var yearPixels = Helper.distance_between.years();
		
		var showMinutes =  (minutePixels >= Constants.pixels.hour_min);
		var showHours = (hourPixels >= Constants.pixels.hour_min);
		var showDays = (dayPixels >= Constants.pixels.day_min);
		var showWeeks = (weekPixels >= Constants.pixels.week_min);
		var showMonths = (monthPixels >= Constants.pixels.month_min);
		var showYears = (yearPixels >= Constants.pixels.year_min);
		
		var latestFullSomething = null;
		var tickmarkDecrement = null;
		
		if(showHours){
			latestFullSomething = latestFullHour;
			tickmarkDecrement = Constants.ms_per.hour;
		}else{
			latestFullSomething = latestFullDay;
			tickmarkDecrement = Constants.ms_per.day;
		}
		
		if(showMinutes){
			var x = 0;
			var latestFullMinute = Math.floor(endT / Constants.ms_per.minute) * Constants.ms_per.minute;
			for(var i = latestFullMinute; i > State.startDate.getTime(); i -= Constants.ms_per.minute){
				x = Helper.conversion.timeToX(i);
				Helper.drawTick(x, Constants.half.minute);
			}
		}
		
		for(var i = latestFullSomething; 
			i >= State.startDate.getTime(); 
			i -= tickmarkDecrement){
			// potentially draw hour tickmarks
			var x = Helper.conversion.timeToX(i)
			if(showHours){
				Helper.drawTick(x, Constants.half.hour);
			}
			
			// potentially draw day tickmarks
			if(showDays){
				Helper.drawTick(x, Constants.half.day);
			}
			
			// potentially draw week tickmarks
			if(showWeeks && Helper.isFull.week(i)){
				Helper.drawTick(x, Constants.half.week);
			}
			
			if(showMonths && Helper.isFull.month(i)){
				Helper.drawTick(x, Constants.half.month);
			}
			
			if(showYears && Helper.isFull.year(i)){
				Helper.drawTick(x, Constants.half.year);
			}
		}
		
		// draw 60 pixels for future reference
		/*
		State.context.beginPath();
		State.context.moveTo(0, 0);
		State.context.lineTo(Elements.canvas.width, Elements.canvas.height);
		State.context.closePath();
		State.context.stroke();
		*/
	};
}

function assert(bool, message){
	if(!bool)
		alert(message);
}