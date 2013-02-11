define(['./datepicker.html', 'smpl/smpl.dom', 'moment'], function(tpl) {
	'use strict';
	
	tpl.onParse = function(data, datepicker) {
		this.datepicker = datepicker;
		this.data = data;
		data.months.forEach(function(month, i) {
			this.set('month', 'monthName', moment(month[1][0].date).format('MMMM YYYY'));
			if (i === 0) {
				this.set('month', 'pmClass', data.hasPreviousMonth ? 'previousMonth' : 'noPreviousMonth');
				this.set('month', 'pmDate', data.hasPreviousMonth ? 'previousMonth' : '');
			}
			if (i === data.months.length - 1) {
				this.set('month', 'nmClass', data.hasNextMonth ? 'nextMonth' : 'noNextMonth');
				this.set('month', 'nmDate', data.hasNextMonth ? 'nextMonth' : '');
			}
			
			month[0].forEach(function(wd) {
				this.set('wd', 'wd', moment(wd.date).format('dd'));
				this.parseBlock('wd');
			}, this);
			month.forEach(function(week, j) {
				week.forEach(function(day, k) {
					this.set('day', 'day', day.dom);
					this.set('day', 'classes', this.getClasses(day));
					if (day.valid) {
						this.set('day', 'date', [i,j,k].toString());
					}
					this.parseBlock('day');
				}, this);
				this.parseBlock('week');
			}, this);
			this.parseBlock('month');
		}, this);
	};
	
	tpl.getClasses = function(day) {
		var classes = ['day'];
		if (day.isToday) {
			classes.push('today');
		}
		if (day.selected) {
			classes.push('selected');
		}
		classes.push(day.valid ? 'valid' : 'invalid');
		if (!day.inMonth) {
			classes.push('otherMonth');
		}
		return classes.join(' ');
	};
	
	tpl.nextMonth = function() {
		this.datepicker.nextMonth();
	};
	
	tpl.previousMonth = function() {
		this.datepicker.previousMonth();
	};
	
	tpl.selectDate = function(e) {
		smpl.dom.stopEvent(e);
		var date = e.target.getAttribute('data-date');
		if (date) {
			if (date === 'previousMonth') tpl.previousMonth();
			else if (date === 'nextMonth') tpl.nextMonth();
			else {
				date = date.split(',');
				this.datepicker.select(this.months[+date[0]][+date[1]][+date[2]].date);
			}
		}
	};
	return tpl;
});
