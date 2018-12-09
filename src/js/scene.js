class MaterialLoader {
    constructor() {
        this.mat_cache = {};
    }

    compile_shader(src, type) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

        if(!success) {
            throw "could not compile shader:" + gl.getShaderInfoLog(shader);
        }
        return shader;
    }

    async load_material(url) {
        if (url in this.mat_cache) {
            return this.mat_cache[url];
        }

        let matdata = await $.get("/assets/materials/" + url);

        for (const [k,v] of Object.entries(matdata.uniforms)) {
            if(typeof(v) == "string") {
                await tex.load_texture(v);
            }
        }

        let vertex_shader_src = await $.get("/assets/shaders/" + matdata.shaders.vertex);
        try {
            let vertex_shader = this.compile_shader(vertex_shader_src, gl.VERTEX_SHADER);
         
            let fragment_shader_src = await $.get("/assets/shaders/" + matdata.shaders.fragment);
            try {
                let fragment_shader = this.compile_shader(fragment_shader_src, gl.FRAGMENT_SHADER);
                let program = gl.createProgram();
                gl.attachShader(program, vertex_shader);
                gl.attachShader(program, fragment_shader);
                gl.linkProgram(program);
                
                let success = gl.getProgramParameter(program, gl.LINK_STATUS);

                if (!success) {
                    throw ("program filed to link:" + gl.getProgramInfoLog (program));
                }
                
                let m = new Material(matdata.uniforms, program);
                this.mat_cache[url] = m;

                return m;
            } catch (e) {
                throw "failed to compile: " + matdata.shaders.fragment + "\n" + e;
            }

        } catch (e) {
            throw "failed to compile: " + matdata.shaders.vertex + "\n" + e;
        }

        console.log(matdata);
    }
}

class TextureLoader {
    constructor() {
        this.textures = {};
    }

    async load_texture(url) {
        if (url in this.textures){
            return this.textures[url];
        }

        let image = await this.load_image("/assets/textures/" + url);
        
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
           // Yes, it's a power of 2. Generate mips.
           gl.generateMipmap(gl.TEXTURE_2D);
        } else {
           // No, it's not a power of 2. Turn of mips and set
           // wrapping to clamp to edge
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        
        this.textures[url] = texture;

        return texture;
    }

    load_image(url) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
    isPowerOf2(value) {
        // src:
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
      return (value & (value - 1)) == 0;
    }
}

class MeshLoader {

    constructor() {
        this.meshes = {};
    }
    
    async load_mesh(url) {
        if(url in this.meshes){
            return this.meshes[url];
        }

        let obj_source = await $.get("/assets/meshes/" + url);
        let obj = new OBJ.Mesh(obj_source);

        new OBJ.initMeshBuffers(gl, obj);
        this.meshes[url] = obj;
        return obj;
    }
}

class SceneLoader {
    constructor() {

        this.scene_root = null;
        this.quad_verts = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad_verts);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            1, 1,
            -1, 1
        ]), gl.STATIC_DRAW);
        this.quad_verts.itemSize = 2;
        this.quad_verts.numItems = 4;


        this.indexes = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexes);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        this.indexes.itemSize = 1;
        this.indexes.numItems = 6;
        
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        this.diffuse_tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.diffuse_tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 800, 600, 0, gl.RGBA, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.diffuse_tex, 0);

        this.gbuffer_tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.gbuffer_tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 800, 600, 0, gl.RGBA, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.gbuffer_tex, 0);

        this.mat_tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.mat_tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 800, 600, 0, gl.RGBA, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, this.mat_tex, 0);

        this.depth_buffer_tex = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth_buffer_tex);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 800, 600);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth_buffer_tex);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    async load_scene(url) {
        await mat.load_material("unlit.json");
        await mat.load_material("light_dir_addpass.json");

        this.monkey = null;
        let scene_json = await $.get("/assets/scenes/"+url);
        await this.post_process_scene(scene_json);
        this.scene_root = scene_json;
    }

    async post_process_scene(scene_node) {
        console.log(scene_node);
        if (!scene_node.loc) { scene_node.loc = [0,0,0]; }
        if (!scene_node.rot) { scene_node.rot = [0,0,0]; }
        if (!scene_node.sca) { scene_node.sca = [1,1,1]; }
        scene_node.loc = vec3.clone(scene_node.loc);
        scene_node.rot = vec3.clone(scene_node.rot);
        scene_node.sca = vec3.clone(scene_node.sca);
        let rot = quat.fromEuler(quat.create(), scene_node.rot[0], scene_node.rot[1], scene_node.rot[2]);
        let loc = scene_node.loc;
        let sca = scene_node.sca;
        scene_node.m   = mat4.fromRotationTranslationScale(mat4.create(),rot, loc, sca);

        if(scene_node.geometry) {
            await mesh.load_mesh(scene_node.geometry.mesh);
            await mat.load_material(scene_node.geometry.material);
            scene_node.geometry = new Geometry(scene_node.geometry.mesh, scene_node.geometry.material);
        }

        if (scene_node.camera) {
            scene_node.camera = new Camera(glMatrix.toRadian(scene_node.camera.fov), 800/600, 0);
            this.main_camera = scene_node;
        }

        if (scene_node.point_light) {
            scene_node.point_light = new PointLight(
                scene_node.point_light.color,
                scene_node.point_light.intensity);
        }

        if (scene_node.directional_light) {
            scene_node.directional_light = new DirectionalLight(
                scene_node.directional_light.color,
                scene_node.directional_light.intensity);
            this.monkey = scene_node;
        }
        if (scene_node.children){
            for (var child of scene_node.children){
                this.post_process_scene(child)
            }
        }
    }
    
    get_texture_unit(unit){
        return {
            0: gl.TEXTURE0,
            1: gl.TEXTURE1,
            2: gl.TEXTURE2,
            3: gl.TEXTURE3,
            4: gl.TEXTURE4,
            5: gl.TEXTURE5,
        }[unit]
    }

    render_opaque_geometry_call(uniforms, attribute_arrays, indexes, program) {
        let texture_unit = 0;
        gl.useProgram(program);
        for (var [uniform,value] of Object.entries(uniforms)) {
            // dynamic uniform upload

            let uniform_location = gl.getUniformLocation(program, uniform);
            if(uniform_location == -1) {console.log(`uniform ${uniform} doesn't exist`); continue;}
            
            if(value instanceof WebGLTexture) {
                gl.uniform1i(uniform_location, texture_unit);
                gl.activeTexture(this.get_texture_unit(texture_unit));
                gl.bindTexture(gl.TEXTURE_2D, value);
                texture_unit += 1;
                continue;
            }

            if(value instanceof Float32Array){
                gl.uniformMatrix4fv(uniform_location, false, value);
            }

            if (typeof(value) === 'string') { // texture
                gl.uniform1i(uniform_location, texture_unit);
                gl.activeTexture(this.get_texture_unit(texture_unit));
                gl.bindTexture(gl.TEXTURE_2D, tex.textures[value]);
                texture_unit += 1;
                continue;
            }
            
            if (typeof(value) === 'number') { // float
                gl.uniform1f(uniform_location, value);
                continue;
            }

            if (typeof(value) === 'object') { // vector
                if(value.length === 2) {
                    gl.uniform4fv(uniform_location, value);
                }

                if(value.length === 3) {
                    gl.uniform4fv(uniform_location, value);
                }

                if(value.length === 4) {
                    gl.uniform4fv(uniform_location, value);
                }
                continue;
            }


            // 4x4 matrix
            }

        for(var [attribute, buffer] of Object.entries(attribute_arrays)){
            let attrib_location = gl.getAttribLocation(program, attribute);
            gl.enableVertexAttribArray(attrib_location);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(attrib_location, buffer.itemSize, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexes);
        gl.drawElements(gl.TRIANGLES, indexes.numItems, gl.UNSIGNED_SHORT, 0);
    }

    traverse(component, scene_node, model_matrix, callback) {
        let new_model_matrix = mat4.clone(model_matrix);
        mat4.multiply(new_model_matrix, model_matrix, scene_node.m);
        if(component in scene_node) {
            callback(scene_node[component], new_model_matrix);
        }
        if(scene_node.children){
            for (var child of scene_node.children) {
                this.traverse(component, child, new_model_matrix, callback);
            }
        }
    }

    render()
    {
        let v = null;
        let p = null;
        this.traverse("camera", this.scene_root, mat4.create(), (cam, mat) => {
            v = mat4.clone(mat);
            p = cam.projection_matrix;
        });
        this.monkey.rot[1] += 3;
        let rot = quat.fromEuler(quat.create(), this.monkey.rot[0], this.monkey.rot[1], this.monkey.rot[2]);
        let loc = this.monkey.loc;
        let sca = this.monkey.sca;
        this.monkey.m   = mat4.fromRotationTranslationScale(mat4.create(),rot, loc, sca);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.traverse("geometry", this.scene_root, mat4.create(), (geo, m) => {
            let material = mat.mat_cache[geo.material];
            let uniforms = material.uniforms;
            let program  = material.program_id;

            uniforms.m = m;
            uniforms.v = v;
            uniforms.p = p;
            let gmesh = mesh.meshes[geo.mesh];
            let indexes = gmesh.indexBuffer;

            let attribute_arrays = {
                "position" : gmesh.vertexBuffer,
                "normal"   : gmesh.normalBuffer,
                "texcoord" : gmesh.textureBuffer
            }

            this.render_opaque_geometry_call(uniforms, attribute_arrays, indexes, program);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER,null);
        gl.clearColor(0.1,0.2,0.5,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (debug_framebuffer === 0) {
            this.traverse("directional_light", this.scene_root, mat4.create(), (l, m) => {

                let uniforms = {
                    "diffuse_tex": this.diffuse_tex,
                    "gbuffer": this.gbuffer_tex,
                    "mat_buffer": this.mat_tex,
                    "proj": p,
                    "view": v,
                    "l": vec4.transformMat4(vec4.create(), vec4.fromValues(0,0,1,0), m),
                    "col": l.color,
                    "intensity": l.intensity
                };

                let attributes = {
                    "position": this.quad_verts,
                };

                let program = mat.mat_cache["light_dir_addpass.json"].program_id;

                this.render_opaque_geometry_call(uniforms, attributes, this.indexes, program);
            });

        } else {
            let tex = null;
            if (debug_framebuffer === 1){
                tex = this.diffuse_tex;
            }

            if (debug_framebuffer === 2) {
                tex = this.gbuffer_tex;
            }

            if (debug_framebuffer === 3) {
                tex = this.mat_tex;
            }

            let uniforms = {
                "diffuse_tex": tex,
            };

            let attributes = {
                "position": this.quad_verts,
            };


            let program = mat.mat_cache["unlit.json"].program_id;

            this.render_opaque_geometry_call(uniforms, attributes, this.indexes, program);
        }
    }
}

