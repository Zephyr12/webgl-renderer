# Feature TODOs
* Deferred Rendering:           http://www.codinglabs.net/tutorial_simple_def_rendering.aspx
* Cook-Torrance Broad Strokes:  http://www.codinglabs.net/article_physically_based_rendering_cook_torrance.aspx
* Realtime Hard Shadows:        https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping
* Lightmapping:                 http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-15-lightmaps/
* Linearspace Lighting:         https://stackoverflow.com/questions/6397817/color-spaces-gamma-and-image-enhancement
* Model Loading:                http://www.assimp.org/
* Variance Shadow Mapping:      http://www.punkuser.net/vsm/vsm_paper.pdf
* Image Based Lighting:
        * Cubemap Rendering:    https://gamedev.stackexchange.com/questions/19461/opengl-glsl-render-to-cube-map
        * Probe Sampling:       http://twvideo01.ubm-us.net/o1/vault/gdc2012/slides/Programming%20Track/Cupisz_Robert_Light_Probe_Interpolation.pdf
* Depth Peeling:                http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.18.9286&rep=rep1&type=pdf
* Everything: http://codeflow.org/entries/2012/aug/25/webgl-deferred-irradiance-volumes/

# Renderpaths

## Bake Time

Only render the static and use direct lighting + lightmapping to bake
reflection probes

## Run-Time

### Precomputed Data
* Diffuse Lightmaps
* Light Probes

### Static Opaque

* Ambient Source: Lightmaps
* Diffuse Source: Lightmaps
* Specularity   : Lightprobes
* Shadowing     : From Dynamic (Objects | Lights) Only

### Dynamic Opaque

* Ambient Source: Lightprobes
* Diffuse Source: Direct Light (Cook-Torr)
* Specularity   : Direct Light + Lightprobes
* Shadowing     : From (Static Objects | Static Lights | Dynamic Objects | Dynamic Lights)

### Dynamic Transparent

* Same as opaque but with peeling and blending w/ 2 layers
