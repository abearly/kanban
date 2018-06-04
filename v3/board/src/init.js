/**
 * @link http://www.webreference.com/programming/javascript/object-oriented_javascript3/2.html
 */

// Hacky but probably best way to shim these modules
// Note: jQuery is injected as a global by Webpack (see webpack.config.js)
// We should add minify to Webpack to reduce the size of our bundle.
require('../../js/t.min.js')
require('bootstrap')
require('bootstrap-datepicker')

require('./functions.js')
var App = require('./App')
var Board = require('./Board')
var Lane = require('./Lane')
var Card = require('./Card')
var Fieldvalue = require('./Fieldvalue')
var Field = require('./Field')
var fieldTypes = require('./Field/index')
var Comment = require('./Comment')
var timeago = require('timeago.js')

"use strict";

var templates = document.getElementsByClassName('template');

for (var i = 0; i < templates.length; i++) {
	var el = templates[i];
	var id = el.getAttribute('data-id');
	kanban.templates[id] = new t(el.innerHTML);
}

kanban.app = new App(kanban.new_data.app);

kanban.app.processNewData(kanban.new_data);

kanban.app.render();

kanban.app.updatesInit();

$(function () {

	$.ajaxSetup({
		url: kanban.ajax.url(),
		type: "POST"
	});

	$( document ).ajaxStart(function () {

		// Reset spinner timer.
		clearTimeout(kanban.app.timers()['ajax-loading']);
		$('#app-ajax-loading').show();
	});

	$( document ).ajaxComplete( function ( event, XMLHttpRequest, ajaxOptions ) {

		// Show spinner for at least 2 seconds.
		kanban.app.timers()['ajax-loading'] = setTimeout(function () {
			$('#app-ajax-loading').hide();
		}, 1000);

		// make sure all ajax requests growl
		try {
			var response = $.parseJSON( XMLHttpRequest.responseText );
			growl_response_message( response );
		}
		catch ( err ) {
			// @todo Load notice based on type and action.
			// notify( kanban.notices.task_save_error );
		}
	} );

	// Append nonce to every ajax request.
	$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
		options.data += '&kanban_nonce=' + kanban.ajax.nonce();
	});

	setInterval(function() {
		var $timeago = $('.timeago');

		if ( $timeago.length > 0  ) {
			// Get now in mysql format.
			var nowUTC = Date.prototype.dateJsToMysql(new Date());

			// Set timeago to now utc, since all dates in db are utc.
			var timeagoInstance = timeago(nowUTC);

			$timeago.each(function () {

				var $this = $(this);

				var dt = $this.attr('data-datetime');

				// Format created.
				$this.text( timeagoInstance.format(dt) );
			});
		}

		//update datetimeago elements
		var $datetimeago = $('.datetimeago');
		$datetimeago.each(function () {

			var $this = $(this);

			var dt = new Date($this.attr('data-datetime'));

			// Format created.
			$this.text(dt.getDateTimeago());
		});


	}, 1000*60); // Every minute.

	window.addEventListener('online',  kanban.app.hideOfflineNotice);
	window.addEventListener('offline', kanban.app.showOfflineNotice);

	$( "body" ).on(
		'keydown',
		function ( e ) {
			var $any_input = $( 'input:focus, textarea:focus, [contenteditable]:focus' );
			// console.log(e.keyCode);
			if ( $any_input.length > 0 || !e.shiftKey ) {
				return true;
			}

			// shift + a: toggle all cols
			if ( e.keyCode === 65 ) {
				kanban.app.viewToggleAllLanes();
				return false;
			}

			// shift + u: toggle full screen
			if ( e.keyCode === 85 ) {
				kanban.app.viewToggleFullScreen();
				return false;
			}

			// shift + b: show current board options
			if ( e.keyCode === 66 ) {

				if ( $('#board-modal').length == 1 ) {
					kanban.app.modal.close();
				} else {
					kanban.app.currentBoardModalShow();
				}
				return false;
			}

			// shift + , (comma): show app options
			if ( e.keyCode === 188 ) {

				if ( $('#app-modal').length == 1 ) {
					kanban.app.modal.close();
				} else {
					kanban.app.modal.show();
				}
				return false;
			}

			/*

						// shift + <-: left
						if ( e.keyCode === 37 && $any_input.length === 0 ) {
							if ( e.shiftKey ) {
								if ( $( '.col-tasks-sidebar-right', board.$el ).hasClass( 'opened' ) ) {
									$( '.col-tasks-sidebar-right', board.$el ).trigger( 'click' );
								}
								else if ( !$( '.col-tasks-sidebar-left', board.$el ).hasClass( 'opened' ) ) {
									$( '.col-tasks-sidebar-left', board.$el ).trigger( 'click' );
								}
							}
						}

						// shift + ->: right
						if ( e.keyCode === 39 && $any_input.length === 0 ) {
							if ( e.shiftKey ) {
								if ( $( '.col-tasks-sidebar-left', board.$el ).hasClass( 'opened' ) ) {
									$( '.col-tasks-sidebar-left', board.$el ).trigger( 'click' );
								}
								else if ( !$( '.col-tasks-sidebar-right', board.$el ).hasClass( 'opened' ) ) {
									$( '.col-tasks-sidebar-right', board.$el ).trigger( 'click' );
								}
							}
						}



						// shift + c: toggle compact view
						if ( e.keyCode === 67 && $any_input.length === 0 ) {
							if ( e.shiftKey ) {
								$( '#btn-view-compact' ).trigger( 'click' );
								return false;
							}
						}







						// shift + u: toggle full screen
						if ( e.keyCode === 85 && $any_input.length === 0 ) {
							if ( e.shiftKey ) {
								$( '#btn-view-fullscreen' ).trigger( 'click' );
								return false;
							}
						}



						// shift + s: jump to search
						if ( e.keyCode === 83 && $any_input.length === 0 ) {
							if ( e.shiftKey ) {
								$( '#board-search' ).focus();
								return false;
							}
						}



						// shift + f: open filter modal
						if ( e.keyCode === 70 && $any_input.length === 0 ) {
							if ( e.shiftKey ) {
								$( '.modal-filter', board.$el ).modal( 'toggle' );
								return false;
							}
						}



						// shift + p: open projects modal
						if ( e.keyCode === 80 && $any_input.length === 0 ) {
							if ( e.shiftKey ) {
								$( '#modal-projects' ).modal( 'toggle' );
								return false;
							}
						}

*/

						// shift + k: open kaybord shortcuts modal
						if ( e.keyCode === 75 && $any_input.length === 0 ) {
							if ( e.shiftKey ) {
								kanban.app.toggleKeyboardShortcutsModal();
								return false;
							}
						}


		}
	); // body keydown






	// Run last
	function loadFromUrl () {
		if ('undefined' !== typeof kanban.app.url().params['modal'] && kanban.app.url().params['modal'] == 'app') {
			kanban.app.modal.show();
			return;
		}


		// @todo clean up, put somewhere, make extensible

		if ('undefined' !== typeof kanban.app.url().params['modal']) {
			var objType = kanban.app.url().params['modal'];

			if ('undefined' !== typeof kanban.app.url().params[objType]) {

				var id = kanban.app.url().params[objType];

				if ('undefined' !== typeof kanban[objType + 's'][id]) {
					kanban[objType + 's'][id].modal.show();
				}
			}
		}

		//apply the search if search param exists in url
		var urlSearchParam = kanban.app.urlParamGet('search');
		if (urlSearchParam) {
			$('#footer input[type=search]').val(urlSearchParam);
			kanban.app.searchCurrentBoard($('#footer input[type=search]'));
		}

	}

	loadFromUrl();
});

