var NPPInterface = function() {
    // Ensure new is always called
    if (!(this instanceof NPPInterface)) {
        return new NPPInterface();
    }
    this.type = 'NPPInterface';
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

NPPInterface.prototype.initialize = function() {
    this.INTERFACE_ENABLED          = Boolean(gs.getProperty("npp.case.management.integration.enabled", "true") == "true");
    this.MAX_RETRY                  = parseInt(gs.getProperty("npp.case.management.integration.msg.retain.records.time"));
    this.BASIC_AUTHORIZATION 		= gs.getProperty("npp.case.management.integration.xxx");

    this.ACTION_INSERT              = "insert";
    this.ACTION_UPDATE              = "update";
    this.INTERFACE_STATUS_SUCCESS   = "success";
    this.INTERFACE_STATUS_SKIPPED   = "skipped";
    this.INTERFACE_STATUS_ERROR     = "error";

    this.INTERFACE_SOURCE_TARGET_BOQ                = "BOQ";
    this.INTERFACE_SOURCE_TARGET_ORCHESTRATION      = "Orchestration";
    this.INTERFACE_SOURCE_TARGET_EVENT_MANAGEMENT   = "Event Management";

    this.RET_CODE_OK                = 0;
    this.RET_CODE_ERROR             = 1;

    this.ERR_MESSAGE_001            = "Message type not found";
    this.ERR_MESSAGE_101            = "Validation Error";
    this.ERR_MESSAGE_102            = "Message definition {{message}} not found";
    this.ERR_MESSAGE_103            = "Please provide url parameter message [camt.035, camt.056]";
    this.ERR_MESSAGE_401            = "No record found with query {{query}}";
    this.workNote                   = [];

    this.errorLog = [];
    this.infoLog = [];
    this.warningLog = [];

    this.response = {
        errorCode: 0,
        errorMessage: ""
    };

    this.payload = {};

};

NPPInterface.prototype._padZero = function(_num) {
    var numberString = "0" + _num;
    return numberString.slice(-2);
};

NPPInterface.prototype._debug = function(_msg, _flush) {
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
            gs.info(dateString + _msg);
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

NPPInterface.prototype.flush = function() {
};

NPPInterface.prototype.addError = function(_text) {
    this.errorLog.push(_text);
};

NPPInterface.prototype.addInfo = function(_text) {
    this.infoLog.push(_text);
};

NPPInterface.prototype.addWarning = function(_text) {
    this.warningLog.push(_text);
};

NPPInterface.prototype.getErrorLog = function() {
    return this.errorLog.join("\n");
};

NPPInterface.prototype.getInfoLog = function() {
    return this.infoLog.join("\n");
};

NPPInterface.prototype.getWarningLog = function() {
    return this.warningLog.join("\n");
};

NPPInterface.prototype.queryInfo = function(_text, _glideRec) {
    if (this._debugging) {
        this._debug("Query Info: " + _text + " [" + _glideRec.getRowCount() + "] " + _glideRec.getEncodedQuery());
    }
};

NPPInterface.prototype.printJSON = function (_text, _obj, _format) {
    if (_format) {
        this._debug(_text + ": " + JSON.stringify(_obj, null, 4));
    } else {
        this._debug(_text + ": " + JSON.stringify(_obj));
    }
};

NPPInterface.prototype.getLabel = function (_table, _element, _value) {
    var sysChoiceRec = new GlideRecord("sys_choice");
    sysChoiceRec.addQuery("element", _element);
    sysChoiceRec.addQuery("name", _table);
    sysChoiceRec.addQuery("value", _value);
    sysChoiceRec.addQuery("language", "en");
    sysChoiceRec.query();

    if (sysChoiceRec.next()) {
        return sysChoiceRec.label;
    }
    return _value;
};

/* MESSAGE INBOUND */
NPPInterface.prototype.getValue = function(_obj, _path) {
    var id = "";
    // this._debug("getValue: " + JSON.stringify(_obj) + " " + _path);
    var pathArr = _path.split(".");
    if (pathArr.length > 1) {
        var obj = _obj[pathArr[0]];
        pathArr.shift();
        var path = pathArr.join(".");
        id = this.getValue(obj, path);

    } else {
        // this._debug("getValue RET: " + JSON.stringify(_obj) + ": " + _obj[_path]);
        // this._debug("TB" + _path + " " + JSON.stringify(_obj[_path]));//this.dumpObj(_obj[_path])
        return _obj[_path];
    }
    return id;
};

NPPInterface.prototype.addWorkNotes = function(_label, _text) {
    // this._debug("addWorkNotes: " + _label + _text);
    // this.workNote.push({label: _label, text: _text});
    // return "123";
};

NPPInterface.prototype.processMapping = function(_myGlideRecord) {
    this._debug("processMapping [" + this.messageMapping.mapping.length + "]");
    var value, ret, workNote = [];
    for (var key in this.messageMapping.mapping) {
        try {
            // this._debug("key" + JSON.stringify(this.messageMapping.mapping[key]));
            var myScript = this.messageMapping.mapping[key].script.replace(/current/g, "_myGlideRecord");
            // var myScript = myScript.replace(/addWorknotes/g, "NPPInterface().addWorknotes");
            if (this.messageMapping.mapping[key].script_action == "both") {
                value = this.getValue(this.payloadObj, this.messageMapping.mapping[key].path);
                this._debug("Evaluate script: " + myScript + " with value " + value);
                // ret = eval(myScript);
                var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                _myGlideRecord = nppInterfaceEval.evaluate(myScript, _myGlideRecord, value);

            } else if (this.action == this.ACTION_INSERT && this.messageMapping.mapping[key].script_action == "insert") {
                value = this.getValue(this.payloadObj, this.messageMapping.mapping[key].path);
                this._debug("Evaluate script: " + myScript + " with value " + value);
                // ret = eval(myScript);
                var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                _myGlideRecord = nppInterfaceEval.evaluate(myScript, _myGlideRecord, value);
            } else if (this.action == this.ACTION_UPDATE && this.messageMapping.mapping[key].script_action == "update") {
                value = this.getValue(this.payloadObj, this.messageMapping.mapping[key].path);
                this._debug("Evaluate script: " + myScript + " with value " + value);
                // ret = eval(myScript);
                var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                _myGlideRecord = nppInterfaceEval.evaluate(myScript, _myGlideRecord, value);
            }
        } catch (e) {
            this._debug("Exception by evaluating script: " + this.messageMapping.mapping[key].script + " " + e);
        }
    }
    var wn = "NPP Interface:";
    for (var key in workNote) {
        wn += "\n  " + workNote[key].text + workNote[key].value;
    }
    if (workNote.length > 0) {
        this.myGlideRecord.work_notes = wn;
    }
    this._debug("processMapping")
};

NPPInterface.prototype.executeScripts = function(_type, _options) {
    this._debug("executeScripts: " + _type + " " + this.action);
    var errorMessage = "";
    var errorCode = "";
    var valid = true;
    var xmlStr = "";
    if (_options) {
        if (!global.JSUtil.nil(_options.xml)) {
            xmlStr = _options.xml;
        }
    }

    for (var key in this.messageMapping.scripts) {

        if (this.action == this.messageMapping.scripts[key].script_action || this.messageMapping.scripts[key].script_action == "both") {

            var myScript = this.messageMapping.scripts[key].script;
            if (this.messageMapping.scripts[key].type == _type && _type == "post_execution") {
                this._debug("executeScripts: EXECUTE Action: " + this.action + " " + this.messageMapping.scripts[key].description + " - " + this.messageMapping.scripts[key].script_action);

                // this._debug("executeScripts: POST Script [PRE]: " + myScript);
                myScript = myScript.replace(/current/g, "_myGlideRecord");

                this._debug("executeScripts: POST Script [AFTER]: " + myScript);
                try {
                    //eval(myScript);
                    var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                    this.myGlideRecord = nppInterfaceEval.evaluate(myScript, this.myGlideRecord, "", this.payloadObj);
                } catch (e) {
                    this.addError("Exception1 by executing " + _type + " Script: " + e);
                }
            } else if (this.messageMapping.scripts[key].type == _type && _type == "alter_xml") {
                this._debug("executeScripts: EXECUTE Action: " + this.action + " " + this.messageMapping.scripts[key].description + " - " + this.messageMapping.scripts[key].script_action);

                this._debug("executeScripts: POST Script [PRE]: " + myScript);
                myScript = myScript.replace(/current/g, "_myGlideRecord");

                try {
                    var xmldoc = new XMLDocument2();
                    xmldoc.parseXML(xmlStr);
                    this._debug("XML: " + xmldoc.toString());

                    node = xmldoc.getNode(this.messageMapping.scripts[key].path);
                    this._debug(node);

                    this._debug("executeScripts: POST Script [AFTER]: " + myScript);

                    //eval(myScript);
                    var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                    var answer = nppInterfaceEval.evaluateAnswer(myScript, this.myGlideRecord);
                    node.setAttribute(this.messageMapping.scripts[key].attribute ,answer);
                    xmlStr = xmldoc.toString();

                } catch (e) {
                    this.addError("Exception by executing " + _type + " Script: " + e);
                }
            } else if (this.messageMapping.scripts[key].type == _type && _type == "correlate") {
                this._debug("executeScripts: EXECUTE Action: " + this.action + " " + this.messageMapping.scripts[key].description + " - " + this.messageMapping.scripts[key].script_action);

                // this._debug("executeScripts: POST Script [PRE]: " + myScript);
                myScript = myScript.replace(/current/g, "_myGlideRecord");

                this._debug("executeScripts: POST Script [AFTER]: " + myScript);
                try {
                    //eval(myScript);
                    var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                    this.correlationQuery = nppInterfaceEval.evaluateCorrelationID(myScript, this.payloadObj);
                } catch (e) {
                    this.addError("Exception by executing " + _type + " Script: " + e);
                }
            } else if (this.messageMapping.scripts[key].type == _type && _type == "gen_response") {
                 this._debug("executeScripts: EXECUTE Action: " + this.action + " " + this.messageMapping.scripts[key].description + " - " + this.messageMapping.scripts[key].script_action);

                // this._debug("executeScripts: POST Script [PRE]: " + myScript);
                myScript = myScript.replace(/current/g, "_myGlideRecord");
                // myScript = myScript.replace(/payload/g, "this.payloadObj");
                // myScript = myScript.replace(/response/g, "this.response");
                this._debug("executeScripts: POST Script [AFTER]: " + myScript);
                try {
                    //eval(myScript);
                    var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                    this.response = nppInterfaceEval.evaluateResponse(myScript, this.myGlideRecord, this.response, this.payloadObj);
                } catch (e) {
                    this.addError("Exception2 by executing " + _type + " Script: " + e);
                }
            } else if (this.messageMapping.scripts[key].type == _type && _type == "validate") {
                this._debug("executeScripts: EXECUTE Action: " + this.action + " " + this.messageMapping.scripts[key].description + " - " + this.messageMapping.scripts[key].script_action);

                // Validate
                // this._debug("executeScripts: POST Script [PRE]: " + myScript);
                myScript = myScript.replace(/current/g, "_myGlideRecord");
                // myScript = myScript.replace(/payload/g, "this.payloadObj");
                // myScript = myScript.replace(/errorCode/g, "this.response.errorCode");
                this._debug("executeScripts22: POST Script [AFTER]: " + myScript);
                try {
                    //valid = eval(myScript);
                    var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                    valid = nppInterfaceEval.test(myScript, this.myGlideRecord, this.payloadObj);
                    this._debug("executeScripts: " + valid);
                } catch (e) {
                    this.addError("Exception3 by executing " + _type + " Script: " + e);
                }
                this._debug("executeScripts33: Validate: " + valid);
                if (!valid) {
                    if (this.response.errorCode == 0) {
                        this.response.errorCode = 101;
                        this.response.errorMessage = "Validation Error";
                    }
                    if (!global.JSUtil.nil(errorMessage)) {
                        this.response.errorMessage = errorMessage;
                    }
                    if (!global.JSUtil.nil(errorCode)) {
                        this.response.errorCode = errorCode;
                    }
                    this.messageMapping.status = "skipped";
                    return valid;
                }
            } else {
                // this._debug("executeScripts: SKIP Action: " + this.action + " " + this.messageMapping.scripts[key].description + " - " + this.messageMapping.scripts[key].script_action);
            }
        } else {
            // this._debug("executeScripts: SKIP Action: " + this.action + " " + this.messageMapping.scripts[key].description + " - " + this.messageMapping.scripts[key].script_action);
        }
    }
    if (_type == "alter_xml") {
        return xmlStr;
    } else {
        return valid;
    }
};

NPPInterface.prototype.processData = function(_interfaceMsgRec) {

    this._debug("processData: " + this.correlationID + "|" + this.action + "|" + _interfaceMsgRec.message_type + "|" + this.myGlideRecord.sys_id);
    if (this.action == this.ACTION_INSERT) {
        this.myGlideRecord.correlation_id = this.correlationID;
    }
    this.processMapping(this.myGlideRecord);
    this.printJSON("Worknotes", this.workNote);

    // Validate
    var valid = true;
    valid = this.executeScripts("validate");
    this._debug("processData: valid: " + valid);
    if (valid) {
        this.executeScripts("post_execution");
        this.executeScripts("gen_response");
    }

    if (valid && this.messageMapping.status == this.INTERFACE_STATUS_SUCCESS) {
        var id = this.myGlideRecord.update();
    }
    this._debug("processData: " + this.myGlideRecord.number + ":" + id);
    return this.response;

};

NPPInterface.prototype.correlateTask = function(_correlationID) {
    this._debug("correlateTask: " + _correlationID + " table: " + this.messageMapping.table);
    this.action = this.ACTION_UPDATE;
    this.myGlideRecord = new GlideRecord(this.messageMapping.table);

    this.executeScripts("correlate");

    this._debug("correlation Query: " + this.correlationQuery);

    if (!global.JSUtil.nil(this.correlationQuery)) {
        this.myGlideRecord.addEncodedQuery(this.correlationQuery);
    } else {
        this.myGlideRecord.addQuery("correlation_id", _correlationID);
    }

    this.myGlideRecord.query();
    this.queryInfo("myGlideRecord", this.myGlideRecord);
    if (!this.myGlideRecord.next()) {
        this.action = this.ACTION_INSERT;
        this.myGlideRecord.newRecord();
    }
    if (!(this.messageMapping.action == "both" || this.messageMapping.action == this.action)) {
        this.messageMapping.status = "skipped";
        this.addWarning("Database action " + this.action + " is not configured for this message definition");
        this.response.errorCode = 102;
        this.response.errorMessage = this.ERR_MESSAGE_102.replace(/\{\{message\}\}/, this.action);
    }
    return this.myGlideRecord;
};

NPPInterface.prototype.getCorrelationID = function() {

    var pathArr = this.messageMapping.correlationId.split(".");
    var id = this.getValue(this.payloadObj, this.messageMapping.correlationId);
    this._debug("Correlation-ID: " + id);
    return id;
};

NPPInterface.prototype.loadMessageMapping = function(_nppMessageDefinitionRec) {
    this.messageMapping = {
        table: "" + _nppMessageDefinitionRec.table,
        action: "" + _nppMessageDefinitionRec.action,
        correlationId:"",
        mapping:[],
        scripts:[],
        status: this.INTERFACE_STATUS_SUCCESS
    };

    var nppMessageMappingRec = new GlideRecord("x_baoq_npp_message_mapping");
    nppMessageMappingRec.addQuery("message_definition", _nppMessageDefinitionRec.sys_id);
    nppMessageMappingRec.orderBy("path");
    nppMessageMappingRec.query();
    this.queryInfo("nppMessageMappingRec", nppMessageMappingRec);
    while (nppMessageMappingRec.next()) {
        var obj = {correlationId: ""};
        obj.element         = "" + nppMessageMappingRec.element;
        obj.parent          = "" + nppMessageMappingRec.parent;
        obj.path            = "" + nppMessageMappingRec.path;
        obj.script          = "" + nppMessageMappingRec.script;
        obj.top_element     = Boolean(nppMessageMappingRec.top_element);
        obj.type            = "" + nppMessageMappingRec.type;
        obj.correlation_id  = nppMessageMappingRec.correlation_id;
        obj.script_action   = "" + nppMessageMappingRec.script_action;

        if (obj.correlation_id) {
            this.messageMapping.correlationId = "" + nppMessageMappingRec.path;
        }

        this.messageMapping.mapping.push(obj);
    }
    var nppMessageActionRec = new GlideRecord("x_baoq_npp_message_action");
    nppMessageActionRec.addQuery("message_definition", _nppMessageDefinitionRec.sys_id);
    nppMessageActionRec.addNotNullQuery("script_action");
    nppMessageActionRec.orderBy("order");
    nppMessageActionRec.query();
    this.queryInfo("nppMessageActionRec", nppMessageActionRec);
    while (nppMessageActionRec.next()) {
        var obj = {};
        obj.script          = "" + nppMessageActionRec.script;
        obj.type            = "" + nppMessageActionRec.type;
        obj.script_action   = "" + nppMessageActionRec.script_action;
        obj.description     = "" + nppMessageActionRec.description;
        obj.path            = "" + nppMessageActionRec.path;
        obj.attribute       = "" + nppMessageActionRec.attribute;

        this.messageMapping.scripts.push(obj);
    }
    this.printJSON("messageMapping", this.messageMapping, true);
};

/* MESSAGE INBOUND */
NPPInterface.prototype.initIM = function(_current, _message) {

};

NPPInterface.prototype.checkPath = function(_obj, _path) {

    var id = "";
    this._debug("checkPath: " + JSON.stringify(_obj) + " - " + _path);
    var pathArr = _path.split(".");
    if (pathArr.length > 1) {
        // this._debug("checkPath > 1");
        var obj = _obj[pathArr[0]];
        pathArr.shift();
        var path = pathArr.join(".");
        id = this.checkPath(obj, path);

    } else {
        // this._debug("checkPath RET: " + JSON.stringify(_obj) + ": " + _obj[_path]+ ": " + _path);
        // this._debug("TB" + _path + " " + JSON.stringify(_obj[_path]));//this.dumpObj(_obj[_path])
        return _obj[_path];
    }
    return id;

};

NPPInterface.prototype.addChildElement = function(_mapping) {
    this._debug(_mapping.element + " - " + _mapping.path);
    // this.printJSON("addChild", _mapping, true);
    if (this.payload[_mapping.element] !== undefined) {

    } else { // NOT defined
        if (_mapping.top_element) {
            this._debug(_mapping.element + " TOP");
            this.payload[_mapping.element] = {};
        } else {
            // check path
            // this._debug("checkPath START" + _mapping.path);
            var pathArr = _mapping.path.split(".");
            pathArr.splice(-1,1);
            var path = pathArr.join(".");

            var obj = this.checkPath(this.payload, path);
            if (typeof obj == "object") {
                // obj[_mapping.element] = {};
                if (_mapping.type == "child") {
                    if (_mapping.script_action == "query") {

                        var myScript = _mapping.script;
                        myScript = myScript.replace(/current/g, "_myGlideRecord");

                        try {
                            var nppInterfaceEval = new global.NPPInterfaceEvaluator();
                            var answer = nppInterfaceEval.evaluateAnswer(myScript, this.myGlideRecord);
                            this._debug("evaluateAnswer: POST Script [AFTER]: " + answer + " " + typeof answer);
                            obj[_mapping.element] = "" + answer;
                        } catch (e) {
                            this.addError("Exception1 by executing " + myScript + " Script: " + e);
                        }
                    } else {
                        obj[_mapping.element] = "";
                    }
                } else {
                    obj[_mapping.element] = {};
                }
            } else {

            }

        }
    }
    // this.printJSON("addChild", this.payload, true);
    // this.payload[_mapping.element]
};

NPPInterface.prototype.generateOutMessage = function() {
    this._debug("generateOutMessage: " + this.myGlideRecord.sys_id);
    for (var key in this.messageMapping.mapping) {
        this.addChildElement(this.messageMapping.mapping[key]);
    }
    this._debug("generateOutMessage: " + this.myGlideRecord.sys_id);

};

NPPInterface.prototype.archive = function(_table, _query, _archiveTable) {
    var myGlideRec = new GlideRecord(_table);
    myGlideRec.addEncodedQuery(_query);

    myGlideRec.query();
    this.queryInfo("Archive", myGlideRec);
    while (myGlideRec.next()) {
        myGlideRec.sys_class_name = _archiveTable;
        this._debug("Archive Glide record with id: " + myGlideRec.sys_id);
        myGlideRec.update();
    }
};

NPPInterface.prototype.deleteRecords = function(_table, _query) {
    var myGlideRec = new GlideRecord(_table);
    myGlideRec.addEncodedQuery(_query);
    myGlideRec.query();
    this._debug("Delete " + myGlideRec.getRowCount() + " Glide records with query: [" + myGlideRec.getEncodedQuery() + "]");
    this.queryInfo("Delete", myGlideRec);
    while (myGlideRec.next()) {
        myGlideRec.deleteRecord();
    }
};

NPPInterface.prototype.genenateMessageDefinition = function(_current) {
    this._debug("genenateMessageDefinition " + _current.transaction_id);
    try {
        var obj = JSON.parse(_current.payload);

        var messageDefinition = "";
        if (global.JSUtil.nil(_current.message_type)) {
            this._debug("genenateMessageDefinition1");
            var errObj = JSON.parse(_current.error_message);
            messageDefinition = errObj.message_definition;
        } else {
            this._debug("genenateMessageDefinition2");
            messageDefinition = _current.message_type.name;
        }
        this._debug("genenateMessageDefini3tion" + messageDefinition);

        this.nppMessageDefinitionRec = new GlideRecord("x_baoq_npp_message_definition");
        this.nppMessageDefinitionRec.addQuery("name", messageDefinition);
        this.nppMessageDefinitionRec.addQuery("direction", _current.direction);
        this.nppMessageDefinitionRec.query();
        if (!this.nppMessageDefinitionRec.next()) {
            this.nppMessageDefinitionRec.newRecord();
            this.nppMessageDefinitionRec.name             = messageDefinition;
            this.nppMessageDefinitionRec.description      = "Please add a description here ...";
            this.nppMessageDefinitionRec.direction        = _current.direction;
            this.nppMessageDefinitionRec.action           = "both";
            this.nppMessageDefinitionRec.table            = _current.table;
            this.nppMessageDefinitionRec.insert();
        } else {
            var backup = messageDefinition + " COPY - " + new GlideDateTime();
            var description = "" + this.nppMessageDefinitionRec.description;
            var action = "" + this.nppMessageDefinitionRec.action;
            this._debug("genenateMessageDefini4tion" + description);
            this.nppMessageDefinitionRec.name = backup;
            this.nppMessageDefinitionRec.update();
            this.oldMessageDefinitionID = "" + this.nppMessageDefinitionRec.sys_id;

            this.nppMessageDefinitionRec.newRecord();
            this._debug("genenateMessageDefini5tion" + description);

            this.nppMessageDefinitionRec.name             = messageDefinition;
            this.nppMessageDefinitionRec.description      = description;
            this.nppMessageDefinitionRec.direction        = _current.direction;
            this.nppMessageDefinitionRec.action           = action;
            this.nppMessageDefinitionRec.table            = _current.table;
            this.nppMessageDefinitionRec.insert();
        }

        var ret = this.generateMD(obj);
        this._debug(ret);
    } catch (e) {
        this._debug("genenateMessageDefinition" + e);
    }

};

NPPInterface.prototype.generateMD = function(arr, level, _item) {

    var dumped_text = "";
    if (!level) level = 0;
    if (!_item) _item = "TOP";

    var level_padding = "";
    for (var j = 0; j < level + 1; j++)
        level_padding += " ";

    if (typeof(arr) == 'object') {

        var ic = 0;
        for (var item in arr) {
            if (level == 0) {
                _item = "TOP";
            }

            ic++;
            var value = arr[item];

            if (typeof(value) == 'object') {
                dumped_text += level + " PAR: [" + _item + "]" + level_padding + "'" + item + "' ...\n";
                var id = this.addElement(_item, item, "parent");
                dumped_text += this.generateMD(value, level + 1, id);
            } else {
                dumped_text += level + "-" + ic + " ELE: [" + _item + "]" + level_padding + "'" + item + "' => \"" + value + "\"\n";
                this.addElement(_item, item, "child");
            }
        }
    } else {
        dumped_text = "===>" + arr + "<===(" + typeof(arr) + ")";
    }
    return dumped_text;
};

NPPInterface.prototype.dumpObj = function(arr, level) {

    var dumped_text = "";
    if (!level) level = 0;

    var level_padding = "";
    for (var j = 0; j < level + 1; j++) level_padding += " ";

    if (typeof(arr) == 'object') {
        var ic = 0;
        for (var item in arr) {
            ic++;
            var value = arr[item];

            if (typeof(value) == 'object') {
                dumped_text += level + level_padding + "'" + item + "' ...\n";
                dumped_text += this.generateMD(value, level + 1);
            } else {
                dumped_text += level + "-" + ic + " " + level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else {
        dumped_text = "===>" + arr + "<===(" + typeof(arr) + ")";
    }
    return dumped_text;
};

NPPInterface.prototype.addElement = function(_parent, _element, _type) {

    var elem = "" + _element;

    var regEx = RegExp('^@');
    if (regEx.test(elem)) return;

    this.element = _element;
    this.top_element = false;

    if (_parent != "TOP") {
        this.parent = _parent;
        var parentNppMessageMappingRec = new GlideRecord("x_baoq_npp_message_mapping");
        if (parentNppMessageMappingRec.get(_parent)) {
            this.path = parentNppMessageMappingRec.path + "." + _element;
        } else {
            this.path = _element;
        }
    } else {
        this.top_element = true;
        this.path = _element;
        this.parent = "";
    }

    var nppMessageMappingRec = new GlideRecord("x_baoq_npp_message_mapping");
    nppMessageMappingRec.addQuery("path", this.path);
    nppMessageMappingRec.addQuery("message_definition", this.nppMessageDefinitionRec.sys_id);
    nppMessageMappingRec.query();
    if (!nppMessageMappingRec.next()) {
        nppMessageMappingRec.newRecord();
        nppMessageMappingRec.element = this.element;
        nppMessageMappingRec.parent = this.parent;
        nppMessageMappingRec.top_element = this.top_element;
        nppMessageMappingRec.type = _type;
        nppMessageMappingRec.path = this.path;
        nppMessageMappingRec.message_definition = this.nppMessageDefinitionRec.sys_id;

        var oldMappingRec = new GlideRecord("x_baoq_npp_message_mapping");
        oldMappingRec.addQuery("path", this.path);
        oldMappingRec.addQuery("message_definition", this.oldMessageDefinitionID);
        oldMappingRec.query();
        this.queryInfo("old Mapping Record", oldMappingRec);
        if (oldMappingRec.next()) {
            nppMessageMappingRec.script = oldMappingRec.script;
            nppMessageMappingRec.correlation_id = oldMappingRec.correlation_id;
            nppMessageMappingRec.script_action = oldMappingRec.script_action;
        }

        var id = nppMessageMappingRec.insert();
        return id;
    } else {
        return nppMessageMappingRec.sys_id;
    }

};

NPPInterface.prototype.toggleFormatPayload = function(_current) {
    var lines = _current.payload.split("\n");
    this._debug("lines: " + lines.length);
    try {

        if (lines.length == 1) {
            var obj = JSON.parse(_current.payload);
            _current.payload = JSON.stringify(obj, null, 2);
            _current.setWorkflow(false);
            _current.update();
        } else {
            var obj = JSON.parse(_current.payload);
            _current.payload = JSON.stringify(obj);
            _current.setWorkflow(false);
            _current.update();
        }
    } catch (e) {
        this._debug("toggleFormatPayload Exception: " + e);
    }
};

NPPInterface.prototype.postMessage = function(_integrationMessageRec) {
    this.endpoint = _integrationMessageRec.endpoint;
    var restMessage = new sn_ws.RESTMessageV2();
    restMessage.setHttpMethod('post');
    restMessage.setRequestHeader('Content-Type', "application/" + _integrationMessageRec.send_as);

    if (_integrationMessageRec.send_as == "xml") {
        this.payload = "" + _integrationMessageRec.xml;
    } else {
        this.payload = "" + _integrationMessageRec.payload;
    }
    this.execute(restMessage, this.endpoint, this.payload);
    _integrationMessageRec.reqheaders = JSON.stringify(restMessage.getRequestHeaders());
    _integrationMessageRec.http_code = this.statusCode;
    _integrationMessageRec.response = this.responseStr;
    _integrationMessageRec.error_message = this.errorMessage;
    if (this.statusCode == 200) {
        _integrationMessageRec.status = "success";

    } else {
        _integrationMessageRec.status = "retry";
    }
    _integrationMessageRec.update();
};

NPPInterface.prototype.execute = function(_restMessage, _endpoint, _body, _options) {
    this._debug('Endpoint: ' + _endpoint);
    _restMessage.setEndpoint(_endpoint);

    if (this.BASIC_AUTHORIZATION) {
        _restMessage.setRequestHeader('Authorization', "Basic " + this.BASIC_AUTHORIZATION);
    }

    if (_body) {
        if (typeof _body == 'object') {
            this._debug('Payload: ' + JSON.stringify(_body));
            _restMessage.setRequestBody(JSON.stringify(_body));
        } else {
            this._debug('Payload: ' + _body);
            _restMessage.setRequestBody(_body);
        }
    }

    var response = _restMessage.execute();
    this.statusCode = response.getStatusCode();
    this._debug('Response Code: ' + this.statusCode);
    this.httpHeader = response.getHeaders();
    this.errorMessage = response.getErrorMessage();
    if (!global.JSUtil.nil(this.errorMessage)) {
        this._debug('getErrorMessage: ' + response.getErrorMessage());
    }
    this._debug('getRequestHeaders: ' + JSON.stringify(_restMessage.getRequestHeaders()));
    // Process JSON Response
    this.responseStr = response.getBody();
    if (global.JSUtil.nil(this.statusCode) || this.statusCode <= 0 || this.statusCode >= 500) {
        this.statusCode = 500;
    }
    return this.responseStr;
};