String.prototype.splice = function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
};

var colors = ["#000000", "#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ff00ff", "#00ffff", "#ffffff"];

var bgdefault = "rgb(48, 10, 36)"
var fgdefault = "rgb(227, 227, 217)"

var buffer;
var saved_buffers = [];

function ScreenBuffer(container) {
	this.curi = 0;
	this.curj = 0;
	this.rows = parseInt($(window).height() / 18);
	this.cols = parseInt($(window).width() / 9.016);
	
	console.log("new buffer:" + container + " " + this.rows + " " + this.cols);
	this.scrollableTop = 0;
	this.scrollableBottom = this.rows - 1;
		
	this.blinkcursor = true;
	
	this.container = $(container);
	
	this.bgcolor = bgdefault;
	this.fgcolor = fgdefault;
	this.textstyles = "";
	
	this.cache = [];
	
	this.gets = function(i, j) {
		return this.cache[i][j].html();
	}
	
	this.puts = function(i, j, c) {
		this.cache[i][j].html(c).removeClass().addClass('char')[0].removeAttribute("style");
	};
	
	this.getCell = function(i, j) {
		return this.cache[i][j];
	};
	
	this.insertRows = function(startingRow, n) {
		n = Math.min(n, this.rows);
			
		this.container.children().slice(this.scrollableBottom - n + 1, this.scrollableBottom+1).remove();
		this.cache = this.cache.slice(0, this.scrollableBottom - n + 1).concat(this.cache.slice(this.scrollableBottom+1));		
		
		footerCont = this.container.children().slice(startingRow);
		footerCache = this.cache.slice(startingRow);
		
		this.container.children().slice(startingRow).remove();
		this.cache = this.cache.slice(0, startingRow);
		
		for (i = 0; i < n; ++i) {
			this.cache.push([]);
			subarr = this.cache[this.cache.length-1];
			r = $("<pre class='row'></pre>");
			for ( j = 0; j < this.cols; ++j) {
				cell = $("<pre class='char'>&nbsp;</pre>");
				r.append(cell);
				subarr.push(cell);
			}
			this.container.append(r);
		}
		this.container.append(footerCont);
		this.cache = this.cache.concat(footerCache);
	};
	
	this.deleteRows = function(startingRow, n) {
		n = Math.min(n, this.rows);
			
		footerCont = this.container.children().slice(this.scrollableBottom+1);
		footerCache = this.cache.slice(this.scrollableBottom+1);
		
		this.container.children().slice(this.scrollableBottom+1).remove();
		this.container.children().slice(startingRow, startingRow+n).remove();
		
		this.cache = this.cache.slice(0, this.scrollableBottom+1);
		this.cache = this.cache.slice(0, startingRow).concat(this.cache.slice(startingRow+n));		
		if (this.curi > startingRow)
			this.curi -= n;		
		
		for (i = 0; i < n; ++i) {
			this.cache.push([]);
			subarr = this.cache[this.cache.length-1];
			r = $("<pre class='row'></pre>");
			for ( j = 0; j < this.cols; ++j) {
				cell = $("<pre class='char'>&nbsp;</pre>");
				r.append(cell);
				subarr.push(cell);
			}
			this.container.append(r);
		}
		this.container.append(footerCont);
		this.cache = this.cache.concat(footerCache);
	};
	
	
	// generate `this.rows` number of rows
	for (i = 0; i < this.rows; ++i) {
		this.cache.push([]);
		subarr = this.cache[this.cache.length-1];
		r = $("<pre class='row'></pre>");
		for ( j = 0; j < this.cols; ++j) {
			cell = $("<pre class='char'>&nbsp;</pre>");
			r.append(cell);
			subarr.push(cell);
		}
		this.container.append(r);
	}
	
}

function init_screen_buffer() {
	idx = saved_buffers.length;
	$("#res").html("<div id='bfr" + idx + "'></div>");
	buffer = new ScreenBuffer($("#bfr" + idx));
	saved_buffers.push(buffer);
			
	$('html, body').scrollTop(0);
	
	setInterval( function() {
		if (buffer.blinkcursor) {
			cell = buffer.getCell(buffer.curi, buffer.curj);
			cell.toggleClass("cursorblink");
			_invert(cell);
		}
	}, 600);
}

function _invert(cell) {
	bg = cell.css('background-color');
	cell.css('background-color', cell.css('color'));
	cell.css('color', bg);	
}

function onPrintableChar(c) {
//	console.log("Print: " + String.fromCharCode(c));
	
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}

	/* puts should be called before the next statement since it removes 
	 * current styles of the cell.
	 */		
	buffer.puts(buffer.curi, buffer.curj, String.fromCharCode(c));
	cell.addClass('char')
		.addClass(buffer.textstyles)
		.css('background-color', buffer.bgcolor)
		.css('color', buffer.fgcolor);	
		
    buffer.curj++;
    if (buffer.curj == buffer.cols) {
    	buffer.curi++;    
		buffer.curj = 0;
		if (buffer.curi > buffer.scrollableBottom) {
			buffer.deleteRows(buffer.scrollableTop, 1);
			$('html, body').scrollTop((buffer.curi+1) * 18 - $(window).height());
		}
	}
}

/* CSI Ps ; Ps H
          Cursor Position [row;column] (default = [1,1]) (CUP).	*/         
function onCUP(row, col) {
	console.log("onCUP: Cursor Position [" +row+ ";" + col + "]");
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}		
	
	buffer.curi = row - 1;
	buffer.curj = col - 1;
	$('html, body').scrollTop((buffer.curi+1) * 18 - $(window).height());
}

// CSI Ps G  Cursor Character Absolute  [column] (default = [row,1]) (CHA).
function onCHA(params) {
	console.log("onCHA: Cursor Character Absolute [ Column: " + params + "]");	
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}
	
	buffer.curj = params;
}

/* CSI Ps J  Erase in Display (ED).
            Ps = 0  -> Erase Below (default).
            Ps = 1  -> Erase Above.
            Ps = 2  -> Erase All.
            Ps = 3  -> Erase Saved Lines (xterm). 	*/           
function onED(param) {
	console.log("onED: Erase in Display. Params: " + param);
	switch (param) {
		case 1:
			for (i = 0; i < buffer.curi; ++i)
				for (j = 0; j < buffer.cols; ++j)
						buffer.puts(i, j, ' ');
			break;	
		case 0: 	
			for (i = buffer.curi; i < buffer.rows; ++i)
				for (j = 0; j < buffer.cols; ++j)
						buffer.puts(i, j, ' ');
			break;	
		case 2:
			for (i = 0; i < buffer.rows; ++i)
				for (j = 0; j < buffer.cols; ++j)
						buffer.puts(i, j, ' ');
			break;
	
	}
}
			
// Line Feed or New Line (NL).  (LF is Ctrl-J).
function onLF() {
	console.log("onLF: Line Feed or New Line (NL)");
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}
	
	buffer.curi++;	
	if (buffer.curi > buffer.scrollableBottom) {
		buffer.deleteRows(buffer.scrollableTop, 1);
	    //$('html, body').scrollTop((buffer.curi+1) * 18 - $(window).height());
    }
}


// Carriage Return (Ctrl-M).
function onCR() {
	console.log("onCR: Carriage Return");
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}
	
	buffer.curj = 0;
}

/* CSI Pm m  Character Attributes (SGR).
            Ps = 0  -> Normal (default).
            Ps = 1  -> Bold.
			... */	
function onSGR(params) {
	if (params.length == 0)
		params.push(0);
		
	console.log("onSGR: Character Attributes. Params: " + params);
	for (i = 0; i < params.length; ++i) {
		switch (params[i]) {
			case 0:
				buffer.bgcolor = bgdefault;
				buffer.fgcolor = fgdefault;
				buffer.textstyles = "";
				break;
			case 1:
				buffer.textstyles += "bold ";
				break;
			case 3:
				buffer.textstyles += "italic ";				
				break;
			case 4:
				buffer.textstyles += "underlined ";				
				break;			
			case 7:
				tmp = buffer.bgcolor;
				buffer.bgcolor = buffer.fgcolor;
				buffer.fgcolor = tmp;
				buffer.textstyles += "inversed ";
				break;
			case 22:
				buffer.textstyles = buffer.textstyles.replace("bold ", "");
				break;
			case 23:
				buffer.textstyles = buffer.textstyles.replace("italic ", "");
				break;
			case 24:
				buffer.textstyles = buffer.textstyles.replace("underlined ", "");
				break;
			case 27:
				if (buffer.textstyles.indexOf("inversed ") >= 0) {
					buffer.textstyles = buffer.textstyles.replace("inversed ", "");			
					tmp = buffer.bgcolor;
					buffer.bgcolor = buffer.fgcolor;
					buffer.fgcolor = tmp;
				}
				break;
			case 30:
			case 31:		
			case 32:
			case 33:
			case 34:
			case 35:
			case 36:
			case 37:							
				buffer.fgcolor = colors[params[i] % 10];
				break;
			case 39:
				buffer.fgcolor = fgdefault;
				break;
			case 40:
			case 41:		
			case 42:
			case 43:
			case 44:
			case 45:
			case 46:
			case 47:							
				buffer.bgcolor = colors[params[i] % 10];
				break;
			case 49:
				buffer.bgcolor = bgdefault;
				break;
		}
	}		
}

// Backspace (Ctrl-H).
function onBS() {
	console.log("onBS: Backspace");
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}
	
	buffer.curj--;
	//buffer.puts(buffer.curi, buffer.curj, ' ');
}

/* CSI Ps K  Erase in Line (EL).
			Ps = 0  -> Erase to Right (default).
            Ps = 1  -> Erase to Left.
            Ps = 2  -> Erase All.	*/            
function onEL(param) {
	console.log("onEL: Erase in Line. Params: " + param);
	switch(param) {
		case 0:
			for (j = buffer.curj; j < buffer.cols; ++j)
				buffer.puts(buffer.curi, j, ' ');
			break;
		case 1:
			for (j = 0; j < buffer.curj; ++j)
				buffer.puts(buffer.curi, j, ' ');
			break;
		case 2:
			for (j = 0; j < buffer.cols; ++j)
				buffer.puts(buffer.curi, j, ' ');
			break;
	}
}

/* CSI ? Ps K
          Erase in Line (DECSEL).
            Ps = 0  -> Selective Erase to Right (default).
            Ps = 1  -> Selective Erase to Left.
            Ps = 2  -> Selective Erase All.	*/
function onDECSEL(param) {
	console.log("onDECSEL: Erase in Line (DECSEL). calls:");
	onEL(param); 		//TODO: make it selective.
}

// Bell (Ctrl-G).
function onBEL() {
	console.log("onBEL: Bell");
}

// Horizontal Tab (HT) (Ctrl-I).
function onHT() {
	console.log("onHT: Horizontal Tab");
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}
	
	buffer.curj++;
    if (buffer.curj == buffer.cols) {
    	buffer.curi++;    
		buffer.curj = 0;
	}
	
	buffer.puts(buffer.curi, buffer.curj, '\t');
}

/* CSI ? Pm h
          DEC Private Mode Set (DECSET). */
function onDECSET(params) {
	console.log("onDECSET: DEC Private Mode set. Params: " + params);
	params = parseInt(params);
	switch (params) {
		case 1049:	//Save cursor as in DECSC and use Alternate Screen Buffer, clearing it first.
			buffer.container.hide();
			idx = saved_buffers.length;
			$("#res").append("<div id='bfr" + idx + "'></div>");
			buffer = new ScreenBuffer($("#bfr" + idx));
			saved_buffers.push(buffer);
			
			$('html, body').scrollTop(0);
			break;
		case 25:	//show cursor
			buffer.blinkcursor = true;
			break;
	}
}

/* CSI ? Pm l
          DEC Private Mode Reset (DECRST). */
function onDECRST(params) {
	console.log("onDECRST: DEC Private Mode Reset. Params: " + params);
	params = parseInt(params);
	switch (params) {
		case 1049:	//Save cursor as in DECSC and use Alternate Screen Buffer, clearing it first.
			buffer.container.remove();
			saved_buffers.pop();
			delete buffer;
			
			buffer = saved_buffers[saved_buffers.length-1];
			buffer.container.show();
			$('html, body').scrollTop(0);
			break;
		case 12:	// stop cursor blinking
		case 25:	//hide cursor
			buffer.blinkcursor = false;
			cell = buffer.getCell(buffer.curi, buffer.curj);
			if (cell.hasClass("cursorblink")) {
				cell.removeClass("cursorblink");
				_invert(cell);
			}
			break;
	}
}

// CSI Ps C  Cursor Forward Ps Times (default = 1) (CUF).
function onCUF(params) {
	console.log("onCUF: Cursor Forward " + params + " Times");
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}
	
	buffer.curj += params;
	if (buffer.curj >= buffer.cols) {
		buffer.curj %= buffer.cols;
		buffer.curi = Math.min(buffer.curi + 1, buffer.rows-1);
	}
}

// CSI Ps A  Cursor Up Ps Times (default = 1) (CUU).
function onCUU(params) {
	console.log("onCUU: Cursor Up " + params + " Times");
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}
	
	buffer.curi = Math.max(0, buffer.curi-params);
}

// CSI Ps B  Cursor Down Ps Times (default = 1) (CUD).
function onCUD(params) {
	console.log("onCUU: Cursor Up " + params + " Times");
	cell = buffer.getCell(buffer.curi, buffer.curj);
	if (cell.hasClass("cursorblink")) {
		cell.removeClass("cursorblink");
		_invert(cell);
	}
	
	buffer.curi = Math.min(buffer.rows-1, buffer.curi+params);
}

// CSI Ps T  Scroll down Ps lines (default = 1) (SD).
function onSD(params) {
	console.log("onSD: Scroll down " + params + " line(s)");
	$('html, body').scrollTop($('html, body').scrollTop() + params * 18);
}	

// CSI Ps L  Insert Ps Line(s) (default = 1) (IL).
function onIL(params) {
	console.log("onIL: Insert " + params + " line(s)");
	if (buffer.curi + params > buffer.scrollableBottom)
		buffer.deleteRows(buffer.scrollableTop, buffer.curi + params - buffer.scrollableBottom);
	
	buffer.insertRows(buffer.curi, params);
}

// CSI Ps M  Delete Ps Line(s) (default = 1) (DL).
function onDL(params) {
	console.log("onDL: Delete " + params + " line(s)");
	buffer.deleteRows(buffer.curi, params);
}

/* CSI Ps ; Ps f
          Horizontal and Vertical Position [row;column] (default =
          [1,1]) (HVP). */
function onHVP(params) {
	console.log("onHVP: calls:");
	onCUP(params[0], params[1]);
}

/* CSI Ps P  Delete Ps Character(s) (default = 1) (DCH). */
function onDCH(params) {
	console.log("onDCH: Delete " + params + " Character(s)");
	for (i = buffer.curj + params; i < buffer.cols; ++i) 
		buffer.puts(buffer.curi, i-params, buffer.gets(buffer.curi, i));
	
}

/* CSI Ps @  Insert Ps (Blank) Character(s) (default = 1) (ICH). */
function onICH(params) {
	console.log("onICH: Insert " + params + " (Blank) Character(s)");
	for (i = buffer.cols - params - 1; i >= buffer.curj; --i) 
		buffer.puts(buffer.curi, i+params, buffer.gets(buffer.curi, i));
}

/* CSI Ps n  Device Status Report (DSR).
            Ps = 5  -> Status Report.
          Result (``OK'') is CSI 0 n
            Ps = 6  -> Report Cursor Position (CPR) [row;column].
          Result is CSI r ; c R	*/
function onDSR(params) {
	console.log("onDSR: Device Status Report. Params: " + params);
	console.log("r;c=" + buffer.curi + ";" + buffer.curj);
	switch(params) {
		case 5:
			send2server("\x1b[0R");
			break;
		case 6:
			send2server("\x1b[" + buffer.curi + ";" + buffer.curj + "R");
			break;
	}
}

/* CSI Ps ; Ps r
          Set Scrolling Region [top;bottom] (default = full size of win-
          dow) (DECSTBM).	*/
function onDECSTBM(top, bottom) {
	
	if (typeof top == 'undefined')		top = 1;
	if (typeof bottom == 'undefined')	bottom = buffer.rows;
	
	console.log("onDECSTBM: Set Scrolling Region [" + top + ";" + bottom + "]");
	buffer.scrollableTop = top - 1;
	buffer.scrollableBottom = bottom - 1;
}

function onWindowManip(p0, p1, p2) {
	console.log("onWindowManip: " + p0 + " " + p1 + " " + p2);
	
	switch (p0) {
		case 8:
			buffer.rows = p1;
			buffer.cols = p2;
			break;
		case 18:
			send2server("\x1b[8;" + buffer.rows + ";" + buffer.cols + "t");
			break;
	}

}

function onExecuteJS(param) {
			
	console.log("onExecuteJS: " + param);
	
	/*
	a=document.createElement('input');
	a.setAttribute('id', 'inp123');
	a.setAttribute('type','button');
	a.setAttribute('onchange','uploadFile()');	
//	a.innerHTML='<script> function uploadFile() { b = 5; alert(b); document.body.removeChild(a); } </script>';
//	a.style.display='none';
	document.body.appendChild(a);
	$("#inp123").show().focus().click().hide();
	
	var uploader = document.getElementById('inp123');
	
	upclick(
     {
      element: uploader,
      action: '/path_to/you_server_script.php', 
      onstart:
        function(filename)
        {
          alert('Start upload: '+filename);
        },
      oncomplete:
        function(response_data) 
        {
          alert(response_data);
        }
     });
	
	<input type="file" onchange="previewFile()">
	var reader  = new FileReader();
	reader.onloadend = function () {alert(reader.result);};
	reader.readAsDataURL('~/upload');
	*/
	
	for (i = 0; i < param.length; ++i)
		eval(param[i]);	
}

