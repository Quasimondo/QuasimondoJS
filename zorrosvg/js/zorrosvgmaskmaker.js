/*
* ZorroSVG Mask Maker
*
* Visit http://quasimondo.com/ZorroSVG documentation, updates and examples.
*
* Copyright (c) 2014 Mario Klingemann
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

	var currentImage;
	var isLittleEndian;
	var currentMaskCanvas;
	var newImageData;
	var sourceFileSize;
	var exampleReady = false;
	var jqueryReady = false;
	var currentFileName = "example";
	var currentEmbeddedSVG;
	var rawSVG;
	
	$(function() {
		
		if ( $( "#qualitySlider" ).slider != null )
		{
		$( "#qualitySlider" ).slider({
			range: false,
			min: 0,
			max: 1,
			step: 0.01,
			value: 0.65,
			change: onJpegQualityChanged
			}
		);
		}
		
		document.getElementById('files').addEventListener('change', handleFileSelect, false);
		 
		 jqueryReady = true;
		 if ( exampleReady) createMaskedMap();
		 
	});
	
	function onExampleLoaded(img)
	{
		currentImage = img;
		sourceFileSize = 100864;
		exampleReady = true;
		if ( jqueryReady) createMaskedMap();
	}

	function handleFileSelect(evt)
	{
		var file = evt.target.files[0];
		
		var parts = file.name.split(".");
		parts.pop();
		currentFileName = parts.join(".");
		
		sourceFileSize = file.size;
		var reader = new FileReader();
		reader.readAsDataURL(file);
		
		addEventHandler(reader, 'loadend', function(e, file) {
			var bin           = this.result; 
			currentImage = document.createElement("img"); 
			currentImage.file = file;   
			currentImage.src = bin;
			currentImage.onload = createMaskedMap;
			currentImage.style.verticalAlign = "top";
			drop.innerHTML = "";
			drop.appendChild(currentImage);
		});
	}
	
	
	
	
	if(window.FileReader) 
	{ 
		 var drop; 
		 addEventHandler(window, 'load', function() {
			drop   = document.getElementById('drop');
			
			function cancel(e) {
			  if (e.preventDefault) { e.preventDefault(); }
			  return false;
			}
		  
			// Tells the browser that we *can* drop on this target
			addEventHandler(window, 'dragover', cancel);
			addEventHandler(window, 'dragenter', cancel);

		addEventHandler(window, 'drop', function (e) {
		  e = e || window.event; // get window.event if e argument missing (in IE)   
		  if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.

		var dt    = e.dataTransfer;
		var file = dt.files[0];
		sourceFileSize = file.size;
		
		
		var reader = new FileReader();
		reader.readAsDataURL(file);
		
		addEventHandler(reader, 'loadend', function(e, file) {
			var bin           = this.result; 
			
			

			currentImage = document.createElement("img"); 
			currentImage.file = file;   
			currentImage.src = bin;
			currentImage.onload = createMaskedMap;
			drop.innerHTML = "";
			drop.appendChild(currentImage);
			
			
		}.bindToEventHandler(file));
		  
		  return false;
		});
		
		
		Function.prototype.bindToEventHandler = function bindToEventHandler() {
		  var handler = this;
		  var boundParameters = Array.prototype.slice.call(arguments);
		  //create closure
		  return function(e) {
			  e = e || window.event; // get window.event if e argument missing (in IE)   
			  boundParameters.unshift(e);
			  handler.apply(this, boundParameters);
		  }
		};
		  });
		
	} else { 
	  document.getElementById('compressedStatus').innerHTML = 'Your browser does not support the HTML5 FileReader.';
	}
	
	
		
	function addEventHandler(obj, evt, handler) {
		if ( obj == null ) return;
		if(obj.addEventListener) {
			// W3C method
			obj.addEventListener(evt, handler, false);
		} else if(obj.attachEvent) {
			// IE method.
			obj.attachEvent('on'+evt, handler);
		} else {
			// Old school method.
			obj['on'+evt] = handler;
		}
	}
	
	function createMaskedMap(event)
	{
		try
		{
			if ( isLittleEndian == undefined )
			{
				// Determine whether Uint32 is little- or big-endian.
				var endianTest = new ArrayBuffer(4);
				var e8 = new Uint8ClampedArray(endianTest);
				var e32 = new Uint32Array(endianTest);
				e32[0] = 0x000000ff;
				isLittleEndian = (e8[3] === 0xff);
			}
		} catch (error)
		{
			createMaskedMapForDumbBrowsers();
			return;
		}
		
		
		var userAgent = window.navigator.userAgent;
		var applyGammaCorrection = true;
		if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
		  applyGammaCorrection = false;
		}
		
		var img = currentImage;
		var canvas = document.createElement("canvas");
		
		canvas.width = img.naturalWidth || img.width;
		canvas.height = (img.naturalHeight || img.height )* 2;
		var context = canvas.getContext("2d");
		
		context.drawImage(img, 0, 0);
		context.drawImage(img, 0, img.naturalHeight || img.height );
		
		
		var imagedata = context.getImageData(0, 0, canvas.width, canvas.height);
		var buf32 = new Uint32Array(imagedata.data.buffer);
		var l = buf32.length;
		var l2 = l>>1;
		if ( !isLittleEndian )
		{
			if ( applyGammaCorrection )
			{
				for ( var i = l; --i >= l2; )
				{
					//Gamma correction for semi transparent pixels:
					var b = (Math.pow(((buf32[i] >>> 24) & 0xff) / 255,0.45 ) * 255) | 0;
					buf32[i] = 0xff000000 | ( b << 16) | ( b << 8) | b;
				}
			} else {
				for ( var i = l; --i >= l2; )
				{
					//No Gamma correction on some platforms
					var b = (buf32[i] >>> 24) & 0xff;
					buf32[i] = 0xff000000 | ( b << 16) | ( b << 8) | b;
				}
			}
			
			for ( i = l2; --i > -l; )
			{
				buf32[i] |= 0xff000000;
			}
		} else {
			if ( applyGammaCorrection )
			{
				for ( var i = l; --i >= l2; )
				{
					//Gamma correction for semi transparent pixels:
					var b = (Math.pow(( buf32[i] & 0xff) / 255,0.45 ) * 255) | 0;
					buf32[i] = 0xff | ( b << 24) | ( b << 16) | (b<<8);
				}
			} else {
				for ( var i = l; --i >= l2; )
				{
					//No Gamma correction on some platforms
					var b = buf32[i] & 0xff;
					buf32[i] = 0xff | ( b << 24) | ( b << 16) | (b<<8);
				}
			}			
			
			for ( i = l2; --i > -l; )
			{
				buf32[i] |= 0xff;
			}
		
		}
		
		currentMaskCanvas = document.createElement("canvas");
		currentMaskCanvas.width = img.naturalWidth;
		currentMaskCanvas.height = img.naturalHeight * 2;
		var context2 = currentMaskCanvas.getContext("2d");
		context2.putImageData(imagedata, 0, 0);
		if ( $( "#qualitySlider" ).slider != null )
		{
			compress($( "#qualitySlider" ).slider( "option", "value" ));
		} else {
			compress(0.5);
		}
		
	}
	
	function createMaskedMapForDumbBrowsers()
	{
	
		var img = currentImage;
		var canvas = document.createElement("canvas");
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight * 2;
		var context = canvas.getContext("2d");
		context.drawImage(img, 0, 0);
		context.drawImage(img, 0, img.naturalHeight);
		
		
		var imagedata = context.getImageData(0, 0, canvas.width, canvas.height);
		var buf8 = imagedata.data;
		
		var l = buf8.length;
		var l2 = l>>1;
		
		for ( var i = l; --i >= l2; )
		{
			var b = buf8[i+3];
			buf8[i+3] = 0xff;
			buf8[i] = b;
			buf8[i+1] = b;
			buf8[i+2] = b;
		}
		
		for ( i = l2; --i > -l; )
		{
			buf8[i+3] = 0xff;
		}
		
		
		
		currentMaskCanvas = document.createElement("canvas");
		currentMaskCanvas.width = img.naturalWidth;
		currentMaskCanvas.height = img.naturalHeight * 2;
		var context2 = currentMaskCanvas.getContext("2d");
		context2.putImageData(imagedata, 0, 0);
		
		if ( $( "#qualitySlider" ).slider != null )
		{
			compress($( "#qualitySlider" ).slider( "option", "value" ));
		} else {
			compress(0.5);
		}
		
	}
	
	
	function onJpegQualityChanged(event, ui)
	{
		if ( $( "#qualitySlider" ).slider != null )
		{
			compress($( "#qualitySlider" ).slider( "option", "value" ));
		} else {
			compress(0.5);
		}
	}
	
	function compress(quality){
		if ( currentMaskCanvas == undefined ) return;
		
		 compressed.innerHTML = "";
		 currentEmbeddedSVG = maskedImageToSVG(quality,true);
		 
		 if ( currentEmbeddedSVG.outerHTML )
		 {
			rawSVG = currentEmbeddedSVG.outerHTML.toString()
		 } else {
			rawSVG = new XMLSerializer().serializeToString(currentEmbeddedSVG);
		 }
		 
		 
		 var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
		var is_safari = navigator.userAgent.indexOf("Safari") > -1;
		if ((is_chrome)&&(is_safari)) {is_safari=false;}
		
		if (!is_safari )
		{
		 var img = new Image();
		  img.style.height= "auto"; 
		 img.style.maxWidth= "592px";
		 img.style.height= "auto"; 
		 img.src ="data:image/svg+xml;utf-8,"+escape(rawSVG);
		 img.width = currentImage.width;
		 img.height = currentImage.height;
		 compressed.appendChild(img);
		} else {
		
			currentEmbeddedSVG.width = currentImage.width;
			currentEmbeddedSVG.height = currentImage.height;
			
			compressed.appendChild(currentEmbeddedSVG);
		}		
		 
		 
		 var size1 = rawSVG.length;
		 newImageData = currentMaskCanvas.toDataURL("image/jpeg", quality);
		 document.getElementById('compressedStatus').innerHTML = 
		"<p>Original PNG: <strong>"+ Math.round( sourceFileSize / 1024)+"kB</strong>"+
		" - ZorroSVG: <strong>"+ Math.round(size1 / 1024)+"kB</strong>, that's "+
		"<strong><span style='color:#b01000;'>"+ Math.round(size1 / sourceFileSize * 100)+"% of the original size</span></strong></p>"+
		(size1 > sourceFileSize ? "In this case, you rather shouldn't, but if you insist you still can":"")+
		 "<p style='font-size:1.5em;font-decoration:bold;'>=&gt; <a id='singlesvg'>Download converted SVG image</a></p>";
	
		var a = document.getElementById("singlesvg");
			a.onclick = download;
			a.href = "#";
		
		document.getElementById("originalSize").innerHTML = "Original Transparent PNG: "+Math.round( sourceFileSize / 1024)+"kB";
		document.getElementById("zorroSize").innerHTML = "ZorroSVG: "+Math.round(size1 / 1024)+"kB (live rendered)";
		
	}
	
	function download(e) {
		e.preventDefault();
		var blob = new Blob([rawSVG], {type: "image/svg+xml"});
		saveAs(blob, currentFileName+".svg");
	} 
	
	function maskedImageToSVG(quality, embedded) {
	
		var svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
		svg.setAttribute('xmlns',"http://www.w3.org/2000/svg" );
		svg.setAttribute('width', currentMaskCanvas.width);
		svg.setAttribute('height', currentMaskCanvas.height*0.5);
		svg.setAttribute('viewBox', "0 0 "+currentMaskCanvas.width+" "+(currentMaskCanvas.height*0.5));
		
		svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		
		
		var defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
		svg.appendChild(defs);
		
		var filter = document.createElementNS("http://www.w3.org/2000/svg", 'filter');
		filter.setAttribute("id","a"); 
		defs.appendChild(filter);
		
		var feOffset = document.createElementNS("http://www.w3.org/2000/svg", 'feOffset');
		feOffset.setAttribute("dy",-currentMaskCanvas.height*0.5); 
		feOffset.setAttribute("in","SourceGraphic" ); 
		feOffset.setAttribute("result","b"); 
		filter.appendChild(feOffset);
	
		var feColorMatrix = document.createElementNS("http://www.w3.org/2000/svg", 'feColorMatrix');
		feColorMatrix.setAttribute("in","b" ); 
		feColorMatrix.setAttribute("result","b"); 
		feColorMatrix.setAttribute("type","matrix"); 
		feColorMatrix.setAttribute("values","0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0"); 
		filter.appendChild(feColorMatrix);
		
		var	feComposite = document.createElementNS("http://www.w3.org/2000/svg", 'feComposite');
		feComposite.setAttribute("in","SourceGraphic" ); 
		feComposite.setAttribute("in2","b" ); 
		feComposite.setAttribute("operator","in" ); 
		filter.appendChild(feComposite);
			
		var image = document.createElementNS("http://www.w3.org/2000/svg", 'image');
		image.setAttribute("width","100%"); 
		image.setAttribute("height","200%"); 
		
		if ( embedded )
			image.setAttributeNS("http://www.w3.org/1999/xlink", "A:href",currentMaskCanvas.toDataURL("image/jpeg", quality));
		else
			image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href",currentFileName+".jpg");
		
		image.setAttribute("filter","url(#a)"); 
		svg.appendChild(image);
		return svg;
	}
	
	