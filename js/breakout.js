// Code principal
( function(){
	"use strict";

	window.Breakout = function( oApplication ){

		// Global params
		var iAnimationRequestId = 0,
			aBricks = [];

		// Background
		var oBackground = {
			"color": "black",
			"render": function() {
				oApplication.context.fillStyle = this.color;
				oApplication.context.fillRect( 0, 0, oApplication.width, oApplication.height );
			}
		};

		// Bricks
		var Brick = function() {
			var iWidth, iHeight;
			iWidth = 25;
			iHeight = 5;
		};

		Brick.prototype.render = function() {
			oApplication.context.fillStyle = "crimson";

		};

		Brick.prototype.update = function() {
			this.render();
		};

		var oPlatform = {
			"width": 100,
			"height": 10,
			"init": function(){},
			"update": function(){},
			"render": function(){}
		};


		// start game
		var init = function() {
			console.log( "Initialising game" );
			// Draw background
			oBackground.render();
			// Generate bricks
			fGenerateBricks();
			// Draw platform
			oPlatform.init();

		};

		var start = function() {
			console.log( "Starting game!" );
			oApplication.canvas.removeEventListener( "click", start );
			fAnimationLoop();
		};

		var fGenerateBricks = function() {
			console.log( "Generating bricks!" );
			for( var i = 0; i < 50 ; i++ ){
				aBricks.push( new Brick );
				console.log( "Created a brick!" );
			}
		};

		// Called at each animation frame request
		var fAnimationLoop = function() {
			iAnimationRequestId = window.requestAnimationFrame( fAnimationLoop );
			// clear canvas
			oApplication.context.clearRect( 0, 0, oApplication.width, oApplication.height );
			// draw background
			oBackground.render();
			// update & draw bricks
			for( var i=0; i < aBricks.length; i+=2 ){
				aBricks[ i ].update();
			}
			// update platform
			oPlatform.update();

			oPlatform.render();
		};

		// Game over
		var fGameOver = function() {
			window.cancelAnimationFrame( iAnimationRequestId );
			window.alert( "Perdu !" );
			// Relancer le jeu
			window.location.reload( true );
		};

		// init game: Loads the spritesheet, then launches a function when it's done loading.
		window.addEventListener( "load", init );
		oApplication.canvas.addEventListener( "click", start );


		// TODO: Modifier la position de platform
		window.addEventListener( "keypress", function( e ){
			if( e.keyCode == 37 ){
				// Left key
				console.log( "Left" );

			} else if( e.keyCode == 39 ) {
				// Right key
				console.log( "Right" );
			}
		} );

	};

} )();