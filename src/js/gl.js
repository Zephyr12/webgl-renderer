class Geometry {
    constructor(mesh_id, material_id) {
        this.mesh = mesh_id;
        this.material = material_id;
    }
}

class Material {

    constructor(uniforms, program_id){
        this.uniforms = uniforms;
        this.program_id = program_id;
    }
}


class PointLight {
    constructor(color, intensity){
        color = vec3.clone(color);
        this.color = color;
        this.intensity = intensity;
        this.radius = Math.sqrt(100 * vec3.length(color) * intensity);
    }
}

class DirectionalLight {
    constructor(color, intensity) {
        color = vec3.clone(color)
        this.color = color;
        this.intensity = intensity;
    }
}

class Camera {
    constructor(fov, aspect_ratio, orthosize=50, framebuffer=0) {
        this.fov          = fov
        this.aspect_ratio = aspect_ratio;
        this.orthosize    = orthosize;
        this.framebuffer  = framebuffer;
        this.projection_matrix = mat4.create();
        mat4.perspective(this.projection_matrix, fov, aspect_ratio, 0.01, 100);
    }

}
