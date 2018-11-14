var NPPInterfaceInbound = function() {
    // Ensure new is always called
    if (!(this instanceof NPPInterfaceInbound)) {
        return new NPPInterfaceInbound();
    }
    this.type = 'NPPInterfaceInbound';
    // Set up logging for the instance
    // this._log = (new GSLog(null, this.type)).setLog4J();
    // this._log.setLevel(GSLog.TRACE);
    this._debugging = (gs.getProperty("debug.SI." + this.type) === 'true');
    if (gs.getProperty("instance_name").match(/dev/)) {
        this._debugging = true;
    }

    if (gs.getProperty("instance_name").match(/test/)) {
        this._debugging = true;
    }
};

NPPInterfaceInbound.prototype = Object.extendsObject(NPPInterface, {

    rest: function(_payload, _message) {
        this.initialize();
        this.valid = true;
        this._debug("processInbound: " + typeof _payload);
        if (typeof _payload == "object") {
            this.payload = _payload;

        } else {
            this.payload = JSON.parse(_payload);
        }
        var nppInterfaceRec = new GlideRecord("x_baoq_npp_integration_message");
        nppInterfaceRec.newRecord();
        nppInterfaceRec.payload = JSON.stringify(this.payload);
        nppInterfaceRec.direction = "inbound";
        nppInterfaceRec.status = "in_transfer";
        this.messageDefinitionRec = NPPUtilities().getMessageTypeByName(_message, "inbound");

        nppInterfaceRec.message_type = "" + this.messageDefinitionRec.sys_id;
        nppInterfaceRec.target = this.INTERFACE_SOURCE_TARGET_BOQ;
        nppInterfaceRec.source = this.INTERFACE_SOURCE_TARGET_ORCHESTRATION;

        if (global.JSUtil.nil(_message)) {
            this.response.errorCode = 103;
            this.response.errorMessage = this.ERR_MESSAGE_103;
            this.valid = false;
        } else if (global.JSUtil.nil(this.messageDefinitionRec)) {
            this.response.errorCode = 102;
            this.response.errorMessage = String(this.ERR_MESSAGE_102).replace(/\{\{message\}\}/, _message);
            this.valid = false;
        }

        if (this.valid) {
            var id = nppInterfaceRec.insert();
            var response = this.process(nppInterfaceRec);
            return response;
        } else {
            nppInterfaceRec.status = "failed";
            nppInterfaceRec.response = JSON.stringify(this.response);
            nppInterfaceRec.insert();
            return this.response;
        }
        // this.payloadObj = JSON.parse(_interfaceMsgRec.payload);
    },

    process: function(_interfaceMsgRec) {
        this.initialize();

        this._debug("processInbound: " + _interfaceMsgRec.transaction_id);
        this.payloadObj = JSON.parse(_interfaceMsgRec.payload);
        this.printJSON("Payload", this.payloadObj);

        this.loadMessageMapping(_interfaceMsgRec.message_type);

        this.correlationID = this.getCorrelationID(_interfaceMsgRec.message_type.table);
        var myGlideRec = this.correlateTask(this.correlationID);

        this.response = this.processData(_interfaceMsgRec);
        this._debug("processInbound: " + typeof this.myGlideRecord);
        this._debug("processInbound: " + this.myGlideRecord.sys_id);
        this._debug("processInbound: " + this.myGlideRecord.getTableName());
        // if (this.response.errorCode == this.RET_CODE_OK) {
        if (typeof this.myGlideRecord == "object" && !global.JSUtil.nil(this.myGlideRecord.sys_id)) {
            _interfaceMsgRec.table = this.myGlideRecord.getTableName();
            _interfaceMsgRec.reference = this.myGlideRecord.sys_id;
        }
        _interfaceMsgRec.response = JSON.stringify(this.response);
        _interfaceMsgRec.correlation_id = this.correlationID;
        _interfaceMsgRec.status = this.messageMapping.status;
        _interfaceMsgRec.error_message = this.getErrorLog();
        _interfaceMsgRec.warning_message = this.getWarningLog();
        _interfaceMsgRec.update();
        return this.response;
    },

    mapData: function(_messageType) {
    }
});