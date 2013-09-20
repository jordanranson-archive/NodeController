ig.module(
	'game.entities.3d'
)
.requires(
	'impact.entity'
)
.defines(function(){

Entity3d = ig.Entity.extend({
    size: { x: 16, y: 16 },
    

    init: function( x, y, settings ) {
        this.parent( x, y, settings );
    },
    
    
    init3d: function() {
        this.marker = new THREE.Object3D();

        // tile marker
        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry( 14, 14 ), 
            new THREE.MeshLambertMaterial({
                color: 0xCCCCCC,
                wireframe: true,
                shading: THREE.FlatShading
            })
        );
        mesh.overdraw = true;
        mesh.position.x = (this.pos.x + this.size.x*0.5);
        mesh.position.y = -(this.pos.y + this.size.y*0.5);
        mesh.position.z = 0.1;
        mesh.name = 'tile-marker';
        this.marker.add( mesh );

        // crystal
        mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry( 8 ), 
            new THREE.MeshLambertMaterial({
                color: 0xFF0000,
                wireframe: false,
                shading: THREE.FlatShading
            })
        );
        mesh.overdraw = true;
        mesh.position.x = (this.pos.x + this.size.x*0.5);
        mesh.position.y = -(this.pos.y + this.size.y*0.5);
        mesh.position.z = 16;
        mesh.name = 'crystal';
        this.marker.add( mesh );

        var light = new THREE.SpotLight( 0xFFFFFF );
        light.position.x = (this.pos.x + this.size.x*0.5);
        light.position.y = -(this.pos.y + this.size.y*0.5);
        light.position.z = 128;
        light.target = mesh;
        ig.game.level.add( light );

        ig.game.level.add( this.marker );
    },

    update: function() {
        this.parent();

        var crystal = this.marker.getObjectByName( 'crystal' );
        crystal.rotation.x += 0.02;
        crystal.rotation.y += 0.0225;
        crystal.rotation.z += 0.0175;
    }
});

});