import{b as g,H as N,r as O,c as h,d as p,p as A,M as D,N as q,O as L,P as U,Q as F,F as M,R as T,T as Y,z as o,U as y,V as z,s as C,W as H,X as V,m as k}from"./runtime.DVc6x2x9.js";import{h as x,s as b,d as B}from"./disclose-version.B3_fDhE5.js";function W(t,f,i,l=null,d=!1){var r=null,n=null,a=null,u=d?D:0;g(()=>{if(a===(a=!!f()))return;let s=!1;if(x){const _=t.data===N;a===_&&(O(B),b(!1),s=!0)}a?(r?h(r):r=p(()=>i(t)),n&&A(n,()=>{n=null})):(n?h(n):l&&(n=p(()=>l(t))),r&&A(r,()=>{r=null})),s&&b(!0)},u)}function X(t,f,i,l){var I;var d=(i&H)!==0,r=(i&F)!==0,n=(i&V)!==0,a=t[f],u=(I=q(t,f))==null?void 0:I.set,s=l,_=!0,R=()=>(n&&_&&(_=!1,s=M(l)),s);a===void 0&&l!==void 0&&(u&&r&&L(),a=R(),u&&u(a));var v;if(r)v=()=>{var e=t[f];return e===void 0?R():(_=!0,e)};else{var S=(d?T:Y)(()=>t[f]);S.f|=U,v=()=>{var e=o(S);return e!==void 0&&(s=void 0),e===void 0?s:e}}if(!(i&y))return v;if(u)return function(e){return arguments.length===1?(u(e),e):v()};var m=!1,P=k(a),c=T(()=>{var e=v(),E=o(P);return m?(m=!1,E):P.v=e});return d||(c.equals=z),function(e){var E=o(c);return arguments.length>0?(c.equals(e)||(m=!0,C(P,e),o(c)),e):E}}export{W as i,X as p};
