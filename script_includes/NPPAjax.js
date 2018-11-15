var NPPAjax = Class.create();
NPPAjax.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {

    calcPaymentAge: function(retObj) {
		retObj.log = {};
		
        gs.info("calcPaymentAge:"+ JSON.stringify(retObj, null, 4));
        var caseRec = new GlideRecord("x_baoq_npp_nppcase");
        if (caseRec.get(retObj.id)) {
            retObj.syscr = "" + caseRec.sys_created_on;
			retObj.log.openedDate = "" + caseRec.sys_created_on;
        }

		var openedDate = new GlideDateTime(caseRec.sys_created_on);
		retObj.openedDate = openedDate.getNumericValue() / (1000 * 24 * 3600);

		var originalDate = new GlideDateTime("2011-01-01 12:00:00");
		originalDate.setValueUTC(retObj.original_creation_date, retObj.date_format);
		retObj.log.originalDate = originalDate.getValue();
		
        retObj.paymentDays = originalDate.getNumericValue() / (1000 * 24 * 3600);

		var sevenMonthDate = new GlideDateTime("2011-01-01 12:00:00");
		sevenMonthDate.setValueUTC(retObj.original_creation_date, retObj.date_format);
		sevenMonthDate.addMonthsUTC(7);
		retObj.log.test7Mon = sevenMonthDate.getValue();
        retObj.paymentAge7Month = sevenMonthDate.getNumericValue() / (1000 * 24 * 3600);

        var sevenDaysDate = new GlideDateTime("2011-01-01 12:00:00");
		sevenDaysDate.setValueUTC(retObj.original_creation_date, retObj.date_format);
        sevenDaysDate.addDaysUTC(7);
        retObj.paymentAge7Days = sevenDaysDate.getNumericValue() / (1000 * 24 * 3600);
		retObj.log.test7Days = sevenDaysDate.getValue();
	
		retObj.delta = retObj.openedDate - retObj.paymentDays;

        if ((retObj.openedDate - retObj.paymentDays) < 7) {
            gs.info("< 7 days");
            retObj.payment_age = "Under 10 days";
            retObj.cancellation_additional_info = "MPREPTPDPER1";

        } else if ((retObj.openedDate - retObj.paymentDays) > (retObj.paymentAge7Month - retObj.paymentDays)) {
            retObj.payment_age = "Over 7 months";
            retObj.cancellation_additional_info = "MPREPTPDPER3";

        } else {
            retObj.payment_age = "Under 7 months";
            retObj.cancellation_additional_info = "MPREPTPDPER2";
        }
        retObj.valid = true;
        gs.info("calcPaymentAge" + JSON.stringify(retObj, null, 4));
        return retObj;
    },

    closeCase: function() {
        var retObj = {
            valid: false
        };
        //retObj.original_creation_date = this.getParameter('sysparm_original_creation_date');
        retObj.id = this.getParameter('sysparm_id');
        retObj.state = this.getParameter('sysparm_state');
        retObj.notes = this.getParameter('sysparm_notes');
        retObj.ag = this.getParameter('sysparm_ag');

        var caseRec = new GlideRecord("x_baoq_npp_nppcase");
        caseRec.addQuery("sys_id", retObj.id);
        caseRec.query();
        if (caseRec.next()) {
            retObj.valid = true;
            caseRec.state = retObj.state;
            caseRec.close_notes = retObj.notes;
            caseRec.update();
        }
        return JSON.stringify(retObj);
    },

    reopenCase: function() {
        var retObj = {
            valid: false
        };
        //retObj.original_creation_date = this.getParameter('sysparm_original_creation_date');
        retObj.id = this.getParameter('sysparm_id');
        // retObj.state = this.getParameter('sysparm_state');
        retObj.notes = this.getParameter('sysparm_notes');

        var caseRec = new GlideRecord("x_baoq_npp_nppcase");
        caseRec.addQuery("sys_id", retObj.id);
        caseRec.query();
        if (caseRec.next()) {
            retObj.valid = true;
            caseRec.state = -5;
            caseRec.work_notes = "Case Reopened: " + retObj.notes;
            caseRec.update();
        }
        return JSON.stringify(retObj);
    },

    checkDuplicateCaseAjax: function() {
        var retObj = {
            valid: false
        };
        retObj.original_transaction_id = this.getParameter('sysparm_original_transaction_id');
        retObj.npp_message = this.getParameter('sysparm_npp_message');
        retObj.id = this.getParameter('sysparm_id');
        retObj.duplicate = false;

        this.checkDuplicateCase(retObj);
        return JSON.stringify(retObj);
    },

    checkDuplicateCase: function(_obj) {
        var caseRec = new GlideRecord("x_baoq_npp_nppcase");
        caseRec.addQuery("original_transaction_id", _obj.original_transaction_id);
        // caseRec.addQuery("npp_message", _obj.npp_message);
        caseRec.query();
        if (caseRec.next()) {
            _obj.duplicate = true;
            var msgArray = [];
            msgArray.push(caseRec.number);
            msgArray.push(caseRec.original_transaction_id);
            _obj.message = gs.getMessage('npp.error.message.duplicate.case', msgArray);
        }
        _obj.valid = true;
        return _obj;
    },

    checkDuplicateCaseBR: function(current) {
        var retObj = {
            id: "" + current.sys_id,
            original_creation_date: "" + current.original_creation_date,
            original_transaction_id: "" + current.original_transaction_id,
            npp_message: "" + current.npp_message
        };
        retObj = this.checkDuplicateCase(retObj);
        return retObj;
    },

    calcPaymentAgeAjax: function() {
        var retObj = {
            valid: false
        };
        retObj.original_creation_date = this.getParameter('sysparm_original_creation_date');
        retObj.id = this.getParameter('sysparm_id');
        retObj.date_format = this.getParameter('sysparm_user_date_time_format');

        this.calcPaymentAge(retObj);
        return JSON.stringify(retObj);
    },

    calcPaymentAgeBR: function(current) {
        var retObj = {
            id: "" + current.sys_id,
            original_creation_date: "" + current.original_creation_date,
			date_format: "yyyy-MM-dd HH:mm:ss"
			
        };
        retObj = this.calcPaymentAge(retObj);
        if (current.cancellation_reason_code == "CUST") {
            current.cancellation_additional_info = retObj.cancellation_additional_info;
        }
        current.payment_age = retObj.payment_age;
    },

    ofiComms: function() {
        var retObj = {
            valid: true
        };
        retObj.name = "ofiComms";
        retObj.id = this.getParameter('sysparm_id');
        retObj.notes = this.getParameter('sysparm_notes');
        retObj.ofi_type = this.getParameter('sysparm_ofi_type');
        var nppCaseRec = new GlideRecord("x_baoq_npp_nppcase");
        if (nppCaseRec.get("sys_id", retObj.id)) {
            gs.eventQueue("x_baoq_npp.npp.message.ofi.comms", nppCaseRec, nppCaseRec.sys_id, JSON.stringify(retObj));
            nppCaseRec.work_notes = "OFI Comms: \nNotes: " + retObj.notes + "\nType: " + retObj.ofi_type;
            if (retObj.ofi_type == "request") {
                nppCaseRec.investigation_type = "INV4";
            }
            if (retObj.ofi_type == "response") {
                nppCaseRec.investigation_type = "INV5";
            }
            nppCaseRec.update();
        }
        return JSON.stringify(retObj);
    },

    customerAuth: function() {
        var retObj = {
            valid: true
        };
        retObj.name = "customerAuth";
        retObj.id = this.getParameter('sysparm_id');
        retObj.customer_authorisation = this.getParameter('sysparm_customer_authorisation');
        retObj.customer_authorisation_notes = this.getParameter('sysparm_customer_authorisation_notes');
        var nppCaseRec = new GlideRecord("x_baoq_npp_nppcase");
        if (nppCaseRec.get("sys_id", retObj.id)) {
            gs.eventQueue("x_baoq_npp.npp.message.ofi.comms", nppCaseRec, nppCaseRec.sys_id, JSON.stringify(retObj));
            nppCaseRec.work_notes = "customerAuth Comms: \nNotes: " + retObj.customer_authorisation_notes + "\nAuthorisation: " + retObj.customer_authorisation;
            // if (retObj.ofi_type == "Request") {
            //     nppCaseRec.investigation_type = "INV4";
            // }
            // if (retObj.ofi_type == "Response") {
            //     nppCaseRec.investigation_type = "INV3";
            // }
            nppCaseRec.update();
        }
        return JSON.stringify(retObj);
    },

    customerComms: function() {
        var retObj = {
            valid: true
        };
        retObj.name = "customerComms";
        retObj.id = this.getParameter('sysparm_id');
        retObj.general_customer_notes = this.getParameter('sysparm_general_customer_notes');
        var nppCaseRec = new GlideRecord("x_baoq_npp_nppcase");
        if (nppCaseRec.get("sys_id", retObj.id)) {
            gs.eventQueue("x_baoq_npp.npp.message.ofi.comms", nppCaseRec, nppCaseRec.sys_id, JSON.stringify(retObj));
            nppCaseRec.work_notes = "customer Comms: \nNotes: " + retObj.general_customer_notes;
            // if (retObj.ofi_type == "Request") {
            //     nppCaseRec.investigation_type = "INV4";
            // }
            // if (retObj.ofi_type == "Response") {
            //     nppCaseRec.investigation_type = "INV3";
            // }
            nppCaseRec.update();
        }
        return JSON.stringify(retObj);
    },

    test2: function() {
        gs.info("TEST")
    },

    type: 'NPPAjax'
});