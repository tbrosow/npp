var NPPUtilities = function() {
    // Ensure new is always called
    if (!(this instanceof NPPUtilities)) {
        return new NPPUtilities();
    }
    this.type = 'NPPUtilities';
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

NPPUtilities.prototype = Object.extendsObject(NPPInterface, {

    generateNumbers: function(_current) {
        this.initialize();
        var suffix = "", prefix = "", middlePart = "XXXXXXXXXXXX";
        try {

            if (String(_current.internal_case_id).length == 15) {
                prefix = _current.internal_case_id.substring(0,3);
                middlePart = _current.internal_case_id.substring(4);
                suffix = _current.internal_case_id.substring(8);
                _current.number = prefix + suffix;
            }

            var id = {
                bic: "" + _current.creator_agent_bic.agent_bic,
                psi: "C",
                date: String(_current.opened_at).substring(0, 10).replace(/-/g, ""),
                channel: "00",
                number: middlePart,
                retry: "0"
            };
            _current.internal_case_id = id.bic + id.psi + id.date + id.channel + id.number + id.retry;
            this._debug("generateNumbers: " + _current.internal_case_id + " Number: " + _current.number);
        } catch (e) {
            this._debug("Exception  generateNumbers: " + e);
        }
    },

    nn: function(_string) {
        if (_string == "")
            return false;
        return !global.JSUtil.nil(_string);
    },

    unlinkCasebyTransactionID: function(_tid) {
        var taskList = [];
        if (this.nn(_tid)) {
            var nppCaseRec = new GlideRecord("x_baoq_npp_nppcase");
            nppCaseRec.addQuery("original_transaction_id", _tid);
            nppCaseRec.query();
            while (nppCaseRec.next()) {
                taskList.push("" + nppCaseRec.sys_id);
            }

            for (var key in taskList) {
                for (var key2 in taskList) {
                    if (taskList[key] != taskList[key2]) {
                        // Check if we have a hit
                        var m2mRec = new GlideRecord("x_baoq_npp_m2m_npp_cases_npp_cases");
                        var qc = m2mRec.addQuery("npp_case_fr", taskList[key]);
                        qc.addOrCondition("npp_case_to", taskList[key2]);
                        m2mRec.query();
                        if (m2mRec.next()) {
                            this._debug("Delete: " + m2mRec.npp_case_fr.number);
                            m2mRec.deleteRecord();
                        }
                    }
                }
            }
        }
    },

     linkCasebyTransactionID: function(_tid) {
        var taskList = [];
        if (this.nn(_tid)) {
            var nppCaseRec = new GlideRecord("x_baoq_npp_nppcase");
            nppCaseRec.addQuery("original_transaction_id", _tid);
            nppCaseRec.query();
            while (nppCaseRec.next()) {
                taskList.push("" + nppCaseRec.sys_id);
            }

            for (var key in taskList) {
                for (var key2 in taskList) {
                    if (taskList[key] != taskList[key2]) {
                        // Check if we have a hit
                        var m2mRec = new GlideRecord("x_baoq_npp_m2m_npp_cases_npp_cases");
                        m2mRec.addQuery("npp_case_fr", taskList[key]);
                        m2mRec.addQuery("npp_case_to", taskList[key2]);
                        m2mRec.query();
                        if (!m2mRec.hasNext()) {
                            var m2mRec1 = new GlideRecord("x_baoq_npp_m2m_npp_cases_npp_cases");
                            m2mRec1.newRecord();
                            m2mRec1.npp_case_fr = taskList[key];
                            m2mRec1.npp_case_to = taskList[key2];
                            this._debug("Insert: " + taskList[key])
                            m2mRec1.insert();

                            var m2mRec2 = new GlideRecord("x_baoq_npp_m2m_npp_cases_npp_cases");
                            m2mRec2.newRecord();
                            m2mRec2.npp_case_fr = taskList[key2];
                            m2mRec2.npp_case_to = taskList[key];
                            this._debug("Insert: " + taskList[key])
                            m2mRec2.insert();

                        } else {
                            this._debug("Skip: " + taskList[key])
                        }
                    }
                }
            }
        }
    },

    getMessageTypeByName: function(_name, _direction) {
        this._debug("getMessageTypeByName: " + _name);
        this.nppMessageDefinitionRec = new GlideRecord("x_baoq_npp_message_definition");
        this.nppMessageDefinitionRec.addQuery("name", _name);
        this.nppMessageDefinitionRec.addQuery("direction", _direction);
        this.nppMessageDefinitionRec.query();
        if (this.nppMessageDefinitionRec.next()) {
            this._debug("getMessageTypeByName: " + this.nppMessageDefinitionRec.sys_id);
            return this.nppMessageDefinitionRec;
        }
        return "";
    }
});