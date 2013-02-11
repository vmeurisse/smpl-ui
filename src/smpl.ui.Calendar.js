define(['./smpl.ui.core', 'smpl/smpl.number', 'smpl/smpl.data', 'smpl/smpl.dom', 'moment'], function(smpl) {
	'use strict';
	
	/**
	 * @param {Integer} config.firstDayOfWeek First day of week to be displayed. 0: sunday, 1: monday... (default: 1)
	 * @param {Integer} config.numberOfMonths Number of months to be displayed (default: 1)
	 * @param {String} config.dateFormat
	 * @param {String} config.selectedDate
	 * @param {String} config.template
	 */
	smpl.ui.Calendar = function(config) {
		this.config = config;
		
		var defaultConfig = {
			firstDayOfWeek: 1,
			numberOfMonths: 1,
			dateFormat: 'DD/MM/YYYY'
		};
		smpl.data.extendObject(this.config, defaultConfig);
		this.config.template = this.config.template.getInstance();
		
		this.minDate = this.config.minDate ? this.getDate(this.config.minDate) : null;
		this.maxDate = this.config.maxDate ? this.getDate(this.config.maxDate) : null;
		this.today = this.getDate(new Date());
		this.currentDate = this.config.selectedDate ? this.getDate(this.config.selectedDate) : this.today.clone();
		this.currentMonth;
	};
	
	smpl.ui.Calendar.prototype.setContainer = function(container) {
		this.config.container = container;
	};
	
	smpl.ui.Calendar.prototype.getDate = function(date) {
		if (typeof date !== 'string') {
			date = moment(date).format('YYYY-MM-DD');
		}
		return moment(date + ' 12:00', 'YYYY-MM-DD HH:mm');
	};
	
	smpl.ui.Calendar.prototype.getCurrentDate = function() {
		return this.currentDate.clone().toDate();
	};
	smpl.ui.Calendar.prototype.getMonth = function(date) {
		date = date.clone();
		
		var month = date.month();
		var dow = date.day();
		var fdow = this.config.firstDayOfWeek;
		date.subtract('days', (dow - fdow + 7) % 7);
		if (dow === fdow && date.daysInMonth() === 28) {
			// Special case for February. Avoid 2 empty weeks at the end of the month
			date.subtract('days', 7);
		}
		var data = [];
		
		for (var i = 0; i < 6; i++) { 
			var week = [];
			data.push(week);
			for (var j = fdow; j < fdow + 7; j++) {
				week.push({
					dow: date.day(),
					dom: date.date(),
					date: date.clone().toDate(),
					inMonth: date.month() === month,
					valid: this.isValid(date),
					isToday: date.diff(this.today, 'days') === 0,
					selected: date.diff(this.currentDate, 'days') === 0
				});
				date.add('days', 1);
			}
		}
		return data;
	};
	
	smpl.ui.Calendar.prototype.isValid = function(date) {
		if (this.minDate && date.diff(this.minDate, 'days') < 0) return false;
		else if (this.maxDate && date.diff(this.maxDate, 'days') > 0) return false;
		else if (this.config.isValid && !this.config.isValid(date.clone().toDate())) return false;
		return true;
	};
	
	smpl.ui.Calendar.prototype.hasPreviousMonth = function() {
		if (!this.minDate) return true;
		return this.currentMonth.diff(this.minDate, 'days') > 0;
	};
	
	smpl.ui.Calendar.prototype.hasNextMonth = function() {
		if (!this.maxDate) return true;
		return this.currentMonth.clone().add('months', this.config.numberOfMonths).diff(this.maxDate, 'days') <= 0;
	};
	
	smpl.ui.Calendar.prototype.nextMonth = function() {
		if (!this.hasNextMonth()) return false;
		this.currentMonth.add('months', 1);
		this.show();
		return true;
	};
	
	smpl.ui.Calendar.prototype.previousMonth = function() {
		if (!this.hasPreviousMonth()) return false;
		this.currentMonth.subtract('months', 1);
		this.show();
		return true;
	};
	
	smpl.ui.Calendar.prototype.multiShift = function(diff) {
		var shift = 0;
		var candidate = this.currentDate.clone().add('days', diff);
		
		var limitDate = diff > 0 ? this.maxDate : this.minDate;
		var maxShift = limitDate ? Math.floor(limitDate.diff(candidate, 'days') / diff) : Infinity;
		
		while (!this.isValid(candidate) && maxShift-- > 0) {
			candidate.add('days', diff);
		}
		if (this.isValid(candidate)) {
			shift = candidate.diff(this.currentDate, 'days') / diff;
			this.currentDate = candidate;
			this.adjustCurrentMonth();
			this.show();
		}
		return shift;
	};
	
	/**
	 * Adjusth `this.currentMonth` based on curentDate.
	 */
	smpl.ui.Calendar.prototype.adjustCurrentMonth = function() {
		if (!this.currentMonth) return;
		var selectedMonth = this.currentDate.year() * 12 + this.currentDate.month();
		var minDisplayedMonth = this.currentMonth.year() * 12 + this.currentMonth.month();
		var maxDisplayedMonth = minDisplayedMonth + this.config.numberOfMonths - 1;
		
		if (selectedMonth < minDisplayedMonth) {
			this.currentMonth.subtract('months', minDisplayedMonth - selectedMonth);
		} else if (selectedMonth  > maxDisplayedMonth) {
			this.currentMonth.add('months', selectedMonth - maxDisplayedMonth);
		}
	};
	
	smpl.ui.Calendar.prototype.findCurrentMonth = function() {
		// By default, currentMonth is the first day of the month of currentDate
		this.currentMonth = this.currentDate.clone().startOf('month').add('hours', 12);
		
		// when multiple month are displayed, the nexts months may be entierly after maxDate.
		// shift currentMonth in the past if possible to maximise the number of valid dates displayed.
		if (this.maxDate && this.config.numberOfMonths > 1) {
			var minDisplayedMonth = this.currentMonth.year() * 12 + this.currentMonth.month();
			var maxDisplayedMonth = minDisplayedMonth + this.config.numberOfMonths - 1;
			
			var maxDateMonth = this.maxDate.year() * 12 + this.maxDate.month();
			var minDateMonth = this.minDate ? this.minDate.year() * 12 + this.minDate.month() : -Infinity;
			
			if (maxDisplayedMonth > maxDateMonth) {
				var shift = Math.min(maxDisplayedMonth - maxDateMonth, minDisplayedMonth - minDateMonth);
				this.currentMonth.subtract('months', shift);
			}
		}
	};
	
	smpl.ui.Calendar.prototype.getData = function() {
		if (!this.currentMonth) {
			this.findCurrentMonth();
		}
		var data = {
			months: [],
			hasPreviousMonth: this.hasPreviousMonth(),
			hasNextMonth: this.hasNextMonth()
		};
		var month = this.currentMonth.clone();
		for (var i = 0; i < this.config.numberOfMonths; i++) {
			data.months.push(this.getMonth(month));
			month.add('months', 1);
		}
		return data;
	};
	
	smpl.ui.Calendar.prototype.show = function() {
		this.config.template.parse(this.getData(), this).load(this.config.container);
	};
	
	smpl.ui.Calendar.prototype.keyDown = function(e) {
		if (e.keyCode >= 33 && e.keyCode <= 40) {
			smpl.dom.stopEvent(e);
			switch (e.keyCode) {
				case 33: //PageUp
					this.previousMonth();
					break;
				case 34: //PageDown
					this.nextMonth();
					break;
				case 35: //End
					break;
				case 36: //Home
					break;
				case 37: //Left
					this.multiShift(-1);
					break;
				case 38: //Up
					this.multiShift(-7);
					break;
				case 39: //Right
					this.multiShift(+1);
					break;
				case 40: //Down
					this.multiShift(+7);
					break;
			}
		}
	};
	
	return smpl;
});