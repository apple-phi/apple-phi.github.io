import{i as $,j as G,H as j,r as ee,k as re,l as J,n as P,o as ae,I as ne,q as te,E as m,e as V,t as L,v as k,m as fe,w as K,x as le,y as se,z as ie,A as ue,B as ve,S as oe,C as _e,D as pe}from"./runtime.BWuK68Mg.js";import{e as de,h as w,a as Q,b as U,s as R,c as Ee,d as ge}from"./disclose-version.Dcc07gWw.js";let c=null;function Ce(e,r){return r}function Ae(e,r,t){for(var i=[],u=e.length,v=0;v<u;v++)le(e[v].e,i,!0);var o=u>0&&i.length===0&&r!==null;if(o){var g=r.parentNode;Ee(g),g.append(r),t.clear(),y(e[0].prev,e[u-1].next)}se(i,()=>{for(var _=0;_<u;_++){var p=e[_];o||(t.delete(p.k),y(p.prev,p.next)),ie(p.e,!o)}})}function Ie(e,r,t,i,u,v=null){var o={flags:r,items:new Map,next:null};{var g=e;e=w?Q(g.firstChild):g.appendChild(de())}var _=null;$(()=>{var p=t(),x=G(p)?p:p==null?[]:Array.from(p),n=x.length,d=o.flags;d&k&&!ve(x)&&!(oe in x)&&(d^=k,d&_e&&!(d&m)&&(d^=m));let l=!1;if(w){var C=e.data===j;(C!==(n===0)||U===void 0)&&(ee(ge),R(!1),l=!0)}if(w){for(var s=U,A=o,T,E=0;E<n;E++){if(s.nodeType!==8||s.data!==re){l=!0,R(!1);break}s=Q(s);var a=x[E],f=i(a,E);T=W(s,A,null,a,f,E,u,d),o.items.set(f,T),s=s.nextSibling,A=T}if(n>0)for(;s!==e;){var H=s.nextSibling;s.remove(),s=H}}w||Te(x,o,e,u,d,i),v!==null&&(n===0?_?J(_):_=P(()=>v(e)):_!==null&&ae(_,()=>{_=null})),l&&R(!0)})}function Te(e,r,t,i,u,v){var M,Y,q,z;var o=(u&ue)!==0,g=(u&(m|L))!==0,_=e.length,p=r.items,x=r.next,n=x,d=new Set,l=r,C=new Set,s=[],A=[],T,E,a,f;if(o)for(f=0;f<_;f+=1)T=e[f],E=v(T,f),a=p.get(E),a!==void 0&&((M=a.a)==null||M.measure(),C.add(a));for(f=0;f<_;f+=1){if(T=e[f],E=v(T,f),a=p.get(E),a===void 0){var H=n?h(n.e):t;l=W(H,l,l.next,T,E,f,i,u),p.set(E,l),s=[],A=[],n=l.next;continue}if(g&&xe(a,T,f,u),a.e.f&ne&&(J(a.e),o&&((Y=a.a)==null||Y.unfix(),C.delete(a))),a!==n){if(d.has(a)){if(s.length<A.length){var b=A[0],S;l=b.prev;var O=s[0],D=s[s.length-1];for(S=0;S<s.length;S+=1)F(s[S],b,t);for(S=0;S<A.length;S+=1)d.delete(A[S]);y(O.prev,D.next),y(l,O),y(D,b),n=b,l=D,f-=1,s=[],A=[]}else d.delete(a),F(a,n,t),y(a.prev,a.next),y(a,l.next),y(l,a),l=a;continue}for(s=[],A=[];n!==null&&n.k!==E;)d.add(n),A.push(n),n=n.next;if(n===null)continue;a=n}s.push(a),l=a,n=a.next}const I=Array.from(d);for(;n!==null;)I.push(n),n=n.next;var N=I.length;if(N>0){var Z=u&pe&&_===0?t:null;if(o){for(f=0;f<N;f+=1)(q=I[f].a)==null||q.measure();for(f=0;f<N;f+=1)(z=I[f].a)==null||z.fix()}Ae(I,Z,p)}o&&te(()=>{var B;for(a of C)(B=a.a)==null||B.apply()})}function xe(e,r,t,i){i&m&&V(e.v,r),i&L?V(e.i,t):e.i=t}function W(e,r,t,i,u,v,o,g){var _=c;try{var p=(g&m)!==0,x=(g&k)===0,n=p?x?fe(i):K(i):i,d=g&L?K(v):v,l={i:d,v:n,k:u,a:null,e:null,prev:r,next:t};return r.next=l,t!==null&&(t.prev=l),c=l,l.e=P(()=>o(e,n,d)),l}finally{c=_}}function X(e,r){if(e.nodeType===3&&e.data===""||e.nodeType===8){for(var t=r.first,i;t!==null&&(i=t.first,t.dom===null);){if(i===null)return e.previousSibling;t=i}return h(t)}return e}function h(e){var r=e.dom;return G(r)?X(r[0],e):X(r,e)}function F(e,r,t){for(var i=e.next?h(e.next.e):t,u=r?h(r.e):t,v=h(e.e);v!==i;){var o=v.nextSibling;u.before(v),v=o}}function y(e,r){e.next=r,r!==null&&(r.prev=e)}export{Ie as e,Ce as i};
