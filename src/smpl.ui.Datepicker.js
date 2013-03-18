define(['./smpl.ui.Dropdown', './smpl.ui.Calendar', 'moment'], function(smpl) {
	'use strict';
	
	/**
	 * 
	 */
	smpl.ui.Datepicker = function(config) {
		this.config = config;
		
		var defaultConfig = {
			dateFormat: 'DD/MM/YYYY',
			showOnFocus: false,
			onSelect: this.dateSelect.bind(this), //Callback for the calendar component
			onChange: null
		};
		smpl.data.extendObject(this.config, defaultConfig);
		
		this.calendar = new smpl.ui.Calendar(this.config);
		this.dropDown = new smpl.ui.Dropdown({
			anchor: this.config.input,
			onKeyDown: this.calendar.keyDown.bind(this.calendar),
			onClose: this.onClose.bind(this)
		});
		this.onFocus = this.onFocus.bind(this);
		this.keydown = this.keydown.bind(this);
		
		if (this.config.showOnFocus) {
			this.config.input.addEventListener('focus', this.onFocus, true);
			
			// prevent the dropDown to be closed immediately after open
			this.config.input.addEventListener('click', smpl.dom.stopEventPropagation, true);
		}
		
		this.config.input.addEventListener('keydown', this.keydown, false);
	};
	
	smpl.ui.Datepicker.prototype.destroy = function() {
		if (this.config.showOnFocus) {
			this.config.input.removeEventListener('focus', this.onFocus, true);
			this.config.input.removeEventListener('click', smpl.dom.stopEventPropagation, true);
		}
		this.config.input.removeEventListener('keydown', this.keydown, false);
		
		this.calendar.destroy();
		this.dropDown.destroy();
	};
	
	smpl.ui.Datepicker.prototype.getDate = function() {
		var date = moment(this.config.input.value, this.config.dateFormat);
		return (date && date.isValid()) ? date.toDate() : null;
	};
	smpl.ui.Datepicker.prototype.dateSelect = function(date) {
		this.onClose();
	};
	
	smpl.ui.Datepicker.prototype.show = function(e) {
		this.calendar.setContainer(this.dropDown.getDom());
		this.calendar.setSelectedDate(this.getDate());
		this.calendar.show();
		this.dropDown.show();
		this.config.input.blur();
	};
	
	smpl.ui.Datepicker.prototype.toggle = function() {
		if (this.dropDown.visible) {
			this.dropDown.hide();
			this.onClose(true);
		} else {
			this.show();
		}
	};
	
	smpl.ui.Datepicker.prototype.onFocus = function(e) {
		if (!this.noFocus) {
			this.show();
		}
	};
	
	smpl.ui.Datepicker.prototype.keydown = function(e) {
		if (e.keyCode === 40) {
			smpl.dom.stopEvent(e);
			this.show();
		}
	};
	
	smpl.ui.Datepicker.prototype.onClose = function(cancel, fromMouse) {
		this.dropDown.hide();
		
		// Do not focus in the following cases:
		//  - user clicked outside the dropDown
		//  - user selected a date with his mouse
		if (!fromMouse && !(this.config.showOnFocus && cancel === undefined)) {
			this.noFocus = true;
			this.config.input.focus();
			this.noFocus = false;
		}
		if (!cancel) {
			this.selectDate(this.calendar.getSelectedDate());
		}
	};
	
	smpl.ui.Datepicker.prototype.selectDate = function(date) {
		this.config.input.value = moment(date).format(this.config.dateFormat);
	};
	return smpl;
});