ig.module( 
	'game.main' 
)
.requires(
    'impact.debug.debug',
	'impact.game',
	'impact.font',

    'three.three',
    'levelgen.levelgen',

    'game.entities.3d',
    'game.enums',
    'game.player'
)
.defines(function(){

__gameScale = 2;

NodeController = ig.Game.extend({
	
	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),
	zoom: 0.1,
    ready: false,
    nodes: [],
    levelData: {
        shuriken: new ig.Image( 'media/levels/shuriken.png' )
    },
	currLevelData: null,

    player: new Player(),

	init: function() {
		ig.input.initMouse();
        ig.input.bind( ig.KEY.MOUSE1, 'action1' );
        ig.input.bind( ig.KEY.MOUSE2, 'action2' );
        ig.input.bind( ig.KEY.SHIFT, 'alt' );
        ig.input.bind( ig.KEY.MWHEEL_UP, 'scroll_up' );
        ig.input.bind( ig.KEY.MWHEEL_DOWN, 'scroll_down' );

        this.canvas = ig.$( '#canvas' );
        this.canvas.width = Math.ceil( window.innerWidth/__gameScale )*__gameScale;
        this.canvas.height = Math.ceil( window.innerHeight/__gameScale )*__gameScale;

        this.context = this.canvas.getContext( '2d' );
        this.context.imageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.webkitImageSmoothingEnabled = false;

        this.init3d();

        this.loadLevel( this.levelData.shuriken );
	},


	init3d: function() {
		this.canvas3d = ig.$new( 'canvas' );

		// projector for input raycasting
        this.projector = new THREE.Projector();

        // renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: false, canvas: this.canvas3d } );
        this.renderer.setClearColor( 0x222222 );

        // camera
        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 10, 10000 );
		this.camera.position.set( 0, 0, 50 );
    	this.camera.lookAt( new THREE.Vector3(0, 0, 0) );

    	// scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0x222222, 16, 100 );
        this.scene.add( this.camera );

        // set render initial size
        this.renderer.setSize( Math.ceil( window.innerWidth/__gameScale ), Math.ceil( window.innerHeight/__gameScale ) );

        // level rotation angles
        this.rotation = {};
        this.rotation.x = (-45).toRad();
        this.rotation.z = (0).toRad();

        // create lights
        light = new THREE.PointLight( 0xffffff, 1 );
        light.position.x = 0;
        light.position.y = 0;
        light.position.z = 64;
        this.scene.add( light );

        // game area
        this.gameobject = new THREE.Object3D();
	    this.gameobject.rotation.x = this.rotation.x;
	    this.gameobject.rotation.z = this.rotation.z;
	    this.gameobject.position.y = 8;

      	// resize event
        var self = this;
        window.addEventListener( 'resize', function() {
            self.camera.aspect = window.innerWidth / window.innerHeight;
            self.camera.updateProjectionMatrix();

	        self.canvas.width = Math.ceil( window.innerWidth/__gameScale )*__gameScale;
	        self.canvas.height = Math.ceil( window.innerHeight/__gameScale )*__gameScale;
	        self.context.imageSmoothingEnabled = false;
	        self.context.mozImageSmoothingEnabled = false;
	        self.context.webkitImageSmoothingEnabled = false;
            self.renderer.setSize( Math.ceil( window.innerWidth/__gameScale ), Math.ceil( window.innerHeight/__gameScale ) );
        });
    },


    loadLevel: function( image ) {
        this.player.team = Team.ORANGE;

        this.currLevelData = lg.Util.importLevel( image.data );

        var tilemapCvs = ig.$new( 'canvas' );
            tilemapCvs.width = tilemapCvs.height = image.width*16;
        var tilemapCtx = tilemapCvs.getContext( '2d' );
        this.networkChunks = lg.Util.drawTilemap( this.currLevelData.tileMap, tilemapCtx );

        // spawn nodes
        var node, team, active;
        for( var y = 0; y < this.currLevelData.nodeMap.length; y++ ) {
            for( var x = 0; x < this.currLevelData.nodeMap[y].length; x++ ) {
                node = this.currLevelData.nodeMap[y][x];
                if( node !== '.' ) {
                    team = 
                        node === 'A' ? Team.RED :
                        node === 'B' ? Team.GREEN :
                        node === 'C' ? Team.BLUE :
                        node === 'D' ? Team.ORANGE :
                        node === 'E' ? Team.AQUA :
                        node === 'F' ? Team.PURPLE :
                        Team.NONE;
                    active = !(node === 'N')
                    this.spawnEntity( 'Entity3d', x*16-(20*16), y*16-(20*16), { team: team, active: active } );
                }
            }
        }

        this.loadLevel3d();
    },


    loadLevel3d: function() {

        // make the 3d planes
        var planes = new THREE.Object3D();
            planes.matrixAutoUpdate = false;
            planes.updateMatrix();

        var mesh, texture;
        for( var y = 0; y < this.networkChunks.length; y++ ) {
            for( var x = 0; x < this.networkChunks[y].length; x++ ) {
                texture = new THREE.Texture( this.networkChunks[y][x] );
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.needsUpdate = true;

                var plane = new THREE.Mesh( 
                    new THREE.PlaneGeometry( 128, 128 ), 
                    new THREE.MeshBasicMaterial({
                        map: texture
                    })
                );

                plane.position.x = (-20*16) + (128*x) + (128*0.5);
                plane.position.y = (-20*16) + (128*y) + (128*0.5);
                plane.position.y *= -1;
                plane.position.z = -2;
                plane.overdraw = true;

                planes.add( plane );
            }
        }

        // create the level object
        this.level = new THREE.Object3D();

        // draw the grid
        var material = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
        var geometry = new THREE.Geometry();
        var dir, point = -1;

        // rows
        for( var i = 0; i <= 40; i++ ) {
            dir = i % 2 === 0;
            if( dir ) {
                geometry.vertices.push( new THREE.Vector3(0, i*16, 0) );
                geometry.vertices.push( new THREE.Vector3(40*16, i*16, 0) );
            }
            else {
                geometry.vertices.push( new THREE.Vector3(40*16, i*16, 0) );
                geometry.vertices.push( new THREE.Vector3(0, i*16, 0) );
            }
        }

        // columns
        for( var i = 40; i >= 0; i-- ) {
            dir = i % 2 === 0;
            if( dir ) {
                geometry.vertices.push( new THREE.Vector3(i*16, 0, 0) );
                geometry.vertices.push( new THREE.Vector3(i*16, 40*16, 0) );
            }
            else {
                geometry.vertices.push( new THREE.Vector3(i*16, 40*16, 0) );
                geometry.vertices.push( new THREE.Vector3(i*16, 0, 0) );
            }
        }

        this.grid = new THREE.Line( geometry, material );
        this.grid.position.x = -320;
        this.grid.position.y = -320;

        // add the grid to the level
        this.level.position.set( 0, 0, 0 );
        this.level.scale.set( this.zoom, this.zoom, this.zoom );
        this.level.add( this.grid );

        // level border
        material = new THREE.LineBasicMaterial({ color: 0x666666 });
        geometry = new THREE.Geometry();
        geometry.vertices.push( new THREE.Vector3(0, 0, 1) );
        geometry.vertices.push( new THREE.Vector3(40*16, 0, 1) );
        geometry.vertices.push( new THREE.Vector3(40*16, 40*16, 1) );
        geometry.vertices.push( new THREE.Vector3(0, 40*16, 1) );
        geometry.vertices.push( new THREE.Vector3(0, 0, 1) );
        var line = new THREE.Line( geometry, material );
        line.position.x = -320;
        line.position.y = -320;
        this.level.add( line );

        // init entities
        for( var i = 0; i < this.entities.length; i++ ) this.entities[i].init3d();

        // add level to scene
        this.gameobject.add( this.level );
        this.scene.add( this.gameobject );
        
        this.level.add( planes );
        this.ready = true;
    },

	
	update: function() {
		this.parent();

        if( this.ready ) {

            // mouse drag
    		if( ig.input.pressed( 'action2' ) ) {
                this.mouseStart = {};
                this.mouseStart.x = ig.input.mouse.x;
                this.mouseStart.y = ig.input.mouse.y;
                this.dragStart = {};
                this.dragStart.x = this.level.position.x;
                this.dragStart.y = this.level.position.y;
            }
            if( !ig.input.state( 'alt' ) && ig.input.state( 'action2' ) ) {
                var x = ig.input.mouse.x - this.mouseStart.x;
                	x *= 0.1;
                var y = ig.input.mouse.y - this.mouseStart.y;
                	y *= 0.1;

    			this.level.position.x = (this.dragStart.x - (x*-1));
    			this.level.position.y = (this.dragStart.y - y);
            }

            // rotate level
            if( ig.input.state( 'alt' ) && ig.input.state( 'action2' ) ) {
                var z = ig.input.mouse.x - this.mouseStart.x;
                    z *= 0.25;
                this.mouseStart.x = ig.input.mouse.x;
                this.mouseStart.y = ig.input.mouse.y;

                this.level.rotation.z += z.toRad();
            }

            // zoom in and out
            if( ig.input.state( 'scroll_up' ) ) {
            	this.zoom = Math.min( 1, this.zoom+this.zoom*0.15 );
                this.level.scale.setX( this.zoom );
                this.level.scale.setY( this.zoom );
                this.level.scale.setZ( this.zoom );
            }
            if( ig.input.state( 'scroll_down' ) ) {
            	this.zoom = Math.max( 0.1, this.zoom-this.zoom*0.15 );
                this.level.scale.setX( this.zoom );
                this.level.scale.setY( this.zoom );
                this.level.scale.setZ( this.zoom );
            }

            // fade grid opacity
            if( this.zoom < 0.25 ) {
            	//this.grid.material.opacity = (this.zoom*1000-80) / (0.25*1000-80);
            } else {
            	//this.grid.material.opacity = 1;
            }

            // convert 2d pos to 3d space
            var vector = new THREE.Vector3(
                ( ig.input.mouse.x / (window.innerWidth / __gameScale) ) * 2 - 1, 
                -( ig.input.mouse.y / (window.innerHeight / __gameScale) ) * 2 + 1, 
                1 
            );
            this.projector.unprojectVector( vector, this.camera );
            var raycaster = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );
            var intersects = raycaster.intersectObjects( this.nodes, true );

            // event obj to pass to entities
            var evt = {
                x: ig.input.mouse.x,
                y: ig.input.mouse.y
            };

            // hover, click and mouse enter
            if ( intersects.length > 0 ) {
                var obj = intersects[0].object.parent.parent; // crystal/tile -> marker -> node
                if( obj._igEntity ) {
                    if( ig.input.pressed( 'action1' ) ) obj._igEntity.click( evt );
                    obj._igEntity.hover( evt );
                }
            }

        }
	},

	
	draw: function() {
		if( this.renderer ) {
			this.renderer.render( this.scene, this.camera );
			this.context.drawImage( this.canvas3d, 0, 0, this.canvas.width, this.canvas.height );
		}
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
        this.mouse.x = (ev.clientX - pos.left) / __gameScale;
        this.mouse.y = (ev.clientY - pos.top) / __gameScale;
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

ig.main( ig.$new( 'canvas' ), NodeController, 60, 320, 240, 1 );

});
