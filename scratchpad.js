var xml = '<?xml version="1.0" encoding="UTF-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.030.001.04" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:iso:std:iso:20022:tech:xsd:camt.030.001.04.xsd"><NtfctnOfCaseAssgnmt><Hdr><Id>DBCAAU3LXXXC20160510INV000256</Id><Fr><Agt><FinInstnId><BICFI>DBCAAU3LXXX</BICFI></FinInstnId></Agt></Fr><To><Agt><FinInstnId><BICFI>TBCAAU3MXXX</BICFI></FinInstnId></Agt></To><CreDtTm>2016-05-10T20:07:47.456Z</CreDtTm></Hdr><Case><Id>DBCAAU3LXXXC2017010301000000000001</Id><Cretr><Agt><FinInstnId><BICFI>TBCAAU3MXXX</BICFI></FinInstnId></Agt></Cretr></Case><Assgnmt><Id>DBCAAU3LXXX20160510000000000002589</Id><Assgnr><Agt><FinInstnId><BICFI>DBCAAU3LXXX</BICFI></FinInstnId></Agt></Assgnr><Assgne><Agt><FinInstnId><BICFI>TBCAAU3MXXX</BICFI></FinInstnId></Agt></Assgne><CreDtTm>2016-05-09T22:17:47.222Z</CreDtTm></Assgnmt><Ntfctn><Justfn>MINE</Justfn></Ntfctn></NtfctnOfCaseAssgnmt></Document>';
// gs.print(xml);
var HmlXelper = new XMLHelper(xml); // messageBody is a global variable that contain the event message body
var xmlObject = HmlXelper.toObject();
var obj = {};
obj.payload = JSON.stringify(xmlObject);
gs.print(obj.payload);

/*
var current = new GlideRecord("x_baoq_npp_nppcase");
current.get("f5a8bed7db64ab80d9b517564a9619be");
gs.debug(current.number);
current.description = "FF";
gs.debug(current.description);

current.update();

var nn = new global.NPPTEST();
current = nn.evaluate(current);
gs.debug(current.description);
current.update();
nt = nn.test(current);
gs.debug(nt);

var payload = {"@xmlns":"urn:iso:std:iso:20022:tech:xsd:camt.035.001.03","@xmlns:xsi":"http://www.w3.org/2001/XMLSchema-instance","@xsi:schemaLocation":"urn:iso:std:iso:20022:tech:xsd:camt.035.001.03.xsd","PrtryFrmtInvstgtn":{"Assgnmt":{"Id":"DBCAAU3LXXX20180209080000000001530","Assgnr":{"Agt":{"FinInstnId":{"BICFI":"DBCAAU3LXXX1"}}},"Assgne":{"Agt":{"FinInstnId":{"BICFI":"TBCAAU3MXXX"}}},"CreDtTm":"2018-02-09T01:26:55.055Z"},"Case":{"Id":"TBBCAAU3LXXXC2018020908000000000036","Cretr":{"Agt":{"FinInstnId":{"BICFI":"DBCAAU3LXXX"}}},"ReopCaseIndctn":"false"},"PrtryData":{"Tp":"PrtryFrmtInvstgtnData","Data":{"Document":{"@xmlns":"urn:iso:std:iso:20022:tech:xsd:data.001.001.01","PrtryFrmtInvstgtnData":{"InvstgtnTp":{"Prtry":"INV4"},"OrgnlTxId":"DBCAAU3LXXXN20180209000000000000160","IntrBkSttlmAmt":{"@Ccy":"AUD","#text":"200.87"},"Dbtr":{"Nm":"C LTEST"},"DbtrAcct":{"Id":{"Othr":{"Id":"633000157573262","SchmeNm":{"Cd":"BBAN"},"Issr":"633000"}}},"Cdtr":{"Nm":"BOYES N"},"CdtrAcct":{"Id":{"Othr":{"Id":"013355180026426","SchmeNm":{"Cd":"BBAN"},"Issr":"013355"}}},"Nrrtv":{"CreDtTm":"2018-02-09T01:26:55.055Z","Cretr":{"Agt":{"FinInstnId":{"BICFI":"DBCAAU3LXXX"}}},"Nrrtv":"We can't send camt 56 under this case ID. We can create a separate case and send camt 56. if you would like to."}}}}}}};
gs.debug(payload);


NPPInterfaceInbound().rest(payload, "camt.035");

/*




*/
var gr = new GlideRecord("sys_dictionary");
// gr.addQuery("sys_id","!=", "48a91820dbe42380d9b517564a961943");
gr.addEncodedQuery("name=u_npp_interface^elementNOT LIKEsys_");
gr.query();
while (gr.next()) {

    var newRec = new GlideRecord("sys_dictionary");
    newRec.newRecord();
    newRec.name = "x_baoq_npp_integration_message";
    newRec.internal_type = gr.internal_type;
    newRec.column_label = gr.column_label;
    newRec.element = gr.element.substring(2);
    newRec.max_length = gr.max_length;
    newRec.reference = gr.reference;
    newRec.default_value = gr.default_value;
    newRec.dependent_on_field = gr.dependent_on_field;
    newRec.dependent = gr.dependent;
    gs.debug(gr.element + " -> " + newRec.element);
    // newRec.insert();
}


var obj = {"RsltnOfInvstgtn":{"Assgnmt":{"Assgne":{"Agt":{"FinInstnId":{"BICFI":""}}},"Assgnr":{"Agt":{"FinInstnId":{"BICFI":""}}},"CreDtTm":"","Id":""},"RsltnRltdInf":{"IntrBkSttlmAmt":{"_Ccy":"","__text":""},"IntrBkSttlmDt":""},"RslvdCase":{"Cretr":{"Agt":{"FinInstnId":{"BICFI":""}}},"Id":"TBBCAAU3LXXXC2018020908000000000038"},"Sts":{"Conf":""}}};

var doc = {Document:{}};
doc.Document = obj;

var xmlhelp = new global.XMLHelper();
var xmlStr = xmlhelp.toXMLStr(doc);

var xmlDoc = new XMLDocument(xmlStr);

var node = xmlDoc.getNode("/Document");
node.setAttribute("_xmlns","urn:iso:std:iso:20022:tech:xsd:camt.029.001.05");
node.setAttribute("_xmlns:xsi","http://www.w3.org/2001/XMLSchema-instance");
node.setAttribute("_xsi:schemaLocation","urn:iso:std:iso:20022:tech:xsd:camt.029.001.05.xsd");

gs.debug("xmldoc is: " + xmlDoc.toString());

var current = new GlideRecord("x_baoq_npp_nppcase");
current.get("274d926fdb60eb80d9b517564a96196b");
NPPInterfaceOutbound().send(current, "camt.029");