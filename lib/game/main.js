ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font'
)
.defines(function(){

NodeController = ig.Game.extend({
	
	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),
	
	
	init: function() {
		ig.input.initMouse();
        ig.input.bind( ig.KEY.MOUSE1, 'action1' );
        ig.input.bind( ig.KEY.MOUSE2, 'action2' );
        ig.input.bind( ig.KEY.MWHEEL_UP, 'scroll_up' );
        ig.input.bind( ig.KEY.MWHEEL_DOWN, 'scroll_down' );

        this.init3d();
	},


	init3d: function() {
		var canvas = ig.$( '#canvas' );

        this.projector = new THREE.Projector();
        this.renderer = new THREE.WebGLRenderer( { canvas: canvas } );
        this.renderer.setClearColor( 0x12171C );
        this.renderer.sortObjects = false;

        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
        this.camera.rotation.x = 45 * (Math.PI / 180);
        this.camera.position.z = 256;

        this.scene = new THREE.Scene();
        this.scene.add( this.camera );
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        var brightness = 0.95;
        var light = new THREE.AmbientLight( 0xFFFFFF );
        this.scene.add( light );

        var self = this;
        window.addEventListener( 'resize', function() {
            self.camera.aspect = window.innerWidth / window.innerHeight;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize( window.innerWidth, window.innerHeight );
        });
    },

	
	update: function() {
		this.parent();
	},

	
	draw: function() {
		if( this.renderer ) this.renderer.render( this.scene, this.camera );
	}
});

ig.System.inject({
	init: function( canvas, fps, width, height, scale ) {
		this.fps = fps;
		
		this.clock = new ig.Timer();
		this.canvas = canvas;
		this.resize( width, height, scale );
		this.context = this.canvas.getContext('2d');
		
		this.getDrawPos = ig.System.drawMode;

		// Automatically switch to crisp scaling when using a scale
		// other than 1
		if( this.scale != 1 ) {
			ig.System.scaleMode = ig.System.SCALE.CRISP;
		}
		ig.System.scaleMode( this.canvas, this.context );
	}
});


ig.Input.inject({
    initMouse: function() {
        if( this.isUsingMouse ) { return; }
        this.isUsingMouse = true;
        var elem = document.getElementById( 'ui' );
        var mouseWheelBound = this.mousewheel.bind(this);

        elem.addEventListener('mousewheel', mouseWheelBound, false );
        elem.addEventListener('DOMMouseScroll', mouseWheelBound, false );
        
        elem.addEventListener('contextmenu', this.contextmenu.bind(this), false );
        elem.addEventListener('mousedown', this.keydown.bind(this), false );
        elem.addEventListener('mouseup', this.keyup.bind(this), false );
        elem.addEventListener('mousemove', this.mousemove.bind(this), false );
        
        if( ig.ua.touchDevice ) {
            // Standard
            elem.addEventListener('touchstart', this.keydown.bind(this), false );
            elem.addEventListener('touchend', this.keyup.bind(this), false );
            elem.addEventListener('touchmove', this.mousemove.bind(this), false );
            
            // MS
            elem.addEventListener('MSPointerDown', this.keydown.bind(this), false );
            elem.addEventListener('MSPointerUp', this.keyup.bind(this), false );
            elem.addEventListener('MSPointerMove', this.mousemove.bind(this), false );
            elem.style.msTouchAction = 'none';
        }
    },

    mousemove: function( event ) {   
        var elem = document.getElementById( 'canvasUi' );
        
        var pos = {left: 0, top: 0};
        
        var ev = event.touches ? event.touches[0] : event;
        this.mouse.x = (ev.clientX - pos.left) / 4;
        this.mouse.y = (ev.clientY - pos.top) / 4;
    }
});

ig.Animation.inject({
    drawTo: function( targetX, targetY, context ) {
        var bbsize = Math.max(this.sheet.width, this.sheet.height);
        
        // On screen?
        if(
           targetX > ig.system.width || targetY > ig.system.height ||
           targetX + bbsize < 0 || targetY + bbsize < 0
        ) {
            return;
        }
        
        if( this.alpha != 1) {
            context.globalAlpha = this.alpha;
        }
        
        if( this.angle == 0 ) {     
            this.sheet.image.drawTileTo(
                targetX, targetY,
                this.tile, this.sheet.width, this.sheet.height,
                this.flip.x, this.flip.y, context
            );
        }
        else {
            context.save();
            context.translate(
                ig.system.getDrawPos(targetX + this.pivot.x),
                ig.system.getDrawPos(targetY + this.pivot.y)
            );
            context.rotate( this.angle );
            this.sheet.image.drawTileTo(
                -this.pivot.x, -this.pivot.y,
                this.tile, this.sheet.width, this.sheet.height,
                this.flip.x, this.flip.y, context
            );
            context.restore();
        }
        
        if( this.alpha != 1) {
            context.globalAlpha = 1;
        }
    },

    drawTileTo: function( targetX, targetY, tile, tileWidth, tileHeight, flipX, flipY, context ) {
        tileHeight = tileHeight ? tileHeight : tileWidth;
        
        if( !this.loaded || tileWidth > this.width || tileHeight > this.height ) { return; }
        
        var scale = ig.system.scale;
        var tileWidthScaled = Math.floor(tileWidth * scale);
        var tileHeightScaled = Math.floor(tileHeight * scale);
        
        var scaleX = flipX ? -1 : 1;
        var scaleY = flipY ? -1 : 1;
        
        if( flipX || flipY ) {
            context.save();
            context.scale( scaleX, scaleY );
        }
        context.drawImage( 
            this.data, 
            ( Math.floor(tile * tileWidth) % this.width ) * scale,
            ( Math.floor(tile * tileWidth / this.width) * tileHeight ) * scale,
            tileWidthScaled,
            tileHeightScaled,
            ig.system.getDrawPos(targetX) * scaleX - (flipX ? tileWidthScaled : 0), 
            ig.system.getDrawPos(targetY) * scaleY - (flipY ? tileHeightScaled : 0),
            tileWidthScaled,
            tileHeightScaled
        );
        if( flipX || flipY ) {
            context.restore();
        }
        
        ig.Image.drawCount++;
    }
});


ig.Font.inject({
    drawTo: function( text, x, y, align, context ) {
        if( typeof(text) != 'string' ) {
            text = text.toString();
        }
        
        // Multiline?
        if( text.indexOf('\n') !== -1 ) {
            var lines = text.split( '\n' );
            var lineHeight = this.height + this.lineSpacing;
            for( var i = 0; i < lines.length; i++ ) {
                this.draw( lines[i], x, y + i * lineHeight, align );
            }
            return;
        }
        
        if( align == ig.Font.ALIGN.RIGHT || align == ig.Font.ALIGN.CENTER ) {
            var width = this._widthForLine( text );
            x -= align == ig.Font.ALIGN.CENTER ? width/2 : width;
        }
        

        if( this.alpha !== 1 ) {
            context.globalAlpha = this.alpha;
        }

        for( var i = 0; i < text.length; i++ ) {
            var c = text.charCodeAt(i);
            x += this._drawCharTo( c - this.firstChar, x, y, context );
        }

        if( this.alpha !== 1 ) {
            context.globalAlpha = 1;
        }
        ig.Image.drawCount += text.length;
    },
    
    _drawCharTo: function( c, targetX, targetY, context ) {
        if( !this.loaded || c < 0 || c >= this.indices.length ) { return 0; }
        
        var scale = ig.system.scale;
        
        
        var charX = this.indices[c] * scale;
        var charY = 0;
        var charWidth = this.widthMap[c] * scale;
        var charHeight = (this.height-2) * scale;       
        
        context.drawImage( 
            this.data,
            charX, charY,
            charWidth, charHeight,
            ig.system.getDrawPos(targetX), ig.system.getDrawPos(targetY),
            charWidth, charHeight
        );
        
        return this.widthMap[c] + this.letterSpacing;
    }
});


ig.main( ig.$new( 'canvas' ), NodeController, 60, 320, 240, 4 );

});
