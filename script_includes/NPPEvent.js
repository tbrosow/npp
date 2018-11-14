var NPPEvent = function() {
    // Ensure new is always called
    if (!(this instanceof NPPEvent)) {
        return new NPPEvent();
    }
    this.type = 'NPPEvent';
    // Set up logging for the instance
    //this._log = (new GSLog(null, this.type)).setLog4J();
    //this._log.setLevel(GSLog.TRACE);
    this._debugging = (gs.getProperty("debug.SI." + this.type) === 'true');
    if (gs.getProperty("instance_name").match(/dev/)) {
        this._debugging = true;
    }

    if (gs.getProperty("instance_name").match(/test/)) {
        this._debugging = true;
    }
};

NPPEvent.prototype.initialize = function() {

    this.INTERFACE_ENABLED          = Boolean(gs.getProperty("integration.ics.interface.enabled", "true") == "true");

};

NPPEvent.prototype._padZero = function(_num) {
    var numberString = "0" + _num;
    return numberString.slice(-2);
};

NPPEvent.prototype._debug = function(_msg, _flush) {
    if (this._debugging) {

        var localtime = new Date();

        if (this.debugStartTime == 0) {
            this.debugStartTime = localtime.getTime();
        }
        var ms = '000' + localtime.getMilliseconds();
        ms = ms.slice(-3);
        var dateString = this.type + ' ' + localtime.getFullYear() + '-' +
            this._padZero((localtime.getMonth() + 1)) + '-' +
            this._padZero(localtime.getDate()) + ' ' +
            this._padZero(localtime.getHours()) + ':' +
            this._padZero(localtime.getMinutes()) + ':' +
            this._padZero(localtime.getSeconds()) + '.' +
            ms + ': ';
        if (_flush) {
            this._log.debug(dateString + this.debugMessage);
        } else {
            this._log.debug(dateString + _msg);
            if (this.ResponseDebug) {
                this.addInfo(_msg);
            }
            var delta = localtime.getTime() - this.debugStartTime;
            var sec = this._padZero(parseInt(delta / 1000));
            if (sec > 60) {
                min = String("0" + parseInt(sec / 60)).slice(-2);
                sec = String("0" + parseInt(sec - (min * 60))).slice(-2);
            } else {
                min = "00";
            }
            ms = String("00" + (parseInt(delta) - (sec * 1000))).slice(-3);
            this.debugMessage += "\n" + min + ':' + sec + ':' + ms + ": " + _msg;
        }
    }
};

NPPEvent.prototype.flush = function() {
};

NPPEvent.prototype = Object.extendsObject(NPPInterface, {

    processData: function(nppCaseRec, _correlationID, _interfaceMsgRec) {
        this._debug("processData: " + _correlationID + "|" + this.ACTION_INSERT + "|" + _interfaceMsgRec.message_type + this.nppCaseRec.sys_id);
        if (this.action == this.ACTION_INSERT) {
            this.nppCaseRec.correlation_id = _correlationID;
            this._debug("processData: " + this.payloadObj.PrtryData.Data.InvstgtnTp.Prtry);
            this._debug("processData: " + this.payloadObj.PrtryData.Data.InvstgtnTp);
            this._debug("processData: " + this.payloadObj.PrtryData.Data);
            this._debug("processData: " + this.payloadObj.PrtryData);
            this.nppCaseRec.investigation_type = this.payloadObj.PrtryFrmtInvstgtn.PrtryData.Data.InvstgtnTp.Prtry;
        }
        if (this.action == this.ACTION_UPDATE) {
            this.nppCaseRec.short_description += ".. ";
        }
        var id = this.nppCaseRec.update();
        this._debug("processData: " + id);
    },

    mapData: function(_messageType) {
    },

    correlateTask: function(_id) {
        this._debug("correlateTask: " + _id);
        this.action = this.ACTION_UPDATE;
        this.nppCaseRec = new GlideRecord("u_npp_case");
        this.nppCaseRec.addQuery("correlation_id", _id);
        this.nppCaseRec.query();
        if (!this.nppCaseRec.next()) {
            this.action = this.ACTION_INSERT;
            this.nppCaseRec.newRecord();
        }
        return this.nppCaseRec;
    },


    getCorrelationID: function(_messageType) {
        this._debug("getCorrelationID: " + _messageType);
        switch (String(_messageType)) {
            case "camt.035":
                return this.payloadObj.PrtryFrmtInvstgtn.Case.Id;
            default:
                return "";
        }
        return "";
    },

    processInbound: function(_interfaceMsgRec) {
        this.initialize();
        this._debug("processInbound: " + _interfaceMsgRec.number);
        this.payloadObj = JSON.parse(_interfaceMsgRec.payload);
        this.printJSON("Payload", this.payloadObj);
        this.correlationID = this.getCorrelationID(_interfaceMsgRec.message_type);
        var nppCaseRec = this.correlateTask(this.correlationID);
        this.processData(nppCaseRec, this.correlationID, _interfaceMsgRec);
        this._debug("processInbound: " + this.payloadObj.PrtryFrmtInvstgtn.Case.Id);
        _interfaceMsgRec.table = this.nppCaseRec.getTableName();
        _interfaceMsgRec.reference = this.nppCaseRec.sys_id;
        _interfaceMsgRec.status = this.INTERFACE_STATUS_SUCCESS;
        _interfaceMsgRec.update();
    }
});

NPPEvent.prototype.event = function(_alertRec) {
    this.error = {code:0, message: ""};
    this._debug("event Number: " + _alertRec.number);
    this._debug("event Additional Info: " + _alertRec.additional_info);
    this._debug("event resource: " + _alertRec.resource);
    this._debug("event message_key: " + _alertRec.message_key);

    try {
        this.additionalInfoObj = JSON.parse(_alertRec.additional_info);
        this.payload = JSON.parse(this.additionalInfoObj.u_payload);
    } catch (e) {
        this._debug("Exception: " + e);
        this.payload = {};
        this.error.code = 501;
        this.error.message = "Error parsing payload: " + e + "\n" + _alertRec.additional_info;
    }
    this._debug("Payload: " + JSON.stringify(this.payload));

    try {
        var nppInterfaceRec = new GlideRecord("x_baoq_npp_integration_message");

        nppInterfaceRec.newRecord();
        nppInterfaceRec.direction = "inbound";
        var nppInterface = NPPInterface();
        nppInterface.initialize();
        nppInterfaceRec.source = nppInterface.INTERFACE_SOURCE_TARGET_EVENT_MANAGEMENT;
        nppInterfaceRec.target = nppInterface.INTERFACE_SOURCE_TARGET_BOQ;

        nppInterfaceRec.payload = JSON.stringify(this.payload);

        this.nppMessageDefinitionRec = new GlideRecord("x_baoq_npp_message_definition");
        this.nppMessageDefinitionRec.addQuery("name", _alertRec.resource);
        this.nppMessageDefinitionRec.query();
        if (this.nppMessageDefinitionRec.next()) {
            nppInterfaceRec.message_type = this.nppMessageDefinitionRec.sys_id;
        }

        nppInterfaceRec.status = "queued";

        var nppMessageDefinitionRec = new GlideRecord("x_baoq_npp_message_definition");
        nppMessageDefinitionRec.addQuery("name", _alertRec.resource);
        nppMessageDefinitionRec.addQuery("direction", "inbound");
        nppMessageDefinitionRec.query();
        if (nppMessageDefinitionRec.next()) {
            nppInterfaceRec.message_type = nppMessageDefinitionRec.sys_id;
        } else {
            this.error.code = 502;
            this.error.message = "Inbound message definition " + _alertRec.resource + " not found";
            this.error.message_definition = "" + _alertRec.resource;
        }

        if (this.error.code != 0) {
            nppInterfaceRec.error_message = JSON.stringify(this.error);
            nppInterfaceRec.status = "failed";
        }

        this._debug("nppInterfaceRec.status: " + nppInterfaceRec.status);
        var id = nppInterfaceRec.insert();
        this._debug("event Additional Info: " + id);

        if (id) { // Close the alert
            this._debug("close the alert" + _alertRec.number + ":" + _alertRec.sys_id);
            var alertRec = new GlideRecord("em_alert");
            if (alertRec.get(_alertRec.sys_id)) {
                alertRec.state = "Closed";
                alertRec.acknowledged = true;
                alertRec.description = "Closed by NPP Interface";
                var ret = alertRec.update();
                this._debug("UPDATE [" + ret + "]");
            }
        }
        // var nppTask = new GlideRecord("u_npptask");
        // nppTask.addQuery("correlation_id", this.obj["camt.029.001.01"].RslvdCase.Id);
        // nppTask.query();
        // if (nppTask.next()) { // Update
        //     nppTask.work_notes = this.obj["camt.029.001.01"].Assgnmt.CreDtTm;
        //     nppTask.update();
        //
        //     nppInterfaceRec.reference = nppTask.sys_id;
        //     nppInterfaceRec.table = nppTask.getTableName();
        //     nppInterfaceRec.status = "success";
        //     nppInterfaceRec.update();
        // } else {
        //
        //     nppTask.newRecord();
        //     nppTask.short_description = "NPP " + this.obj["camt.029.001.01"].RslvdCase.Id;
        //     nppTask.correlation_id = this.obj["camt.029.001.01"].RslvdCase.Id;
        //     nppTask.description = JSON.stringify(this.obj);
        //     nppTask.xml = _alertRec.description;
        //     nppTask.insert();
        // }
    } catch (e) {
        this._debug("Exception: " + e);
    }
    return false; // Always return false to abort Event Task creation
};
