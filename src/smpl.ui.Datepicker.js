define(['./smpl.ui.Dropdown', './smpl.ui.Calendar', 'moment'], function(smpl) {
	'use strict';
	
	smpl.ui.Datepicker = function(config) {
		this.config = config;
		
		var defaultConfig = {
			dateFormat: 'DD/MM/YYYY',
			showOnFocus: false,
			datepicker: this
		};
		smpl.data.extendObject(this.config, defaultConfig);
		
		this.calendar = new smpl.ui.Calendar(config);
		this.dropDown = new smpl.ui.Dropdown({
			anchor: this.config.input,
			onKeyDown: this.calendar.keyDown.bind(this.calendar),
			onClose: this.onClose.bind(this)
		});
		this.onFocus = this.onFocus.bind(this);
		this.keydown = this.keydown.bind(this);
		
		if (this.config.showOnFocus) {
			this.config.input.addEventListener('focus', this.onFocus, true);
			
			// prevent the dropDown to be closed imediatelly after open
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
	
	smpl.ui.Datepicker.prototype.show = function(e) {
		this.calendar.setContainer(this.dropDown.getDom());
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
	
	smpl.ui.Datepicker.prototype.onClose = function(cancel) {
		this.noFocus = true;
		this.config.input.focus();
		this.noFocus = false;
		if (!cancel) {
			this.config.input.value = moment(this.calendar.getCurrentDate()).format(this.config.dateFormat);
		}
	};
	
	return smpl;
});