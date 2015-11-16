var Stream={create:function(){var t=false;var n=$.Deferred();var e;var i=[];var r=function(r){n.resolve(r);if(!t&&e!==r){e=r;i.map(function(t){return t(r)})}};return{lastValue:function(){return e},map:function(t){var n=Stream.create();if(e!==undefined){n.push(t(e))}i.push(function(e){n.push(t(e))});return n},reduce:function(t,n){var r=Stream.once(n);if(e!==undefined){r.push(t(r.lastValue(),e))}i.push(function(n){r.push(t(r.lastValue(),n))});return r},filter:function(t){var n=Stream.create();if(e!==undefined){t(e,n.push)}i.push(function(e){t(e,n.push)});return n},onValue:function(t){return this.map(function(n){t(n);return true})},promise:n.promise(),prop:function(t){return this.map(function(n){return n[t]})},delay:function(t){var n=Stream.create();this.map(function(e){setTimeout(function(){n.push(e)},t)});return n},end:function(){t=true},push:r,pushAll:function(t){this.onValue(function(n){t.push(n)})},test:function(){var t=arguments;var n=new Error;setTimeout(function(){if(e===undefined){t;n;debugger}},5e3);return this}}},once:function(t){var n=Stream.create();n.push(t);return n},never:function(){return Stream.create()},combine:function(t,n){var e=[];var i=Stream.create();var r=false;var o=new Error;var u=function(){if(!r){r=true;setTimeout(function(){o;r=false;for(var u=0;u<t.length;u++){if(e[u]===undefined){return}}i.push(n.apply(null,e))})}};t.reduce(function(t,n){n.onValue(function(n){e[t]=n;u()});return t+1},0);return i},all:function(t,n){return this.combine(t,function(){n.apply(null,arguments);return true})},combineObject:function(t){var n=Object.keys(t);var e={};var i=Stream.create();var r=false;var o=function(){if(!r){r=true;setTimeout(function(){r=false;for(var t=0;t<n.length;t++){var o=n[t];if(e[o]===undefined){return}}i.push($.extend({},e))})}};n.map(function(n,i){t[n].onValue(function(t){e[n]=t;o()})});return i},splitObject:function(t){var n=Object.keys(t);var e={};n.map(function(n){e[n]=Stream.once(t[n])});return e},fromPromise:function(t,n){var e=Stream.never();if(n){e.push(n)}t.then(function(t){e.push(t)});return e}};var child=function(t){if(!t||!t.create){console.error("faulty component")}return function(n){n.child(t)}};var children=function(t){t.map(function(t){if(!t||!t.create){console.error("faulty component")}});return function(n){n.children(t)}};var wireChildren=function(t){return function(n){n.wireChildren=t}};var component=function(t){var n={create:function(t){var n=this.build(t);n.wireChildren=n.wireChildren||function(){};var e=n.childComponentPs;var i=[];var r=e.map(function(t){if($.isArray(t)){var e=[];var r=t.map(function(t){var i=n.newCtx();e.push(i);return t.create(i)});i.push(e);return r}else{var o=n.newCtx();i.push(o);return t.create(o)}});n.childInstances=r;var o=n.wireChildren.apply(null,[n,t].concat(r))||[];var u=function(t,n,e){t=t||{};if(t.top){t.top.pushAll(e.top)}if(t.left){t.left.pushAll(e.left)}if(t.width){t.width.pushAll(e.width)}if(t.height){t.height.pushAll(e.height)}if(t.backgroundColor){t.backgroundColor.pushAll(e.backgroundColor)}if(t.fontColor){t.fontColor.pushAll(e.fontColor)}};for(var a=0;a<r.length;a++){var h=o[a]||{};var c=r[a];var l=i[a];if($.isArray(c)){for(var s=0;s<c.length;s++){u(h[s],c[s],l[s])}}else{u(h,c,l)}}return n},build:t,and:function(t){var n=this;var e=$.extend({},n);e.build=function(e){var i=n.build(e);var r=t(i,e);var o=i.destroy;if(r){i.destroy=function(){var t=r();if(t){t.then(function(){o.apply(i)})}else{o.apply(i)}}}return i};return e},all:function(t){return t.reduce(function(t,n){return t.and(n)},this)}};return n};var findOptimalHeight=function(t,n){var e=$(".sandbox");var i=t.clone();i.css("height","").css("width",n).appendTo(e);var r=parseInt(i.css("height"));i.remove();return r};var findMinWidth=function(t){var n=$(".sandbox");var e=t.clone();e.css("width","").css("height","").appendTo(n);var i=parseInt(e.css("width"));e.remove();return i};var findScrollWidth=function(t,n){var e=$(".sandbox");var i=t.clone();i.css("width",n).css("height","").appendTo(e);var r=i[0].scrollWidth;i.remove();return r};var findMinHeight=function(t){var n=$(".sandbox");var e=t.clone();e.css("width","").css("height","").appendTo(n);var i=parseInt(e.css("height"));e.remove();return i};var updateDomFuncs=[];var updateDomFunc=function(t){if(updateDomFuncs.length===0){setTimeout(function(){updateDomFuncs.map(function(t){t()});updateDomFuncs=[];updateWindowWidth()})}updateDomFuncs.push(t)};var el=function(t){return component(function(n){var e=Stream.never();var r=Stream.never();var o=function(){var t=findMinHeight(i.$el);i.minWidth.push(mw);i.minHeight.push(t)};var u=$(document.createElement(t));u.css("position","absolute");u.css("visibility","hidden");n.$el.append(u);n.top.onValue(function(t){updateDomFunc(function(){u.css("top",px(t))})});n.left.onValue(function(t){updateDomFunc(function(){u.css("left",px(t))})});n.width.onValue(function(t){updateDomFunc(function(){u.css("width",px(t))})});n.height.onValue(function(t){updateDomFunc(function(){u.css("height",px(t))})});Stream.combine([n.width,n.height,n.top,n.left],function(){updateDomFunc(function(){u.css("visibility","")})});n.backgroundColor.onValue(function(t){u.css("background-color",t)});n.fontColor.onValue(function(t){u.css("color",t)});var a=[];var h=Stream.combine([n.scroll,n.top],function(t,n){return t-n});var c=Stream.combine([n.topAccum,n.top],function(t,n){return t+n});var l=Stream.combine([n.leftAccum,n.left],function(t,n){return t+n});var s=function(t){return{$el:u,scroll:h,topAccum:c,top:Stream.never(),left:Stream.never(),leftAccum:l,width:Stream.never(),height:Stream.never(),backgroundColor:Stream.once("rgba(0,0,0,0)"),fontColor:Stream.once("inherit")}};return{$el:u,optimalWidth:0,minWidth:e,minHeight:r,newCtx:s,childComponentPs:a,child:function(t){a.push(t)},children:function(t){a.push(t)},destroy:function(){e.end();r.end();var t=this.childInstances||[];for(var n=0;n<t.length;n++){var i=t[n];if($.isArray(i)){var o=i;o.map(function(t){t.destroy()})}else{i.destroy()}}this.$el.remove()},updateDimensions:function(t){var n=findMinWidth(this.$el);var e=findMinHeight(this.$el);if(!t||n!==0){this.minWidth.push(n)}if(!t||e!==0){this.minHeight.push(e)}}}})};var a=el("a");var button=el("button");var div=el("div");var form=el("form");var img=el("img");var input=el("input");var li=el("li");var option=el("option");var select=el("select");var textarea=el("textarea");var ul=el("ul");var rootContext=function(){return{$el:$("body"),top:Stream.once(0),topAccum:Stream.once(0),left:Stream.once(0),leftAccum:Stream.once(0),scroll:windowScroll,width:windowWidth,height:Stream.never(),backgroundColor:Stream.once("white"),fontColor:Stream.once("black")}};var rootComponent=function(t,n,e){var i=$.extend(rootContext(),n);var r=t.create(i);r.minHeight.pushAll(i.height);if(e){i.width.map(function(t){i.$el.css("width",t)});i.height.map(function(t){i.$el.css("height",t)})}return r};var passThroughToFirst=function(t,n,e){e.minHeight.pushAll(t.minHeight);e.minWidth.pushAll(t.minWidth);return[{width:n.width,height:n.height,top:Stream.once(0),left:Stream.once(0)}]};var unit=function(t){return function(n){return n+t}};var px=unit("px");var url=function(t){return'url("'+t+'")'};var color=function(t){return $.extend({r:0,g:0,b:0,a:1},t)};var multiplyColor=function(t){return function(n){return{r:Math.min(255,n.r*t),g:Math.min(255,n.g*t),b:Math.min(255,n.b*t),a:n.a}}};var desaturate=function(t){return function(n){var e=(n.r+n.g+n.b)/3;var i=1-t;return{r:i*n.r+t*e,g:i*n.g+t*e,b:i*n.b+t*e,a:n.a}}};var colorString=function(t){return"rgba("+Math.floor(t.r)+","+Math.floor(t.g)+","+Math.floor(t.b)+","+t.a+")"};var rgbColorString=function(t){return"rgb("+Math.floor(t.r)+","+Math.floor(t.g)+","+Math.floor(t.b)+")"};var transparent=color({a:0});var black=color({r:0,g:0,b:0});var white=color({r:255,g:255,b:255});var $$=function(t){return function(){var n=Array.prototype.slice.call(arguments);return function(e){e.$el[t].apply(e.$el,n);setTimeout(function(){e.updateDimensions(true)})}}};var $addClass=$$("addClass");var $css=$$("css");var $attr=$$("attr");var $prop=$$("prop");var chooseHeightFromWidth=function(t,n){var e=false;n.width.onValue(function(n){if(!e){e=true;setTimeout(function(){var i=findOptimalHeight(t.$el,n);t.minHeight.push(i);e=false})}})};var $html=function(t,n){return function(e,i){e.$el.html(t);chooseHeightFromWidth(e,i);if(n){e.updateDimensions()}}};var windowWidth=Stream.never();var windowHeight=Stream.never();var updateWindowWidth=function(){windowWidth.push(document.body.clientWidth)};var updateWindowHeight=function(){windowHeight.push(window.innerHeight)};$(updateWindowWidth);$(updateWindowHeight);$(window).on("resize",function(){updateWindowWidth();updateWindowHeight()});var windowResize=Stream.once(null);$(window).on("resize",function(t){windowResize.push(t)});var windowScroll=Stream.never();$(window).on("scroll",function(){windowScroll.push(window.scrollY)});windowScroll.push(window.scrollY);var windowHash=Stream.never();$(window).on("hashchange",function(){windowHash.push(location.hash)});windowHash.push(location.hash);var withMinWidth=function(t,n){return function(e){e.minWidth.push(t);if(n){e.minWidth.end()}}};var withMinHeight=function(t,n){return function(e){e.minHeight.push(t);if(n){e.minHeight.end()}}};var adjustMinSize=function(t){return function(n){return div.all([child(n),wireChildren(function(n,e,i){i.minWidth.map(function(n){return t.mw(n)}).pushAll(n.minWidth);i.minHeight.map(function(n){return t.mh(n)}).pushAll(n.minHeight);return[{top:Stream.once(0),left:Stream.once(0),width:e.width,height:e.height}]})])}};var withBackgroundColor=function(t){return function(n,e){e.backgroundColor.push(colorString(t))}};var withFontColor=function(t){return function(n,e){e.fontColor.push(colorString(t))}};var link=$css("cursor","pointer");var componentName=function(t){return function(n){n.$el.addClass(t)}};var onThis=function(t){return function(n){return function(e){var i=false;e.$el.on(t,function(t){if(!i){return n(t,function(){i=true;return function(){i=false}},e)}})}}};var changeThis=onThis("change");var clickThis=onThis("click");var inputPropertychangeThis=onThis("input propertychange");var keydownThis=onThis("keydown");var keyupThis=onThis("keyup");var mousedownThis=onThis("mousedown");var mouseoverThis=onThis("mouseover");var mouseoutThis=onThis("mouseout");var mouseupThis=onThis("mouseup");var submitThis=onThis("click");var hoverThis=function(t){return function(n){n.$el.on("mouseover",function(){t(true,n)});n.$el.on("mouseout",function(){t(false,n)})}};var cssStream=function(t,n){return function(e){n.map(function(n){e.$el.css(t,n)})}};var keepAspectRatioCorner=function(t){t=t||{};return function(n){return div.all([child(n),wireChildren(function(n,e,i){i.minWidth.pushAll(n.minWidth);i.minHeight.pushAll(n.minHeight);var r={top:Stream.create(),left:Stream.create(),width:Stream.create(),height:Stream.create()};Stream.combine([i.minWidth,i.minHeight,e.width,e.height],function(n,e,i,o){var u=n/e;var a=i/o;if(a>u){var h=o*u;var c;if(t.left){c=0}else if(t.right){c=i-h}else{c=(i-h)/2}r.top.push(0);r.left.push(c);r.width.push(h);r.height.push(o)}else{var l=i/u;var s;if(t.top){s=0}else if(t.bottom){s=o-l}else{s=(o-l)/2}r.top.push(s);r.left.push(0);r.width.push(i);r.height.push(l)}});return[r]})])}};var keepAspectRatio=keepAspectRatioCorner();var image=function(t){var n=t.src&&t.src.map?t.src:Stream.once(t.src);return img.all([function(e,i){n.map(function(t){e.$el.prop("src",t)});e.minWidth.push(t.minWidth||t.chooseWidth||0);e.minHeight.push(t.minHeight||t.chooseHeight||0);e.$el.css("display","none");e.$el.on("load",function(){e.$el.css("display","");var n=findMinWidth(e.$el);var r=findMinHeight(e.$el);var o=n/r;var u,a;if(t.useNativeSize!==undefined){e.minWidth.push(n);e.minHeight.push(r)}if(t.minWidth!==undefined){u=t.minWidth;a=u/o;e.minWidth.push(u);e.minHeight.push(a)}else if(t.minHeight!==undefined){a=t.minHeight;u=a*o;e.minWidth.push(u);e.minHeight.push(a)}if(t.chooseWidth!==undefined){i.height.map(function(n){return Math.max(t.chooseWidth,n*o)}).pushAll(e.minWidth)}if(t.chooseHeight!==undefined){i.width.map(function(n){return Math.max(t.chooseHeight,n/o)}).pushAll(e.minHeight)}})}])};var linkTo=function(t,n){return a.all([$prop("href",t),child(n),wireChildren(passThroughToFirst)])};var nothing=div.all([componentName("nothing"),withMinHeight(0),withMinWidth(0)]);var text=function(t){if(!(t.map&&t.push)){t=Stream.once(t)}return div.all([componentName("text"),function(n,e){chooseHeightFromWidth(n,e);t.onValue(function(t){if(t){while(t.indexOf(" ")!==-1){t=t.replace(" ","&nbsp;")}}n.$el.html(t);n.minWidth.push(findMinWidth(n.$el))})}])};var faIcon=function(t){return text('<i class="fa fa-'+t+'"></i>')};var paragraph=function(t,n){if(!(t.map&&t.push)){t=Stream.once(t)}n=n||0;return div.all([componentName("paragraph"),function(e,i){chooseHeightFromWidth(e,i);e.updateDimensions=function(){e.minWidth.push(findScrollWidth(e.$el,n))};t.onValue(function(t){e.$el.html(t);e.updateDimensions()});Stream.combine([t,i.width],function(t,n){var i=findOptimalHeight(e.$el,n);e.minHeight.push(i)})}])};var ignoreSurplusWidth=function(t,n){return n};var ignoreSurplusHeight=function(t,n){return n};var evenSplitSurplusWidth=function(t,n){var e=n[n.length-1];var i=t-(e.left+e.width);var r=i/n.length;n.map(function(t,n){t.width+=r;t.left+=n*r});return n};var justifySurplusWidth=function(t,n){var e=n[n.length-1];var i=t-(e.left+e.width);n.map(function(t,e){for(var r=0;r<e;r++){t.left+=i/(n.length-1)}});return n};var justifyAndCenterSurplusWidth=function(t,n){var e=n[n.length-1];var i=t-(e.left+e.width);n.map(function(t,e){t.left+=e*i/n.length+i/(2*n.length)});return n};var superSurplusWidth=function(t,n){var e=n[n.length-1];var i=t-(e.left+e.width);if(n.length===1){if(i<n[0].width){return evenSplitSurplusWidth(t,n)}else{return n}}if(n.length===2){return justifyAndCenterSurplusWidth(t,n)}return justifySurplusWidth(t,n)};var giveToNth=function(t){return function(n,e){var i=e[e.length-1];var r=n-(i.left+i.width);e.map(function(n,i){if(i===t||i===e.length-1&&t>=e.length){n.width+=r}else if(i>t){n.left+=r}});return e}};var giveToFirst=giveToNth(0);var giveToSecond=giveToNth(1);var giveToThird=giveToNth(2);var giveHeightToNth=function(t){return function(n,e){var i=e[e.length-1];var r=n-(i.top+i.height);e.map(function(n,i){if(i===t||i===e.length-1&&t>=e.length){n.height+=r}else if(i>t){n.top+=r}});return e}};var slideshow=function(t,n){t.gutterSize=t.gutterSize||0;t.leftTransition=t.leftTransition||"none";t.alwaysFullWidth=t.alwaysFullWidth||false;return div.all([$css("overflow","hidden"),componentName("slideshow"),children(n.map(function(n){return n.all([$css("transition","left "+t.leftTransition)])})),wireChildren(function(n,e,i){var r=Stream.combine(i.map(function(t){return t.minWidth}),function(){var t=Array.prototype.slice.call(arguments);return t});r.onValue(function(e){n.minWidth.push(e.reduce(function(t,n){return t+n},t.gutterSize*(i.length-1)))});var o=i.map(function(){return{top:Stream.once(0),left:Stream.never(),width:Stream.never(),height:e.height}});Stream.all([t.selected,e.width,r],function(n,e,i){var r=0;var u=0;var a=0;var h=i.map(function(i,o){i=t.alwaysFullWidth?e:i;if(n===o){r=a+t.gutterSize*o;u=i}var h={left:a+t.gutterSize*o,width:i};a+=i;return h});var c=(e-u)/2-r;h.map(function(t){t.left+=c});h.map(function(t,n){var e=o[n];e.left.push(t.left);e.width.push(t.width)})});Stream.combine(i.map(function(t){return t.minHeight}),function(){var t=Array.prototype.slice.call(arguments);var n=t.reduce(function(t,n){return Math.max(t,n)},0);o.map(function(t){t.height.push(n)});return n}).pushAll(n.minHeight);return[o]})])};var sideBySide=function(t,n){t.gutterSize=t.gutterSize||0;t.handleSurplusWidth=t.handleSurplusWidth||ignoreSurplusWidth;return div.all([componentName("sideBySide"),children(n),wireChildren(function(n,e,i){var r=Stream.combine(i.map(function(t){return t.minWidth}),function(){var t=Array.prototype.slice.call(arguments);return t});r.onValue(function(e){n.minWidth.push(e.reduce(function(t,n){return t+n},t.gutterSize*(i.length-1)))});var o=i.map(function(){return{top:Stream.once(0),left:Stream.never(),width:Stream.never(),height:e.height}});Stream.all([e.width,r],function(n,e){var i=0;var r=e.map(function(n,e){var r={left:i+t.gutterSize*e,width:n};i+=n;return r});r=t.handleSurplusWidth(n,r);r.map(function(t,n){var e=o[n];e.left.push(t.left);e.width.push(t.width)})});Stream.combine(i.map(function(t){return t.minHeight}),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return Math.max(t,n)},0)}).pushAll(n.minHeight);return[o]})])};var stack2=function(t,n){t.gutterSize=t.gutterSize||0;t.handleSurplusHeight=t.handleSurplusHeight||ignoreSurplusHeight;return div.all([componentName("stack2"),children(n),wireChildren(function(n,e,i){var r=Stream.combine(i.map(function(t){return t.minHeight}),function(){var t=Array.prototype.slice.call(arguments);return t});r.onValue(function(e){n.minHeight.push(e.reduce(function(t,n){return t+n},t.gutterSize*(i.length-1)))});var o=i.map(function(){return{top:Stream.create(),left:Stream.once(0),width:e.width,height:Stream.never()}});Stream.all([e.height,r],function(n,e){var i=0;var r=e.map(function(n,e){var r={top:i+t.gutterSize*e,height:n};i+=n;return r});r=t.handleSurplusHeight(n,r);r.map(function(t,n){var e=o[n];e.top.push(t.top);e.height.push(t.height)})});Stream.combine(i.map(function(t){return t.minWidth}),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return Math.max(t,n)},0)}).pushAll(n.minWidth);return[o]})])};var intersperse=function(t,n){var e=[];t.map(function(t){e.push(t);e.push(n)});e.pop();return e};var stackTwo=function(t,n){t.gutterSize=t.gutterSize||0;t.align=t.align||"left";return div.all([componentName("stack"),children(n),wireChildren(function(n,e,i){var r=i[0];var o=i[1];var u=t.gutterSize;var a=[];n.minHeight.push(0);n.minWidth.push(0);Stream.combine([r.minHeight,o.minHeight],function(t,n){return t+n+u}).pushAll(n.minHeight);Stream.combine([r.minWidth,o.minWidth],function(t,n){return Math.max(t,n)}).pushAll(n.minWidth);return[[{top:Stream.once(0),left:Stream.once(0),width:e.width,height:r.minHeight},{top:r.minHeight.map(function(t){return t+u}),left:Stream.once(0),width:e.width,height:o.minHeight}]]})])};var stack=function(t,n){t.gutterSize=t.gutterSize||0;t.collapseGutters=t.collapseGutters||false;t.align=t.align||"left";if(n.length===0){n=[nothing]}return div.all([componentName("stack"),children(n),wireChildren(function(n,e,i){var r=t&&t.gutterSize||0;var o=function(n){if(n.length===0){return Stream.once(0)}return Stream.combine(n.map(function(n,i){var r;if(t&&t.mhs&&t.mhs[i]){var o=t.mhs[i](e);return Stream.combine([n.minHeight,o],function(t,n){return Math.max(t,n)})}else{return n.minHeight}return n.minHeight}),function(){var n=Array.prototype.slice.call(arguments);var e=n.reduce(function(n,e){return n+e+(t.collapseGutters&&e===0?0:r)},-r);return e})};var u=[];i.reduce(function(n,i,a){var h=o(n).map(function(n){return n+(a===0||t.collapseGutters&&n===0?0:r)});var c;if(t&&t.mhs&&t.mhs[n.length]){var l=t.mhs[n.length](e);c=Stream.combine([i.minHeight,l],function(t,n){return Math.max(t,n)})}else{c=i.minHeight}u.push({top:h,left:Stream.once(0),width:e.width,height:c});n.push(i);return n},[]);o(i).pushAll(n.minHeight);Stream.combine(i.map(function(t){return t.minWidth}),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return Math.max(t,n)},0)}).pushAll(n.minWidth);return[u]})])};var adjustPosition=function(t,n){var e=t.top||0;var i=t.left||0;var r=t.expand;return div.all([componentName("adjustPosition"),child(n),wireChildren(function(t,n,o){o.minWidth.map(function(t){return t+r?i:0}).pushAll(t.minWidth);o.minHeight.map(function(t){return t+r?e:0}).pushAll(t.minHeight);return[{top:n.top.map(function(t){return t+e}),left:n.left.map(function(t){return t+i}),width:n.width,height:n.height}]})])};var padding=function(t,n){var e=t.all||0,i=t.all||0,r=t.all||0,o=t.all||0;if($.isNumeric(t)){e=i=r=o=t}else{for(var u in t){var a=u.toLowerCase();if(a.indexOf("top")!==-1){e=t[u]}if(a.indexOf("bottom")!==-1){i=t[u]}if(a.indexOf("left")!==-1){r=t[u]}if(a.indexOf("right")!==-1){o=t[u]}}}return div.all([componentName("padding"),child(n),wireChildren(function(t,n,u){u.minWidth.map(function(t){return t+r+o}).pushAll(t.minWidth);u.minHeight.map(function(t){return t+e+i}).pushAll(t.minHeight);return[{top:Stream.once(e,"padding top"),left:Stream.once(r,"padding left"),width:n.width.map(function(t){return t-r-o}),height:n.height.map(function(t){return t-e-i})}]})])};var alignLRM=function(t){return div.all([componentName("alignLRM"),child(t.middle||nothing),child(t.left||nothing),child(t.right||nothing),wireChildren(function(t,n,e,i,r){var o=Stream.combine([e,i,r].map(function(t){return t.minHeight}),function(){var t=Array.prototype.slice.call(arguments);var n=t.reduce(function(t,n){return Math.max(t,n)},0);return n});o.pushAll(t.minHeight);Stream.combine([e,i,r].map(function(t){return t.minWidth}),function(){var t=Array.prototype.slice.call(arguments);var n=t.reduce(function(t,n){return t+n},0);return n}).pushAll(t.minWidth);var u=function(t,n){return Stream.combine([t,n],function(t,n){return Math.min(t,n)})};var a=u(n.width,e.minWidth);var h=u(n.width,i.minWidth);var c=u(n.width,r.minWidth);return[{top:Stream.once(0),left:Stream.combine([n.width,a],function(t,n){return(t-n)/2}),width:a,height:n.height},{top:Stream.once(0),left:Stream.once(0),width:h,height:n.height},{top:Stream.once(0),left:Stream.combine([n.width,c],function(t,n){return t-n}),width:c,height:n.height}]})])};var alignTBM=function(t){t.middle=t.middle||nothing;t.bottom=t.bottom||nothing;t.top=t.top||nothing;return div.all([componentName("alignTBM"),child(t.middle),child(t.bottom),child(t.top),wireChildren(function(t,n,e,i,r){var o=Stream.combine([e,i,r].map(function(t){return t.minWidth}),function(){var t=Array.prototype.slice.call(arguments);var n=t.reduce(function(t,n){return Math.max(t,n)},0);return n});o.pushAll(t.minWidth);Stream.combine([e,i,r].map(function(t){return t.minHeight}),function(){var t=Array.prototype.slice.call(arguments);var n=t.reduce(function(t,n){return t+n},0);return n}).pushAll(t.minHeight);return[{top:Stream.combine([n.height,e.minHeight],function(t,n){return(t-n)/2}),left:Stream.once(0),width:n.width,height:e.minHeight},{top:Stream.combine([n.height,i.minHeight],function(t,n){return t-n}),left:Stream.once(0),width:n.width,height:i.minHeight},{top:Stream.once(0),left:Stream.once(0),width:n.width,height:r.minHeight}]})])};var invertOnHover=function(t){var n=Stream.once(false,"invert");var e=function(t,e){return Stream.combine([n,t,e],function(t,n,e){return t?e:n},"choose stream")};return div.all([componentName("invert-on-hover"),child(t.and($css("transition","background-color 0.2s linear, color 0.1s linear"))),wireChildren(function(t,n,i){i.minHeight.pushAll(t.minHeight);i.minWidth.pushAll(t.minWidth);return[{backgroundColor:e(n.backgroundColor,n.fontColor),fontColor:e(n.fontColor,n.backgroundColor),top:Stream.once(0),left:Stream.once(0),width:n.width,height:n.height}]}),mouseoverThis(function(){n.push(true)}),mouseoutThis(function(){n.push(false)})])};var border=function(t,n,e){var i=n.left||n.all||0;var r=n.right||n.all||0;var o=n.top||n.all||0;var u=n.bottom||n.all||0;var a=n.radius||0;var h=colorString(t);return div.all([componentName("border"),child(div.all([componentName("border-child"),$css("border-left",px(i)+" solid "+h),$css("border-right",px(r)+" solid "+h),$css("border-top",px(o)+" solid "+h),$css("border-bottom",px(u)+" solid "+h),$css("border-radius",px(a)),child(e),wireChildren(passThroughToFirst)])),wireChildren(function(t,n,e){e.minWidth.map(function(t){return t+i+r}).pushAll(t.minWidth);e.minHeight.map(function(t){return t+o+u}).pushAll(t.minHeight);return[{top:Stream.once(0),left:Stream.once(0),width:n.width.map(function(t){return t-i-r}),height:n.height.map(function(t){return t-o-u})}]})])};var componentStream=function(t){var n;return div.all([componentName("component-stream"),function(e,i){var r=e.newCtx();r.top.push(0);r.left.push(0);i.width.pushAll(r.width);i.height.pushAll(r.height);var o=Stream.create();t.pushAll(o);o.map(function(t){var i=function(t){if(n){n.destroy()}n=t.create(r);n.$el.css("transition","inherit");n.minWidth.pushAll(e.minWidth);n.minHeight.pushAll(e.minHeight)};if(t.then){t.then(function(t){i(t)},function(t){console.error("child components failed to load");console.log(t)})}else{i(t)}});return function(){o.end();if(n){n.destroy()}}}])};var promiseComponent=function(t){var n=Stream.once(nothing);t.then(function(t){n.push(t)},function(t){console.log(t)});return componentStream(n)};var toggleComponent=function(t,n){return componentStream(n.map(function(n){return t[n]}))};var modalDialog=function(t){return function(n,e){var i=Stream.once(false);n.pushAll(i);e=e||0;return div.all([$css("z-index",100),componentName("toggle-height"),child(t),wireChildren(function(t,n,r){t.minWidth.push(0);t.minHeight.push(0);var o=r.$el;o.css("position","fixed");o.css("transition",o.css("transition")+", opacity "+e+"s");o.css("display","none");i.onValue(function(t){if(t){o.css("display","");setTimeout(function(){o.css("opacity",1)},100)}else{o.css("opacity",0);setTimeout(function(){o.css("display","none")},e*1e3)}});return[{width:Stream.combine([windowWidth,r.minWidth],function(t,n){return Math.min(t,n)}),height:Stream.combine([windowHeight,r.minHeight],function(t,n){return Math.min(t,n)}),left:Stream.combine([windowWidth,r.minWidth],function(t,n){return Math.max(0,(t-n)/2)}),top:Stream.combine([windowHeight,r.minHeight],function(t,n){return Math.max(0,(t-n)/2)})}]})])}};var toggleHeight=function(t){var n=Stream.once(false);t.pushAll(n);return function(t){return div.all([$css("overflow","hidden"),componentName("toggle-height"),child(t),wireChildren(function(t,e,i){i.minWidth.pushAll(t.minWidth);Stream.combine([i.minHeight,n],function(t,n){return n?t:0}).pushAll(t.minHeight);return[{top:Stream.once(0),left:Stream.once(0),width:e.width,height:e.height}]})])}};var dropdownPanel=function(t,n,e,i){i=i||{};i.transition=i.transition||"0.5s";return div.all([componentName("dropdown-panel"),child(div.all([child(n),wireChildren(function(t,n,r){r.minWidth.pushAll(t.minWidth);r.minHeight.pushAll(t.minHeight);r.$el.css("transition","top "+i.transition);t.$el.css("pointer-events","none");r.$el.css("pointer-events","initial");r.$el.css("z-index","1000");return[{width:n.width,height:r.minHeight,top:Stream.combine([e,r.minHeight],function(t,n){return t?0:-n}),left:Stream.once(0)}]}),$css("overflow","hidden")])),child(t),wireChildren(function(t,n,e,i){i.minWidth.pushAll(t.minWidth);i.minHeight.pushAll(t.minHeight);return[{width:n.width,height:e.minHeight,top:n.height,left:Stream.once(0)},{width:n.width,height:n.height,top:Stream.once(0),left:Stream.once(0)}]})])};var fixedHeaderBody=function(t,n,e){t.transition=t.transition||"0.5s";return div.all([componentName("fixedHeaderBody"),child(e),child(n),wireChildren(function(n,e,i,r){r.$el.css("position","fixed");setTimeout(function(){r.$el.css("transition","height "+t.transition);i.$el.css("transition","top "+t.transition)});Stream.combine([i,r].map(function(t){return t.minHeight}),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return t+n},0)}).pushAll(n.minHeight);Stream.combine([i,r].map(function(t){return t.minWidth}),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return Math.max(t,n)},0)}).pushAll(n.minWidth);return[{top:r.minHeight,left:Stream.once(0),width:e.width,height:i.minHeight},{top:Stream.once(0),left:Stream.once(0),width:e.width,height:r.minHeight}]})])};var stickyHeaderBody=function(t,n,e){return div.all([componentName("stickyHeaderBody"),child(t),child(e),child(n),wireChildren(function(t,n,e,i,r){Stream.combine([e,i,r].map(function(t){return t.minHeight}),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return t+n},0)}).pushAll(t.minHeight);var o=false;return[{top:Stream.once(0),left:Stream.once(0),width:n.width,height:e.minHeight},{top:Stream.combine([e.minHeight,r.minHeight],function(t,n){return t+n}),left:Stream.once(0),width:n.width,height:i.minHeight},{top:Stream.combine([e.minHeight,n.scroll,n.topAccum],function(t,n,e){var i=r.$el;t=Math.floor(t);if(t>n+e){i.css("position","absolute");i.css("transition","");if(o){window.scrollTo(0,t+e)}o=false;return t}else if(t<n+e){i.css("position","fixed");setTimeout(function(){i.css("transition","inherit")},20);if(!o){window.scrollTo(0,t+e)}o=true;return e}}),left:Stream.once(0),width:n.width,height:r.minHeight}]})])};var grid=function(t,n){t.gutterSize=t.gutterSize||0;t.handleSurplusWidth=t.handleSurplusWidth||ignoreSurplusWidth;t.handleSurplusHeight=t.handleSurplusHeight||ignoreSurplusHeight;return padding(t.outerGutter?t.gutterSize:0,div.all([componentName("grid"),children(n),wireChildren(function(n,e,i){if(i.length===0){n.minWidth.push(0);n.minHeight.push(0)}var r=Stream.combine(i.map(function(t){return t.minWidth}),function(){return Array.prototype.slice.call(arguments)});var o=Stream.combine(i.map(function(t){return t.minHeight}),function(){return Array.prototype.slice.call(arguments)});r.map(function(n){return n.reduce(function(n,e){return t.useFullWidth?n+e:Math.max(n,e)},0)}).pushAll(n.minWidth);var u=i.map(function(t){return{top:Stream.never(),left:Stream.never(),width:Stream.never(),height:Stream.never()}});var a=Stream.combine([e.width,r],function(n,e){var r=function(){return{cells:[],contexts:[],height:0}};var o=i.reduce(function(i,o,a){var h=i.rows;var c=i.currentRow;var l=e[a];var s=c.cells.reduce(function(n,e){return n+e+t.gutterSize},0);var m=Math.min(l,n);if(m>0&&m+s>n){h.push(c);c=r()}c.cells.push(m);c.contexts.push(u[a]);return{rows:h,currentRow:c}},{rows:[],currentRow:r()});var a=o.rows;a.push(o.currentRow);a.map(function(e,i){var r=0;var o=e.cells.map(function(n){var e={left:r,width:n};r+=n+t.gutterSize;return e});o=t.handleSurplusWidth(n,o,t,i);o.map(function(t,n){var i=e.contexts[n];i.width.push(t.width)})});return a});var h=Stream.combine([o,a],function(e,i){var r=0;i.map(function(t){t.height=0;t.cells.map(function(n,i){t.height=Math.max(t.height,e[r+i])});r+=t.cells.length});n.minHeight.push(i.map(function(t){return t.height}).reduce(function(n,e){return n+e+t.gutterSize},-t.gutterSize));return i});Stream.all([e.width,e.height,h],function(n,e,i){if(t.bottomToTop){i=i.slice(0).reverse()}var r=0;i=t.handleSurplusHeight(e,i,t);i.map(function(e,i){var o=0;var u=e.cells.map(function(n){var i={top:r,left:o,width:n,height:e.height};o+=n+t.gutterSize;return i});u=t.handleSurplusWidth(n,u,t,i);u.map(function(t,n){var i=e.contexts[n];i.top.push(t.top);i.left.push(t.left);i.width.push(t.width);i.height.push(t.height)});r+=e.height+t.gutterSize})});return[u]})]))};var backgroundImagePosition={fit:"fit",fill:"fill"};var withMinHeightStream=function(t,n){return div.all([componentName("with-min-height-stream"),child(n),wireChildren(function(n,e,i){t(i,e).pushAll(n.minHeight);i.minWidth.pushAll(n.minWidth);return[{top:Stream.once(0),left:Stream.once(0),width:e.width,height:e.height}]})])};var extendToWindowBottom=function(t,n){n=n||Stream.once(0);return withMinHeightStream(function(t,e){return Stream.combine([t.minHeight,e.top,e.topAccum,n,windowResize],function(t,n,e,i){return Math.max(t,window.innerHeight-n-e-i)})},t)};var overlays=function(t){return div.all([children(t),wireChildren(function(t,n,e){var i=function(t){return Stream.combine(t,function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return Math.max(t,n)},0)})};i(e.map(function(t){return t.minHeight})).test().pushAll(t.minHeight);i(e.map(function(t){return t.minWidth})).test().pushAll(t.minWidth);return[e.map(function(t){return{top:Stream.once(0),left:Stream.once(0),width:n.width,
height:n.height}})]})])};var withBackground=function(t,n){return div.all([componentName("with-background"),child(t),child(n),wireChildren(function(t,n,e,i){i.minWidth.pushAll(t.minWidth);i.minHeight.pushAll(t.minHeight);var r={top:Stream.once(0),left:Stream.once(0),width:n.width,height:n.height};return[r,r]})])};var withBackgroundImage=function(t,n){var e=Stream.once(t.aspectRatio||1);if(!t.src.map){t.src=Stream.once(t.src)}return div.all([componentName("with-background-image"),$css("overflow","hidden"),child(img.all([$css("visibility","hidden"),function(n,i){n.minWidth.push(0);n.minHeight.push(0);t.src.map(function(t){n.$el.prop("src",t)});n.$el.on("load",function(){var t=findMinWidth(n.$el);var i=findMinHeight(n.$el);var r=t/i;e.push(r)});Stream.all([i.width,i.height],function(){n.$el.css("visibility","")})}])),child(n),wireChildren(function(t,n,i,r){r.minWidth.pushAll(t.minWidth);r.minHeight.pushAll(t.minHeight);var o=t.newCtx();n.top.push(0);n.left.push(0);n.width.pushAll(o.width);n.height.pushAll(o.height);var u=t.newCtx();u.top.push(0);u.left.push(0);Stream.all([e,n.width,n.height],function(t,n,e){var i=n/e;if(t<i){u.width.push(n);u.height.push(n/t)}else{u.width.push(e*t);u.height.push(e)}});return[u,o]})])};var table=function(t,n){t=t||{};var e=(t.paddingSize||0)*2;return div.all(n.map(function(t){return children(t)})).all([componentName("table"),wireChildren(function(){var t=Array.prototype.slice.call(arguments);var n=t[0];var i=t[1];var r=t.slice(2);var o=Stream.combine(r.reduce(function(t,n){t.push(Stream.combine(n.map(function(t){return t.minWidth}),function(){return Array.prototype.slice.call(arguments)}));return t},[]),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return n.map(function(n,e){return Math.max(t[e]||0,n)})},[])});o.map(function(t){var i=t.reduce(function(t,n){return t+n+e},-e);n.minWidth.push(i)});var u=r.reduce(function(t,n){t.push(Stream.combine(n.map(function(t){return t.minHeight}),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return Math.max(t,n)},0)}));return t},[]);Stream.combine(u,function(){var t=Array.prototype.slice.call(arguments);var i=t.reduce(function(t,n){return t+n+e},-e);n.minHeight.push(i)});return u.map(function(t,n){return r[n].map(function(t,i){return{width:o.map(function(t){return t[i]}),height:u[n],top:Stream.combine(u.slice(0,n).concat([Stream.once(0)]),function(){var t=Array.prototype.slice.call(arguments);return t.reduce(function(t,n){return t+n+e},-e)}),left:o.map(function(t){return t.reduce(function(t,n,r){return t+(r<i?n+e:0)},0)})}})})})])};var tabs=function(t,n){var e=n||Stream.once(0);return stack({},[sideBySide({},t.map(function(t,n){return alignTBM({bottom:toggleComponent([t.tab.left,t.tab.right,t.tab.selected],e.map(function(t){if(n<t){return 0}if(n>t){return 1}return 2})).all([link,clickThis(function(){e.push(n)})])})})),componentStream(e.map(function(n){return t[n].content}))])};var matchStrings=function(t){return function(n){for(var e=0;e<t.length;e++){var i=t[e];if(n.indexOf(i.string)===0){return i.router(n.substring(i.string.length))}}}};var routeToComponent=function(t){return function(){return t}};var routeToComponentF=function(t){return function(){return t()}};var routeToFirst=function(t){return function(n){for(var e=0;e<t.length;e++){var i=t[e](n);if(i){return i}}}};var routeMatchRest=function(t){return function(n){return Q(n).then(t)}};var ignoreHashChange=false;var route=function(t){var n;return div.all([child(div.all([componentName("route"),function(e,i){windowHash.onValue(function(r){if(ignoreHashChange){ignoreHashChange=false;return}if(n){n.destroy()}Q.all([t(r)]).then(function(t){var r=t[0];n=r.create(i);n.$el.css("transition","inherit");n.minWidth.pushAll(e.minWidth);n.minHeight.pushAll(e.minHeight)},function(t){console.error("child components failed to load");console.log(t)})})}])),wireChildren(passThroughToFirst)])};