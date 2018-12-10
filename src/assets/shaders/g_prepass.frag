#version 300 es

precision mediump float;

in vec4 f_normal;
in vec2 f_texcoord;

uniform sampler2D color_map;
uniform sampler2D material_map;
uniform sampler2D normal_map;


layout(location=0) out vec3  diffuse_rt;
layout(location=1) out vec3  gbuffer;
layout(location=2) out vec3  mat_rt;
void main() {
    vec2 texcoord = vec2(1, -1) * f_texcoord.xy;
    vec4 d = texture(color_map, texcoord);
    vec4 m = texture(material_map, texcoord);
    diffuse_rt = d.xyz;
    gbuffer = vec3(f_normal.xy, f_normal.w);
    mat_rt = m.xyz;
}
