var NPPInterfaceOutbound = function() {
    // Ensure new is always called
    if (!(this instanceof NPPInterfaceOutbound)) {
        return new NPPInterfaceOutbound();
    }
    this.type = 'NPPInterfaceOutbound';
    this._debugging = (gs.getProperty("debug.SI." + this.type) === 'true');
    if (gs.getProperty("instance_name").match(/dev/)) {
        this._debugging = true;
    }

    if (gs.getProperty("instance_name").match(/test/)) {
        this._debugging = true;
    }

};

NPPInterfaceOutbound.prototype = Object.extendsObject(NPPInterface, {

    send: function(_current, _message, _target) {
        this.initialize();
        this._debug("Send");
        this.action = "query";
        this.myGlideRecord = _current;
        this.interfaceMsgRec = new GlideRecord("x_baoq_npp_integration_message");
        this.interfaceMsgRec.newRecord();
        this.interfaceMsgRec.reference = _current.sys_id;
        this.interfaceMsgRec.table = _current.getTableName();
        this.interfaceMsgRec.direction = "outbound";
        this.interfaceMsgRec.status = "waiting";
        this.interfaceMsgRec.source = this.INTERFACE_SOURCE_TARGET_BOQ;
        this.interfaceMsgRec.target = this.INTERFACE_SOURCE_TARGET_ORCHESTRATION;
        this.messageDefinitionRec = NPPUtilities().getMessageTypeByName(_message, "outbound");

        if (_target) {
            this.interfaceMsgRec.target = _target;
            this.interfaceMsgRec.endpoint = this.getEndpoint(_target) + this.messageDefinitionRec.url;
        }


        this.interfaceMsgRec.message_type = this.messageDefinitionRec.sys_id;
        this.interfaceMsgRec.send_as = this.messageDefinitionRec.send_as;
        this.interfaceMsgRec.insert();

        this.loadMessageMapping(this.messageDefinitionRec);
        this.generateOutMessage(this.myGlideRecord);

        this.printJSON("PAYLOAD", this.payload, true);
        this.interfaceMsgRec.payload = JSON.stringify(this.payload);
        this.interfaceMsgRec.status = "queued";

        // XML Payload
        try {
            var doc = {Document: {}};
            doc.Document = this.payload;

            var xmlhelp = new global.XMLHelper();
            var xmlStr = xmlhelp.toXMLStr(doc);
            xmlStr = this.addXMLParameter("/Document", xmlStr);

            // var xmlDoc = new global.XMLDocument(xmlStr);
            //
            // var node = xmlDoc.getNode("/Document");
            // node.setAttribute("xmlns", "urn:iso:std:iso:20022:tech:xsd:camt.029.001.05");evaluateAnswer
            // node.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
            // node.setAttribute("xsi:schemaLocation", "urn:iso:std:iso:20022:tech:xsd:camt.029.001.05.xsd");
            //
            // gs.debug("xmldoc is: " + xmlDoc.toString());
            // gs.debug("xmldoc is: " + xmlDoc.toIndentedString());

            // var xmldoc = new XMLDocument2();
            // xmldoc.parseXML(xmlStr);
            // this._debug("XML" + xmldoc.toString());
            //
            // node = xmldoc.getNode("/Document/RsltnOfInvstgtn/RsltnRltdInf/IntrBkSttlmAmt");
            // this._debug(node);
            //
            // node.setAttribute("Ccy","AUD");

            xmlStr = this.executeScripts("alter_xml", {xml: xmlStr});
            this.interfaceMsgRec.xml = xmlStr;
        } catch (e) {
            this.interfaceMsgRec.xml = e;
        }
        this.interfaceMsgRec.update();
    },

    getEndpoint: function(_target) {
        return gs.getProperty("x_baoq_npp.npp.case.management.integration.endpoint." + _target, "No endpoint defined");
    },

    addXMLParameter: function(_type, _xmlStr) {
        this._debug("addXMLParameter: " + _type + " XML: " + _xmlStr);

        var integrationParametersRec = new GlideRecord("x_baoq_npp_integration_parameters");
        integrationParametersRec.addQuery("type", _type);
        integrationParametersRec.addQuery("message_definition", this.messageDefinitionRec.sys_id);
        integrationParametersRec.query();
        while (integrationParametersRec.next()) {
            var xx = new global.NPPXMLDoc();
            _xmlStr = xx.addParam(_xmlStr, _type, integrationParametersRec.name, integrationParametersRec.value);
        }
        return _xmlStr;
    },

    list: function(queryParams, queryString) {
        this.initialize();
        this.listObj = {
            records: 0,
            query: decodeURIComponent(queryString),
            array: []
        };

        this.interfaceMsgRec = new GlideRecord("x_baoq_npp_integration_message");
        this.interfaceMsgRec.newRecord();
        this.interfaceMsgRec.direction = "query";
        this.interfaceMsgRec.status = "failed";
        this.interfaceMsgRec.target = this.INTERFACE_SOURCE_TARGET_BOQ;
        this.interfaceMsgRec.source = this.INTERFACE_SOURCE_TARGET_ORCHESTRATION;
        this.messageDefinitionRec = NPPUtilities().getMessageTypeByName("camt.035", "outbound");
        this.interfaceMsgRec.message_type = this.messageDefinitionRec.sys_id;
        this.interfaceMsgRec.request_parameter = queryString;
        this.interfaceMsgRec.insert();

        this.loadMessageMapping(this.messageDefinitionRec);

        var nppCaseRec = new GlideRecord("x_baoq_npp_nppcase");
        // this.query = "sys_id=-1";
        if (NPPUtilities().nn(this.listObj.query)) {
            nppCaseRec.addEncodedQuery(this.listObj.query);
        }
        nppCaseRec.query();
        this.queryInfo("nppCaseRec", nppCaseRec);
        while (nppCaseRec.next()) {
            this.listObj.records++;
            this._debug("GETLIST: " + nppCaseRec.number)
            this.myGlideRecord = nppCaseRec;
            this.generateOutMessage(nppCaseRec);
            this.singleResponse = JSON.stringify(this.payload);
            this.listObj.array.push(this.payload);
        }
        if (this.listObj.records == 0) {
            this.response.errorCode = 404;
            this.response.errorMessage = "No records found"
            this.response.query = this.listObj.query;
        }
        this.interfaceMsgRec.status = "success";
        this.interfaceMsgRec.response = JSON.stringify(this.listObj);
        this.interfaceMsgRec.update();
        return {payload: this.listObj, response: this.response};
    },

    get: function(queryParams, queryString) {
        this.initialize();
        this.messageName = "camt.035";
        this.interfaceMsgRec = new GlideRecord("x_baoq_npp_integration_message");
        this.interfaceMsgRec.newRecord();
        this.interfaceMsgRec.direction = "query";
        this.interfaceMsgRec.status = "failed";
        this.interfaceMsgRec.target = this.INTERFACE_SOURCE_TARGET_BOQ;
        this.interfaceMsgRec.source = this.INTERFACE_SOURCE_TARGET_ORCHESTRATION;
        if (NPPUtilities().nn(queryParams.message)) {
            this.messageName = queryParams.message;
        }
        this.messageDefinitionRec = NPPUtilities().getMessageTypeByName(this.messageName, "outbound");

        this._debug("231");
        this._debug("1"+this.messageDefinitionRec);
        this._debug("2"+NPPUtilities().nn(this.messageDefinitionRec));

        if (!NPPUtilities().nn(this.messageDefinitionRec)) {
            this.response.errorCode = 102;
            this.response.errorMessage = this.ERR_MESSAGE_102.replace(/\{\{message\}\}/, this.messageName);
            return {payload: this.payload, response: this.response};
        }

        this.interfaceMsgRec.message_type = this.messageDefinitionRec.sys_id;
        this.interfaceMsgRec.request_parameter = queryString;
        this.interfaceMsgRec.insert();

        this.loadMessageMapping(this.messageDefinitionRec);
 
        var nppCaseRec = new GlideRecord("x_baoq_npp_nppcase");
        this.query = "sys_id=-1";
        if (!global.JSUtil.nil(queryParams.sys_id)) {
            this.query = "sys_id=" + queryParams.sys_id;
        }
        if (!global.JSUtil.nil(queryParams.number)) {
            this.query = "number=" + queryParams.number;
        }
        if (!global.JSUtil.nil(queryParams.internal_case_id)) {
            this.query = "internal_case_id=" + queryParams.internal_case_id;
        }
        if (!global.JSUtil.nil(queryParams.external_case_id)) {
            this.query = "external_case_id=" + queryParams.external_case_id;
        }
        nppCaseRec.addEncodedQuery(this.query);
        nppCaseRec.query();
        this.queryInfo("nppCaseRec", nppCaseRec);
        if (nppCaseRec.next()) {
            this.interfaceMsgRec.reference = nppCaseRec.sys_id;
            this.interfaceMsgRec.table = nppCaseRec.getTableName();
            this.interfaceMsgRec.status = "success";

            this.myGlideRecord = nppCaseRec;
            this.generateOutMessage(nppCaseRec);
            this.interfaceMsgRec.response = JSON.stringify(this.payload);
        } else {
            this.response.errorCode = 401;
            this.response.errorMessage = this.ERR_MESSAGE_401.replace(/\{\{query\}\}/, global.JSUtil.nil(queryString)?": No query provided":queryString);
        }

         if (this.messageDefinitionRec.send_as == "xml") {

            // XML Payload
            try {
                var doc = {Document: {}};
                doc.Document = this.payload;

                var xmlhelp = new global.XMLHelper();
                var xmlStr = xmlhelp.toXMLStr(doc);
                xmlStr = this.addXMLParameter("/Document", xmlStr);

                // var xmlDoc = new global.XMLDocument(xmlStr);
                //
                // var node = xmlDoc.getNode("/Document");
                // node.setAttribute("xmlns", "urn:iso:std:iso:20022:tech:xsd:camt.029.001.05");evaluateAnswer
                // node.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
                // node.setAttribute("xsi:schemaLocation", "urn:iso:std:iso:20022:tech:xsd:camt.029.001.05.xsd");
                //
                // gs.debug("xmldoc is: " + xmlDoc.toString());
                // gs.debug("xmldoc is: " + xmlDoc.toIndentedString());

                // var xmldoc = new XMLDocument2();
                // xmldoc.parseXML(xmlStr);
                // this._debug("XML" + xmldoc.toString());
                //
                // node = xmldoc.getNode("/Document/RsltnOfInvstgtn/RsltnRltdInf/IntrBkSttlmAmt");
                // this._debug(node);
                //
                // node.setAttribute("Ccy","AUD");

                xmlStr = this.executeScripts("alter_xml", {xml: xmlStr});
                this.interfaceMsgRec.xml = xmlStr;
            } catch (e) {
                this.interfaceMsgRec.xml = e;
            }
            this.payload = xmlStr;
        }

        this.interfaceMsgRec.update();
        return {payload: this.payload, response: this.response};
    }
});