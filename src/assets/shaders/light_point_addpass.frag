#version 300 es

precision mediump float;

in vec2 f_texcoord;

/* world parameters */
uniform sampler2D diffuse_tex;
uniform sampler2D gbuffer;
uniform sampler2D mat_buffer;

/* camera parameters */
uniform mat4 proj;
uniform mat4 view;

/* light parameters (point) */
uniform vec4 point;
uniform vec3 col;
uniform float intensity;

out vec4 c;

float atten(float dist_squared) {
    return 1.0 / (dist_squared + 1.0);
}

vec3 reconstruct_normal(vec2 n) {
    return vec3(n, sqrt(1.0 - dot(n, n)));
}

float dist_ggx(float n_dot_h, float alpha) {
    float n = (alpha * alpha);
    float d = (n_dot_h * n_dot_h * (n - 1.0)) + 1.0;
    return n / (3.1415 * d * d);
}

float geo_ggx_1(float dot_product, float roughness) {
    //float k = roughness * sqrt(2.0) / 3.1415;
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    float d = dot_product * (1.0-k) + k;
    return dot_product / (d*d);
}

float geo_ggx(float n_dot_l, float n_dot_v, float roughness) {
    return geo_ggx_1(n_dot_l, roughness) * geo_ggx_1(n_dot_v, roughness);
}

float fres_unreal(float v_dot_h, float f_0) {
    return f_0 + (1.0 - f_0) * exp2((-5.55473 * (v_dot_h) - 6.98316) *(v_dot_h));
}


void main(){
    vec2 texcoord = vec2(1.0/800.0, 1.0/600.0) * gl_FragCoord.xy;
    vec4 d = texture(diffuse_tex, texcoord);
    vec4 g = texture(gbuffer, texcoord);
    vec4 m = texture(mat_buffer, texcoord);
    float roughness   = m.g;
    float metalness   = m.b;
    vec3 n = reconstruct_normal(g.xy);
    vec3 v = vec3(0,0,1);//-normalize(vec3(f_texcoord.xy * 2.0 - 1.0, 1.0 - sqrt(abs(f_texcoord.xy * 2.0 - 1.0))));
    vec3 world_space_pos;
    vec3 ndc_pos = vec3(texcoord.xy * 2.0 - 1.0, 1) * g.b;
    vec3 l_clip = (proj * view * point).xyz - ndc_pos;
    float distance_from_light_squared = dot(l_clip, l_clip);
    l_clip = normalize(l_clip);

    vec3 h = normalize(normalize(l_clip) + normalize(v));

    float n_dot_l = dot(normalize(n), normalize(l_clip));
    float n_dot_h = dot(normalize(n), normalize(h));
    float n_dot_v = dot(normalize(n), normalize(v));

    vec3 diffuse = d.xyz * max(n_dot_l, 0.0);

    float alpha = roughness;

    float geo = max(geo_ggx(n_dot_l, n_dot_v, roughness), 0.0);

    float dist = max(dist_ggx(dot(n, h), alpha), 0.0);

    float f_0 = mix(0.1, 0.8, metalness);

    float fres = max(fres_unreal(dot(n, v), f_0), 0.0);

    float cook_torr = max(n_dot_l,0.0) * (geo * dist * fres) / (2.0 * dot(n, l_clip) * dot(n, v));
    //c = vec4(ndc_pos, 1.0);/*
    vec3 spec = mix(vec3(1), d.xyz, metalness) * cook_torr;
    c = vec4(mix(diffuse, spec, f_0) * col * intensity * atten(distance_from_light_squared), 1);
    //*/
}
