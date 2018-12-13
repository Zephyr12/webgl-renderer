#version 300 es
precision mediump float;

in float depth;
layout(location=0) out vec4 variance_rt;

void main(){
    float z = gl_FragCoord.z;
    variance_rt = vec4(z,z*z,0.0,1.0);
}
