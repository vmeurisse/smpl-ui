define(['./smpl.ui.core', 'smpl/smpl.data', 'smpl/smpl.date', 'smpl/smpl.dom'], function(smpl) {
	'use strict';
	
	/**
	 * @param {Integer} config.firstDayOfWeek First day of week to be displayed. 0: sunday, 1: monday... (default: 1)
	 * @param {Integer} config.numberOfMonths Number of months to be displayed (default: 1)
	 * @param {String} config.selectedDate
	 * @param {String} config.template
	 * @param {Function} config.onSelect
	 */
	smpl.ui.Calendar = function(config) {
		this.config = config;
		
		var defaultConfig = {
			firstDayOfWeek: 1,
			numberOfMonths: 1
		};
		smpl.data.extendObject(this.config, defaultConfig);
		this.config.template = this.config.template.getInstance();
		
		this.setMinDate(this.config.minDate);
		this.setMaxDate(this.config.maxDate);
		this.today = this.getDate(new Date());
		this.setSelectedDate(this.config.selectedDate);
		this.defaultDate = smpl.date.clone(this.currentDate || this.today);
		this.currentMonth;
	};
	
	smpl.ui.Calendar.prototype.setContainer = function(container) {
		this.config.container = container;
	};
	
	smpl.ui.Calendar.prototype.setMinDate = function(minDate) {
		this.minDate = minDate ? this.getDate(minDate) : null;
	};
	
	smpl.ui.Calendar.prototype.setMaxDate = function(maxDate) {
		this.maxDate = maxDate ? this.getDate(maxDate) : null;
	};
	
	smpl.ui.Calendar.prototype.update = function() {
		if (!this.isValid(this.currentDate)) {
			this.setCurrentDate(null);
			this.adjustCurrentMonth();
		}
	};
	
	/**
	 * 
	 */
	smpl.ui.Calendar.prototype.getSelectedDate= function() {
		var date = this.currentDate || this.defaultDate;
		return date && smpl.date.clone(date);
	};
	smpl.ui.Calendar.prototype.setSelectedDate= function(date) {
		if (date) {
			date = this.getDate(date);
			this.defaultDate = date;
			this.currentDate = this.isValid(date) ? smpl.date.clone(date) : undefined;
		} else {
			this.currentDate = undefined;
		}
		this.adjustCurrentMonth();
		return !!this.currentDate;
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.getCurrentDate = function() {
		if (this.currentDate) return this.currentDate;
		else return this.adjustDate(this.defaultDate);
	};
	smpl.ui.Calendar.prototype.setCurrentDate = function(date) {
		this.currentDate = date;
		if (date) {
			this.defaultDate = date;
		}
	};
	
	/**
	 * Get a date object to use with the calendar. Dates use local time. Hours are set at 12 to avoid issues with DST.
	 * 
	 * @method getDate
	 * @private
	 * 
	 * @param date {Date|string} The reference date. It can be either:
	 * - a `Date` object. The date is copied and the original object is not touched
	 * - a `String` in the format `'YYYY-MM-DD'`.
	 * 
	 * @return {Date} the date object
	 */
	smpl.ui.Calendar.prototype.getDate = function(date) {
		if (typeof date !== 'string') {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0);
		}
		date = date.split('-');
		return new Date(+date[0], +date[1] - 1, +date[2], 12, 0);
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.getMonth = function(date) {
		date = smpl.date.clone(date);
		
		var month = date.getMonth();
		var dow = date.getDay();
		var fdow = this.config.firstDayOfWeek;
		smpl.date.shift(date, (fdow - dow - 7) % 7);
		if (dow === fdow && smpl.date.lastDayOfMonth(date).getDate() === 28) {
			// Special case for February. Avoid 2 empty weeks at the end of the month
			smpl.date.shift(date, -7);
		}
		var data = [];
		
		var defaultDate = this.getCurrentDate();
		var selected;
		for (var i = 0; i < 6; i++) { 
			var week = [];
			data.push(week);
			for (var j = fdow; j < fdow + 7; j++) {
				if (this.currentDate) selected = smpl.date.diff(date, this.currentDate) === 0;
				else selected = smpl.date.diff(date, defaultDate) === 0 ? 'default' : false;
				week.push({
					dow: date.getDay(),
					dom: date.getDate(),
					date: smpl.date.clone(date),
					inMonth: date.getMonth() === month,
					valid: this.isValid(date),
					isToday: smpl.date.diff(date, this.today) === 0,
					selected: selected
				});
				smpl.date.shift(date, 1);
			}
		}
		return data;
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.isValid = function(date) {
		if (!date) return false;
		if (this.minDate && smpl.date.diff(date, this.minDate) > 0) return false;
		if (this.maxDate && smpl.date.diff(date, this.maxDate) < 0) return false;
		if (this.config.isValid && !this.config.isValid(smpl.date.clone(date))) return false;
		return true;
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.hasPreviousMonth = function() {
		if (!this.minDate) return true;
		return smpl.date.diff(this.currentMonth, this.minDate) < 0;
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.hasNextMonth = function() {
		if (!this.maxDate) return true;
		var lastDisplayedMonth = smpl.date.shiftMonth(smpl.date.clone(this.currentMonth), this.config.numberOfMonths);
		return smpl.date.diff(lastDisplayedMonth, this.maxDate) >= 0;
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.nextMonth = function() {
		if (!this.hasNextMonth()) return false;
		smpl.date.shiftMonth(this.currentMonth, 1);
		this.show();
		return true;
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.previousMonth = function() {
		if (!this.hasPreviousMonth()) return false;
		smpl.date.shiftMonth(this.currentMonth, -1);
		this.show();
		return true;
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.adjustDate = function(date, limitToMonth) {
		if (this.isValid(date)) return date;
		
		var candidate;
		if (this.minDate && smpl.date.diff(date, this.minDate) > 0) {
			candidate = smpl.date.shift(smpl.date.clone(this.minDate), -1);
		} else {
			candidate = date;
		}
		var upDate = this.multiShift(candidate, +1);
		var up = upDate ? smpl.date.diff(candidate, upDate) : Infinity;
		
		if (this.maxDate && smpl.date.diff(date, this.maxDate) < 0) {
			candidate = smpl.date.shift(smpl.date.clone(this.maxDate), 1);
		} else {
			candidate = date;
		}
		var downDate = this.multiShift(candidate, -1);
		var down = downDate ? -smpl.date.diff(candidate, downDate) : Infinity;
		
		if (!upDate && !downDate) return null;
		
		var prefered = (up <= down) ? upDate : downDate;
		var chalenger = (up <= down) ? downDate : upDate;
		
		if (!limitToMonth || this.sameMonth(date, prefered)) return prefered;
		else if (chalenger && this.sameMonth(date, chalenger)) return chalenger;
		return null;
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.sameMonth = function(date1, date2) {
		return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.shiftMonth = function(direction) {
		var candidate = this.getCurrentDate();
		if (!candidate) return;
		candidate = smpl.date.shiftMonth(smpl.date.clone(candidate), direction);
		candidate = this.adjustDate(candidate, true);
		if (candidate) {
			this.setSelectedDate(candidate);
			this.adjustCurrentMonth();
			this.show();
		}
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.multiShift = function(date, diff) {
		var candidate = smpl.date.shift(smpl.date.clone(date), diff);
		
		var limitDate = diff > 0 ? this.maxDate : this.minDate;
		var maxShift = limitDate ? Math.floor(smpl.date.diff(candidate, limitDate) / diff) : Infinity;
		
		while (!this.isValid(candidate) && maxShift-- > 0) {
			smpl.date.shift(candidate, diff);
		}
		if (!this.isValid(candidate)) {
			candidate = null;
		}
		return candidate;
	};
	
	smpl.ui.Calendar.prototype.multiShiftCurrent = function(diff) {
		var candidate = this.getCurrentDate();
		candidate = this.multiShift(candidate, diff);
		this.setCurrentDate(candidate);
		this.adjustCurrentMonth();
		this.show();
	};
	
	/**
	 * Adjust `this.currentMonth` based on curentDate.
	 * @private
	 */
	smpl.ui.Calendar.prototype.adjustCurrentMonth = function() {
		if (!this.currentMonth) return;
		if (!this.currentDate) {
			delete this.currentMonth;
			return;
		}
		var selectedMonth = this.currentDate.getFullYear() * 12 + this.currentDate.getMonth();
		var minDisplayedMonth = this.currentMonth.getFullYear() * 12 + this.currentMonth.getMonth();
		var maxDisplayedMonth = minDisplayedMonth + this.config.numberOfMonths - 1;
		
		if (selectedMonth < minDisplayedMonth) {
			smpl.date.shiftMonth(this.currentMonth, selectedMonth - minDisplayedMonth);
		} else if (selectedMonth  > maxDisplayedMonth) {
			smpl.date.shiftMonth(this.currentMonth, selectedMonth - maxDisplayedMonth);
		}
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.findCurrentMonth = function() {
		var currentDate = this.getCurrentDate();
		// By default, currentMonth is the first day of the month of currentDate
		this.currentMonth = smpl.date.clone(currentDate);
		this.currentMonth.setDate(1);
		
		// when multiple month are displayed, the next months may be entirely after maxDate.
		// shift currentMonth in the past if possible to maximise the number of valid dates displayed.
		if (this.maxDate && this.config.numberOfMonths > 1) {
			var minDisplayedMonth = this.currentMonth.getFullYear() * 12 + this.currentMonth.getMonth();
			var maxDisplayedMonth = minDisplayedMonth + this.config.numberOfMonths - 1;
			
			var maxDateMonth = this.maxDate.getFullYear() * 12 + this.maxDate.getMonth();
			var minDateMonth = this.minDate ? this.minDate.getFullYear() * 12 + this.minDate.getMonth() : -Infinity;
			
			if (maxDisplayedMonth > maxDateMonth) {
				var shift = Math.min(maxDisplayedMonth - maxDateMonth, minDisplayedMonth - minDateMonth);
				smpl.date.shiftMonth(this.currentMonth, -shift);
			}
		}
	};
	
	/**
	 * @private
	 */
	smpl.ui.Calendar.prototype.getData = function() {
		if (!this.currentMonth) {
			this.findCurrentMonth();
		}
		var data = {
			months: [],
			hasPreviousMonth: this.hasPreviousMonth(),
			hasNextMonth: this.hasNextMonth()
		};
		var month = smpl.date.clone(this.currentMonth);
		for (var i = 0; i < this.config.numberOfMonths; i++) {
			data.months.push(this.getMonth(month));
			smpl.date.shiftMonth(month, 1);
		}
		return data;
	};
	
	smpl.ui.Calendar.prototype.show = function() {
		this.config.template.parse(this.getData(), this).load(this.config.container);
	};
	
	smpl.ui.Calendar.prototype.select = function(date) {
		date = this.getDate(date);
		if (this.isValid(date)) {
			this.setCurrentDate(date);
			this.adjustCurrentMonth();
			this.config.onSelect(this.getSelectedDate());
			return true;
		}
		return false;
	};
	
	smpl.ui.Calendar.prototype.jumpToLimit = function(limit) {
		var shift;
		if (limit === 'min') {
			limit = this.minDate;
			shift = 1;
		} else {
			limit = this.maxDate;
			shift = -1;
		}
		
		if (limit) {
			var candidate = smpl.date.clone(limit);
			if (!this.isValid(candidate)) {
				candidate = this.multiShift(shift);
			}
			this.setCurrentDate(candidate);
			this.adjustCurrentMonth();
			this.show();
		}
	};
	
	smpl.ui.Calendar.prototype.keyDown = function(e) {
		if (e.keyCode >= 33 && e.keyCode <= 40) {
			smpl.dom.stopEvent(e);
			switch (e.keyCode) {
				case 33: //PageUp
					this.shiftMonth(-1);
					break;
				case 34: //PageDown
					this.shiftMonth(+1);
					break;
				case 35: //End
					this.jumpToLimit('max');
					break;
				case 36: //Home
					this.jumpToLimit('min');
					break;
				case 37: //Left
					this.multiShiftCurrent(-1);
					break;
				case 38: //Up
					this.multiShiftCurrent(-7);
					break;
				case 39: //Right
					this.multiShiftCurrent(+1);
					break;
				case 40: //Down
					this.multiShiftCurrent(+7);
					break;
			}
		}
	};
	
	return smpl;
});
