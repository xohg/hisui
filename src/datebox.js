﻿(function($){
	/**
	 * create date box
	 */
	function createBox(target){
		var state = $.data(target, 'datebox');
		var opts = state.options;
		
		$(target).addClass('datebox-f').combo($.extend({}, opts, {
			onShowPanel:function(){
				setCalendar();
				setValue(target, $(target).datebox('getText'), true);
//				setValue(target, $(target).datebox('getText'));
				opts.onShowPanel.call(target);
			}
		}));
		$(target).combo('textbox').parent().addClass('datebox');
		
		/**
		 * if the calendar isn't created, create it.
		 */
		if (!state.calendar){
			createCalendar();
		}
		setValue(target, opts.value);
		$(target).combo('textbox').unbind('.datebox').bind("blur.datebox",function(e){
			//calendar-nav-hover
			/*var rt = $(e.relatedTarget) ;
			if (rt.length>0){
				if (rt.closest('.datebox-button').length==0 && rt.closest('.datebox-calendar-inner').length==0){
					doBlur(target);
				}
			}else{
				var cl = $.data(target,'datebox').calendar.closest('.panel-body');
				if (cl.find('.calendar-hover').length==0 && cl.find('.calendar-nav-hover').length==0){
					doBlur(target);
				}
			}*/	
			/** 点击 calendar时不触发doBlur, 点击今天没办法判断(转成setTimeout判断) */
			if ($(target).combo('textbox').parent().find('.combo-arrow-hover').length>0){return ;}
			var cl = $.data(target,'datebox').calendar.closest('.panel-body');
			if (cl.find('.calendar-hover').length>0){return ;}
			if (cl.find('.calendar-nav-hover').length>0){return ;}
			var curVal = $(target).combo('getText'); 
			setTimeout(function(){
				if (curVal == $(target).combo('getText')){ //没有点击今天,或日历中其它日期
					doBlur(target);
				}
			},200);
		})
		function createCalendar(){
			var panel = $(target).combo('panel').css('overflow','hidden');
			panel.panel('options').onBeforeDestroy = function(){
				var sc = $(this).find('.calendar-shared');
				if (sc.length){
					sc.insertBefore(sc[0].pholder);
				}
			};
			var cc = $('<div class="datebox-calendar-inner"></div>').appendTo(panel);
			if (opts.sharedCalendar){
				var sc = $(opts.sharedCalendar);
				if (!sc[0].pholder){
					sc[0].pholder = $('<div class="calendar-pholder" style="display:none"></div>').insertAfter(sc);
				}
				sc.addClass('calendar-shared').appendTo(cc);
				if (!sc.hasClass('calendar')){
					sc.calendar();
				}
				state.calendar = sc;
//				state.calendar = $(opts.sharedCalendar).appendTo(cc);
//				if (!state.calendar.hasClass('calendar')){
//					state.calendar.calendar();
//				}
			} else {
				state.calendar = $('<div></div>').appendTo(cc).calendar();
			}
			$.extend(state.calendar.calendar('options'), {
				fit:true,
				border:false,
				onSelect:function(date){
					var opts = $(this.target).datebox('options');
					setValue(this.target, opts.formatter.call(this.target, date));
					$(this.target).combo('hidePanel');
					opts.onSelect.call(target, date);
				}
			});
//			setValue(target, opts.value);
			
			var button = $('<div class="datebox-button"><table cellspacing="0" cellpadding="0" style="width:100%"><tr></tr></table></div>').appendTo(panel);
			var tr = button.find('tr');
			for(var i=0; i<opts.buttons.length; i++){
				var td = $('<td></td>').appendTo(tr);
				var btn = opts.buttons[i];
				var t = $('<a href="javascript:void(0)"></a>').html($.isFunction(btn.text) ? btn.text(target) : btn.text).appendTo(td);
				t.bind('click', {target: target, handler: btn.handler}, function(e){
					e.data.handler.call(this, e.data.target);
				});
			}
			tr.find('td').css('width', (100/opts.buttons.length)+'%');
		}
		
		function setCalendar(){
			var panel = $(target).combo('panel');
			var cc = panel.children('div.datebox-calendar-inner');
			panel.children()._outerWidth(panel.width());
			state.calendar.appendTo(cc);
			state.calendar[0].target = target;
			if (opts.panelHeight != 'auto'){
				var height = panel.height();
				panel.children().not(cc).each(function(){
					height -= $(this).outerHeight();
				});
				cc._outerHeight(height);
			}
			state.calendar.calendar('resize');
		}
	}
	
	/**
	 * called when user inputs some value in text box
	 */
	function doQuery(target, q){
		setValue(target, q, true);
	}
	function validDate(s){
        /*t-n , t+n*/
		if (!s) return false;
		if (s.charAt(0).toUpperCase()=='T'){return true;}
		if ("undefined"!=typeof dtformat &&  dtformat == 'DMY'){return true;}
		if (s.charAt(0).toUpperCase()=='T'){
			/*2019-6-6 => 2019-06-06 */
			var ss =  s.split('-');
			var ss1 = parseInt(ss[0],10);
			var ss2 = parseInt(ss[1],10);
			var ss3 = parseInt(ss[2],10);
			if (!isNaN(ss1) && !isNaN(ss2) && !isNaN(ss3)){
				s = ss1+"-"+(ss2>9?ss2:'0'+ss2)+'-'+(ss3>9?ss3:'0'+ss3);
			}else{
				return false;
			}
		}
		var reg = /((?!0000)[0-9]{4}((0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-8])|(0[13-9]|1[0-2])(29|30)|(0[13578]|1[02])31)|([0-9]{2}(0[48]|[2468][048]|[13579][26])|(0[48]|[2468][048]|[13579][26])00)0229)/;
		var reg2 = /((?!0000)[0-9]{4}-((0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-8])|(0[13-9]|1[0-2])-(29|30)|(0[13578]|1[02])-31)|([0-9]{2}(0[48]|[2468][048]|[13579][26])|(0[48]|[2468][048]|[13579][26])00)-02-29)/;
        var y=NaN, m=NaN, d=NaN;    
		if (reg.test(s)){
			y = parseInt(s.slice(0,4),10);
			m = parseInt(s.slice(4,6));
			d = parseInt(s.slice(6,8));
		}else if(reg2.test(s)){
			var ss = s.split('-');
			y = parseInt(ss[0],10);
			m = parseInt(ss[1],10);
			d = parseInt(ss[2],10);
		}
		if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
			return true;
		} else {
			return false;
		}
    }
	/**
	 * called when user press enter key
	 */
	function doEnter(target){
		var state = $.data(target, 'datebox');
        var opts = state.options;
		var current = state.calendar.calendar('options').current;
		if (current){
			setValue(target, opts.formatter.call(target, current));
			console.log('hidePanel');
			$(target).combo('hidePanel');
		}
	}
	function doBlur(target){
		console.log('do blur');
		$(target).combo('textbox').validatebox('enableValidation');
		if ($(target).combo('textbox').validatebox("isValid")) {
			doEnter(target);
		}
	}
	function setValue(target, value, remainText){
		var state = $.data(target, 'datebox');
		var opts = state.options;
		var calendar = state.calendar;
        $(target).combo('setValue', value);
        calendar.calendar('moveTo', opts.parser.call(target, value));
		if (!remainText){
			if (value){
				value = opts.formatter.call(target, calendar.calendar('options').current);
				$(target).combo('setValue', value).combo('setText', value);
			} else {
				$(target).combo('setText', value);
			}
		}
	}
	
	$.fn.datebox = function(options, param){
		if (typeof options == 'string'){
			var method = $.fn.datebox.methods[options];
			if (method){
				return method(this, param);
			} else {
				return this.combo(options, param);
			}
		}
		
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'datebox');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'datebox', {
					options: $.extend({}, $.fn.datebox.defaults, $.fn.datebox.parseOptions(this), options)
				});
			}
			createBox(this);
		});
	};
	
	$.fn.datebox.methods = {
		options: function(jq){
			var copts = jq.combo('options');
			return $.extend($.data(jq[0], 'datebox').options, {
				originalValue: copts.originalValue,
				disabled: copts.disabled,
				readonly: copts.readonly
			});
		},
		calendar: function(jq){	// get the calendar object
			return $.data(jq[0], 'datebox').calendar;
		},
		setValue: function(jq, value){
			return jq.each(function(){
				setValue(this, value);
			});
		},
		reset: function(jq){
			return jq.each(function(){
				var opts = $(this).datebox('options');
				$(this).datebox('setValue', opts.originalValue);
			});
		}
	};
	
	$.fn.datebox.parseOptions = function(target){
		return $.extend({}, $.fn.combo.parseOptions(target), $.parser.parseOptions(target, ['sharedCalendar']));
	};
	
	$.fn.datebox.defaults = $.extend({}, $.fn.combo.defaults, {
		panelWidth:180,
		panelHeight:'auto',
		sharedCalendar:null,
		
		keyHandler: {
			up:function(e){},
			down:function(e){},
			left: function(e){},
			right: function(e){},
			enter:function(e){doBlur(this);},
			query:function(q,e){
				$(this).combo('textbox').validatebox('disableValidation');
				doQuery(this, q);
			}
		},
		
		currentText:'Today',
		closeText:'Close',
		okText:'Ok',
		
		buttons:[{
			text: function(target){return $(target).datebox('options').currentText;},
			handler: function(target){
				$(target).datebox('calendar').calendar({
					year:new Date().getFullYear(),
					month:new Date().getMonth()+1,
					current:new Date()
				});
				doEnter(target);
			}
		},{
			text: function(target){return $(target).datebox('options').closeText;},
			handler: function(target){
				$(this).closest('div.combo-panel').panel('close');
			}
		}],
		formatter:function(date){
			var y = date.getFullYear();
			var m = date.getMonth()+1;
			var d = date.getDate();
			return m+'/'+d+'/'+y;
		},
		parser:function(s){
			var t = Date.parse(s);
			if (!isNaN(t)){
				return new Date(t);
			} else {
				return new Date();
			}
		},
        onSelect:function(date){},
        validType:'datebox',
        rules: {
            datebox: {
                validator: function (_442) {
                    return validDate(_442);
                }, message:"Please enter a valid date."
            }
        }
	});
})(jQuery);
