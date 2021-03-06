if ("undefined" == typeof(wdw_birthdayList)) {
	Components.utils.import("resource:///modules/mailServices.js");
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var wdw_birthdayList = {
		
		sortTrees: function (aEvent) {
			wdw_birthdayList.buttonShowing();
			if (aEvent.button != 0) {
				return;
			}
		},

		birthdayListTreeContextShowing: function () {
			if (cardbookUtils.displayColumnsPicker()) {
				wdw_birthdayList.birthdayListTreeContextShowingNext();
				return true;
			} else {
				return false;
			}
		},

		birthdayListTreeContextShowingNext: function () {
			var menuSend = document.getElementById("sendEmail");
			var myTree = document.getElementById("birthdayListTree");
			if (myTree.view.selection.getRangeCount() > 0) {
				menuSend.disabled = false;
			} else {
				menuSend.disabled = true;
			}
		},

		enableSyncList: function(addon) {
			if (addon && addon.isActive) {
				document.getElementById('syncLightningMenuItemLabel').disabled = false;
			} else {
				document.getElementById('syncLightningMenuItemLabel').disabled = true;
			}
		},

		setupWindow: function () {
			AddonManager.getAddonByID(cardbookRepository.LIGHTNING_ID, this.enableSyncList);
		},
	
		loadCssRules: function () {
			for (var prop in document.styleSheets) {
				var styleSheet = document.styleSheets[prop];
				if (styleSheet.href == "chrome://cardbook/skin/cardbookBirthday.css") {
					if (!(cardbookRepository.cardbookDynamicCssRules[styleSheet.href])) {
						cardbookRepository.cardbookDynamicCssRules[styleSheet.href] = [];
					}
					cardbookRepository.deleteCssAllRules(styleSheet);
					var createSearchRules = 0;
					for (var i in cardbookBirthdaysUtils.lBirthdayAccountList) {
						createSearchRules++;
					}
					for (var i in cardbookBirthdaysUtils.lBirthdayAccountList) {
						var dirPrefId = i;
						var color = cardbookPreferences.getColor(dirPrefId)
						if (createSearchRules > 1) {
							cardbookRepository.createCssCardRules(styleSheet, dirPrefId, color);
						}
					}
					cardbookRepository.reloadCss(styleSheet.href);
				}
			}
		},

		displayAllBirthdays: function () {
			wdw_birthdayList.setupWindow();
			
			var strBundle = document.getElementById("cardbook-strings");
			var maxDaysUntilNextBirthday = cardbookPreferences.getStringPref("extensions.cardbook.numberOfDaysForSearching");
			cardbookBirthdaysUtils.loadBirthdays(maxDaysUntilNextBirthday);
			cardbookBirthdaysUtils.lBirthdayList = cardbookUtils.sortArrayByNumber(cardbookBirthdaysUtils.lBirthdayList,0,1);
			wdw_birthdayList.loadCssRules();

			// if there are no birthdays in the configured timespan
			if (cardbookBirthdaysUtils.lBirthdayList.length == 0) {
				var today = new Date();
				today = new Date(today.getTime() + maxDaysUntilNextBirthday *24*60*60*1000);
				var noBirthdaysFoundMessage = strBundle.getFormattedString("noBirthdaysFoundMessage", [cardbookDates.convertDateToDateString(today, 'YYYYMMDD')]);
				var treeView = {
					rowCount : 1,
					getCellText : function(row,column){
						if (column.id == "daysleft") return noBirthdaysFoundMessage;
					}
				}
			} else {
				var treeView = {
					rowCount: cardbookBirthdaysUtils.lBirthdayList.length,
					isContainer: function(row) { return false },
					cycleHeader: function(row) { return false },
					getRowProperties: function(row) {
						return "SEARCH color_" + cardbookBirthdaysUtils.lBirthdayList[row][6];
					},
					getCellProperties: function(row, column) {
						return this.getRowProperties(row);
					},
					getCellText: function(row, column){
						if (column.id == "daysleft") return cardbookBirthdaysUtils.lBirthdayList[row][0];
						else if (column.id == "name") return cardbookBirthdaysUtils.lBirthdayList[row][1];
						else if (column.id == "age") return cardbookBirthdaysUtils.lBirthdayList[row][2];
						else if (column.id == "dateofbirth") return cardbookDates.getFormattedDateForDateString(cardbookBirthdaysUtils.lBirthdayList[row][3], cardbookBirthdaysUtils.lBirthdayList[row][7], cardbookRepository.dateDisplayedFormat);
						else if (column.id == "dateofbirthfound") return cardbookBirthdaysUtils.lBirthdayList[row][4];
						else if (column.id == "email") return cardbookBirthdaysUtils.lBirthdayList[row][5];
						else return cardbookBirthdaysUtils.lBirthdayList[row][5];
					}
				}
			}
			document.getElementById('birthdayListTree').view = treeView;
			document.title=strBundle.getFormattedString("birthdaysListWindowLabel", [cardbookBirthdaysUtils.lBirthdayList.length.toString()]);
			wdw_birthdayList.buttonShowing();
		},
	
		configure: function () {
			var myArgs = {showTab: "birthdaylistTab"};
			var MyWindows = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfiguration.xul", "", cardbookRepository.windowParams, myArgs);
			wdw_birthdayList.displayAllBirthdays();
		},
	
		displaySyncList: function() {
			var MyWindows = window.openDialog("chrome://cardbook/content/birthdays/wdw_birthdaySync.xul", "", cardbookRepository.modalWindowParams);
		},

		buttonShowing: function () {
			var btnSend = document.getElementById("sendEmailLabel");
			var myTree = document.getElementById("birthdayListTree");
			if (myTree.view.selection.getRangeCount() > 0) {
				btnSend.disabled = false;
			} else {
				btnSend.disabled = true;
			}
		},

		sendEmail: function () {
			var strBundle = document.getElementById("cardbook-strings");
			var myTree = document.getElementById('birthdayListTree');
			var numRanges = myTree.view.selection.getRangeCount();
			var start = new Object();
			var end = new Object();

			for (var i = 0; i < numRanges; i++) {
				myTree.view.selection.getRangeAt(i,start,end);
				for (var k = start.value; k <= end.value; k++){
					var myEmail = myTree.view.getCellText(k, myTree.columns.getNamedColumn('email'));
					var myName = myTree.view.getCellText(k, myTree.columns.getNamedColumn('name'));
					if (myEmail == "") {
						var errorTitle = strBundle.getString("warningTitle");
						var errorMsg = strBundle.getFormattedString("noEmailFoundMessage", new Array(myName));
						Services.prompt.alert(null, errorTitle, errorMsg);
					} else {
						var msgComposeType = Components.interfaces.nsIMsgCompType;
						var msgComposFormat = Components.interfaces.nsIMsgCompFormat;
						var msgComposeService = MailServices.compose;
						var params = Components.classes["@mozilla.org/messengercompose/composeparams;1"].createInstance(Components.interfaces.nsIMsgComposeParams);
						
						msgComposeService = msgComposeService.QueryInterface(Components.interfaces.nsIMsgComposeService);
						if (params) {
							params.type = msgComposeType.New;
							params.format = msgComposFormat.Default;
							var composeFields = Components.classes["@mozilla.org/messengercompose/composefields;1"].createInstance(Components.interfaces.nsIMsgCompFields);
							if (composeFields) {
								composeFields.to = myEmail;
								params.composeFields = composeFields;
								msgComposeService.OpenComposeWindowWithParams(null, params);
							}
						}
					}
				}
			}
		},
	
		do_close: function () {
			close();
		}
	};
};
