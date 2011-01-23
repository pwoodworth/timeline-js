/* 
   Timeline.js

   (Requires jquery, developed with jquery-1.4.4.min.js in mind)   
*/

/*
  Timeline's two major functions are setup and draw. After instantiating a 
  timeline object, the developer calls setup() to initialize the object. Later,
  the developer repeatedly calls on draw() to animate the canvas.
  In between, resizing the window may trigger the resize() function which 
  adjusts the timeline's dimensions and other settings.
*/
function Timeline(){
    // constants
    Timeline._BORDER_SIDES = 20; // The border on each side of the timeline,
    // We'll need this value later when calculating back's top offset
    Timeline._OFFSET_LEFT = '8px'; 
    Timeline._OFFSET_TOP = '8px'; // top border, 8px seems to be chrome default
    Timeline._BUTTON_WIDTH = 17; // The length of the back and forward buttons
    Timeline._WIDTH_FACTOR = 2/3; // How much height timeline should take up
    Timeline._MAGIC_DISTANCE = '6px'; // I don't know why this number works for
    // all sizes, but it does. Maybe it has something to do with the margin
    // of eight
    Timeline._BODY_MARGINS = 8;

    // variables
    Timeline._id = 0; // An id wich is unique for each instance of Timeline
    

    /* This function is called when the user clicks the back div*/
    this._backHandler = function(){
	alert('back clicked');
    };

    this._forwardHandler = function(){
	alert('forward clicked');
    };

    this._testResize = function(){
	alert('resized');
    };


    /*
      timeline.setup()
      Create canvas, back and forward button, as well as slider for scale.
      timeline_wrapper_id is the id of an element which is to contain this
      specific timeline. 
     */
    this.setup = function(timeline_wrapper_id){

	// add canvas
	this._id = Timeline._id++; // get id, create next id for next instance
	this._timeline_wrapper_id = timeline_wrapper_id;
	$('#' + timeline_wrapper_id).css('position', 'relative'); 
	// Thanks to css-tricks.com/absolute-positioning-inside-relative-positioning


	this._canvas = document.createElement('canvas');
	this._canvas.setAttribute('id', 'canvas' + this._id);
	$('#' + timeline_wrapper_id).append(this._canvas);

	this._context = this._canvas.getContext('2d'); // we'll use the context
	// to draw on the canvas in the draw() function.

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
	$('#' + timeline_wrapper_id).append($('<div id="settings' + this._id + '"><center>Timeline Settings <a id="showhideSettings" href="javascript:showHideSettings()">-</a></center></div>'));
	// Add some settings to the settings panel
	// If stop_moving is set, the timeline should stop scrolling
	$('#settings' + this._id).append($('<input type="checkbox" id="stop_moving' + this._id + '">'));
	// label the checkbox
	$('#settings' + this._id).append($('<label for="#stop_moving' + this._id + '">Stop moving the timeline</label>'));

	/* The _resizeHandler is called to fit the Timeline on the screen.
	   It sets the canvas dimensions, as well as those of the back and 
	   forward buttons.
	 */
	this._resizeHandler = function(self){
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
	    $('#canvas'+self._id).attr('style', ''); 
	    // this undoes our removeAttr('style') from earlier

	    $('#canvas' + self._id).css({
		width: canvas_width,
		height: canvas_height,
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
	    var back_top = ((-1)*$('#canvas' + self._id).height() - 6) + 'px';
	    
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
	    
	    $('#forward' + self._id).attr('style' ,'');
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
	    $('#settings' + this._id).css({
		position: 'absolute',
		width: '200px',
		left: ($('#canvas' + this._id).width() - 200)/2 + 'px',
		top: '0px',
		'background-color': '#99ccff',
		'z-index': 1
	    });
	};
	
	
	this._resizeHandler(this);
	var thisTimeline = this;
	$(window).resize(function(){
	    thisTimeline._resizeHandler(thisTimeline);
	});
    };

    /*
      timeline.draw()
      Update (or set for the first time) the styles of back and forward button,
      as well as the canvas.
      Assumes setup has been called.
     */
    this.draw = function(){
	// First, we have to determine what the time is
    };
}