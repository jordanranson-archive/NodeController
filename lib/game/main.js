ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',
	'impact.debug.debug',

	'game.enums',
	'game.entities.node',

	'fss.fss'
)
.defines(function(){

Game = ig.Game.extend({
	clearColor: '#222',
	playerColor: Color.red,
	fonts: {
		lato: new ig.Font( 'media/lato.png' ),
		latoLight: new ig.Font( 'media/lato-light.png' )
	},


	init: function() {
		ig.input.initMouse();
		ig.input.bind( ig.KEY.MOUSE1, 'action' );

		this.spawnEntity( 'EntityNode', 128+25, 128+25, { virus: 5, vaccine: 3, data: 12, threads: 1, production: 1 } );
		this.spawnEntity( 'EntityNode', 896-100, 128+100, { virus: 45, vaccine: 35, data: 40, threads: 5, production: 3 } );
		this.spawnEntity( 'EntityNode', 512-120, 640-56, { team: Color.red } );
	},
	

	update: function() {
		this.parent();
	},
	

	draw: function() {
		this.parent();
		
		var x = ig.system.width/2,
			y = ig.system.height/2;
	}
});

ig.main( '#canvas', Game, 60, 1024, 768, 1 );

});
