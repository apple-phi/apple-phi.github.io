import{s as b}from"./index.CtJvHUon.js";import{t as f,m as i,n as o,s as t,g as a}from"./runtime.BWBH7bGR.js";function p(u,e,r){const s=r[e]??(r[e]={store:null,source:i(void 0),unsubscribe:o});if(s.store!==u)if(s.unsubscribe(),s.store=u??null,u==null)t(s.source,void 0),s.unsubscribe=o;else{var n=!0;s.unsubscribe=b(u,c=>{n?(s.source.v=c,n=!1):t(s.source,c)})}return a(s.source)}function g(){const u={};return f(()=>{for(var e in u)u[e].unsubscribe()}),u}export{p as a,g as s};
