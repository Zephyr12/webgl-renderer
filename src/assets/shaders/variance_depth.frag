#version 300 es
precision mediump float;

in float depth;
layout(location=0) out vec4 variance_rt;

void main(){
    float z = depth;
    variance_rt = vec4(depth,depth*depth,0.0,1.0);
}
