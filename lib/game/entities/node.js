ig.module( 
	'game.entities.node' 
)
.requires(
	'impact.entity',
	'game.enums'
)
.defines(function(){

EntityNode = ig.Entity.extend({
	size: { x: 0, y: 0 },
	team: Color.gray,
	virus: 0,
	vaccine: 0,
	data: 10,
	threads: 0,
	backbuffer: ig.$new( 'canvas' ),
	backbufferCtx: null,


	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.backbuffer.width = this.backbuffer.height = 384;
		this.backbufferCtx = this.backbuffer.getContext( '2d' );
	},
	

	update: function() {
		this.parent();
	},
	

	draw: function() {
		this.parent();

		var w = 192;
		var ctx = this.backbufferCtx;
		ctx.save();

		// data
		ctx.fillStyle = this.team;
		ctx.beginPath();
		ctx.arc( w, w, 10, 0, Math.PI*2, true ); 
		ctx.closePath();
		ctx.fill();
		ig.system.context.drawImage( this.backbuffer, this.pos.x-w, this.pos.y-w )

		ctx.restore();

	}
});

});
