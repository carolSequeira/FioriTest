jQuery.sap.require("sap.ui.demo.myFiori.util.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.m.MessageToast");

sap.ui.controller("sap.ui.demo.myFiori.view.Detail", {

	handleNavButtonPress : function (evt) {
		this.nav.back("Master");
	},

	onBeforeRendering:function(){
		this.byId("SupplierForm").bindElement("BusinessPartner");
	},
	
	handleApprove : function (evt) {

		// show confirmation dialog
		var bundle = this.getView().getModel("i18n").getResourceBundle();
		sap.m.MessageBox.confirm(
			bundle.getText("ApproveDialogMsg"),
			function (oAction) {
				if (sap.m.MessageBox.Action.OK === oAction) {
					// notify user
					var successMsg = bundle.getText("ApproveDialogSuccessMsg");
					sap.m.MessageToast.show(successMsg);
					// TODO call proper service method and update model (not part of this session)
				}
			},
			
			bundle.getText("ApproveDialogTitle")
		);
	},
	
	handleLineItemPress : function (evt) {
		var context = evt.getSource().getBindingContext();
		this.nav.to("LineItem", context);
	},
	
	
	handleApprove : function (evt) {
		this._showApproveRejectDialog("approve");
	},

	handleReject : function (evt) {
		this._showApproveRejectDialog("reject");
	},

	
	_showApproveRejectDialog : function (mode, forwardRecipientName) {

		// to be on the safe side
		var selectedDetail = this.getView().getBindingContext().getObject();
		if (!selectedDetail) {
			return;
		}

		// get texts
		var bundle = this.getView().getModel("i18n").getResourceBundle();
		var dialogTitle = bundle.getText(mode + "DialogTitle");
		var confirmButtonText = bundle.getText(mode + "DialogConfirmAction");
		var busyTitle = bundle.getText(mode + "DialogBusyTitle");
		var successMsg = bundle.getText(mode + "DialogSuccessMsg");
		var confirmMsg = bundle.getText(mode + "DialogConfirmMsg");
		confirmMsg = confirmMsg.replace("{0}", selectedDetail.CreatedByName);
		confirmMsg = confirmMsg.replace("{1}", forwardRecipientName);

		// create dialog
		var that = this;
		var dialog = new sap.m.Dialog({
			title : dialogTitle,
			content : [
				new sap.m.Text({
					text : confirmMsg
				}).addStyleClass("sapUiSmallMarginBottom"),
				new sap.m.TextArea({
					rows : 4,
					width : "100%",
					placeholder : bundle.getText("dialogNotePlaceholder")
				})
			],
			contentWidth : "30rem",
			leftButton : new sap.m.Button({
				text : confirmButtonText,
				press : function () {
					dialog.close();
				}
			}),
			rightButton : new sap.m.Button({
				text : bundle.getText("dialogCancelAction"),
				press : function () {
					dialog.close();
				}
			}),
			afterClose : function (evt) {
				// open busy dialog if confirmed
				var pressedButton = evt.getParameter("origin");
				if (pressedButton === this.getBeginButton()) {
					// open busy dialog
					var busyDialog = new sap.m.BusyDialog({
						showCancelButton : false,
						title : busyTitle,
						close : function () {
							// remove detail from model
							var oModel = that.getView().getModel();
							var oData = oModel.getData();
							var oldCollection = oData.PurchaseOrderCollection;
							var newCollection = jQuery.grep(oldCollection, function (detail) {
								return detail.ID !== selectedDetail.ID;
							});
							oData.PurchaseOrderCollection = newCollection;
							oModel.setData(oData);
							// tell list to update selection
							sap.ui.getCore().getEventBus().publish("app", "SelectDetail");
							// the app controller will close all message toast on a "nav back" event
							// this is why we can show this toast only after a delay
							setTimeout(function () {
								sap.m.MessageToast.show(successMsg);
							}, 200);
						}
					});
					busyDialog.open();
					// close busy dialog after some delay
					setTimeout(jQuery.proxy(function () {
						busyDialog.close();
						busyDialog.destroy();
					}, this), 2000);
				}
				// clean up
				dialog.destroy();
			}
		});

		// open dialog
		dialog.open();
	},
	

	handleForward : function (evt) {
		// lazy creation of recipient dialog
		if (!this._recipientDialog) {
			this._createRecipientDialog();
		}

		// open dialog
		this._recipientDialog.setModel(this.getView().getModel("employee"), "employee");
		this._recipientDialog.open();
	},

	_createRecipientDialog : function (evt) {
		// create the dialog as an internal member
		this._recipientDialog = sap.ui.xmlfragment("sap.ui.demo.myFiori.view.RecipientHelpDialog", this);
		this._recipientDialog.setModel(sap.ui.getCore().getModel("i18n"), "i18n"); // TODO: remove once ResourceModel issue is fixed
		
	},

	closeRecipientDialog : function (evt) {
		// display the reject dialog if an item was selected 
		var selectedItem = evt.getParameter("selectedItem");
		if (selectedItem) {
			this._showApproveRejectDialog("forward", selectedItem.getTitle());
		}
	},

	searchRecipientDialog : function (evt) {
		// Now filter the list based on the value in the search field 
		var filter = [];
		var sVal = evt.getParameter("value");
		if(sVal !== undefined) {
			//Get the binded items for the list
			var itemsBinding = evt.getParameter("itemsBinding");
			//create the local filter to apply
			var selectFilter = new sap.ui.model.Filter("LastName", sap.ui.model.FilterOperator.Contains , sVal);
			filter.push(selectFilter);
			// and apply the filter to the bound items, and the Select Dialog will update
			itemsBinding.filter(filter);
		}
	},
});