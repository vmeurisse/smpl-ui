define(['./smpl.ui.core', 'smpl/smpl.dom'], function(smpl) {
	'use strict';
	
	smpl.ui.Dropdown = function(config) {
		this.config = config || {};
		this.reposition = this.setPosition.bind(this);
		this.keydown = this.keydown.bind(this);
		this.click = this.click.bind(this);
	};
	
	smpl.ui.Dropdown.prototype.destroy = function() {
		this.hide();
		if (this.dom) {
			document.body.removeChild(this.dom);
		}
	};
	
	smpl.ui.Dropdown.prototype.getDom = function() {
		if (!this.dom) {
			this.dom = document.createElement('div');
			this.dom.className = 'smpl-ui-Dropdown';
			this.dom.style.cssText = 'display:none;position:absolute';
			document.body.appendChild(this.dom);
		}
		return this.dom;
	};
	
	smpl.ui.Dropdown.prototype.show = function(anchor) {
		this.setPosition();
		
		if (!this.visible) {
			window.addEventListener('scroll', this.reposition, true);
			window.addEventListener('resize', this.reposition, true);
			document.addEventListener('keydown', this.keydown, false);
			document.addEventListener('click', this.click, false);
			this.dom.addEventListener('click', smpl.dom.stopEvent, false);
			this.visible = true;
		}
	};
	
	smpl.ui.Dropdown.prototype.setPosition = function(anchor) {
		var anchor = this.config.anchor.getBoundingClientRect();
		
		var space = 1; //space between the input and the dropDown
		
		var dom = this.getDom();
		
		var size = {
			width: this.config.width,
			height: this.config.height
		};
		if (!size.width || !size.height) {
			if (!this.visible) {
				dom.style.left = dom.style.top = '-9999px';
				dom.style.visibility = 'hidden';
				dom.style.display = 'block';
				this.visible = 'hidden';
			}
			var rect = dom.getBoundingClientRect();
			size.width = size.width || rect.right - rect.left;
			size.height = size.height || rect.bottom - rect.top;
		}
		
		var scroll = {
			left: document.documentElement.scrollLeft || document.body.scrollLeft,
			top: document.documentElement.scrollTop || document.body.scrollTop
		};
		
		var viewport = {
			width: document.documentElement.clientWidth,
			height: document.documentElement.clientHeight
		};
		
		var position = {
			left: anchor.left + scroll.left,
			top: anchor.bottom + scroll.top + space
		};
		if (position.left + size.width > scroll.left + viewport.width) {
			position.left = scroll.left + viewport.width - size.width;
		}
		if (position.left < scroll.left) {
			position.left = scroll.left;
		}
		
		if (position.top + size.height > scroll.top + viewport.height &&
		    anchor.top - size.height - space > 0) {
			position.top = anchor.top - size.height - space + scroll.top;
		} else if (position.top < scroll.top) {
			position.top = scroll.top;
		}
		
		dom.style.top = position.top + 'px';
		dom.style.left = position.left + 'px';
		if (this.visible === 'hidden') {
			dom.style.visibility = '';
			this.visible = false;
		} else if (!this.visible) {
			dom.style.display = 'block';
		}
	};
	
	smpl.ui.Dropdown.prototype.hide = function() {
		if (this.visible && this.dom) {
			this.dom.style.display = 'none';
			window.removeEventListener('scroll', this.reposition, true);
			window.removeEventListener('resize', this.reposition, true);
			document.removeEventListener('keydown', this.keydown, false);
			document.removeEventListener('click', this.click, false);
			this.dom.removeEventListener('click', smpl.dom.stopEvent, false);
		}
		this.visible = false;
	};
	
	smpl.ui.Dropdown.prototype.keydown = function(e) {
		if (e.keyCode === 9 || e.keyCode === 13 || e.keyCode === 27) { // Tab || Enter || Esc
			this.hide();
			if (e.keyCode === 27) {
				e.preventDefault();
				e.stopPropagation();
			}
			if (this.config.onClose) this.config.onClose(e.keyCode === 27, false);
		} else {
			if (this.config.onKeyDown) this.config.onKeyDown(e);
		}
	};
	
	
	smpl.ui.Dropdown.prototype.click = function(e) {
		this.hide();
		if (this.config.onClose) this.config.onClose(true, true);
	};
	
	return smpl;
});