var NPPObj = {
    "@xmlns": "urn:iso:std:iso:20022:tech:xsd:camt.056.001.04",
    "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "@xsi:schemaLocation": "urn:iso:std:iso:20022:tech:xsd:camt.056.001.04.xsd",
    "FIToFIPmtCxlReq": {
        "Assgnmt": {
            "Id": "TEST_BANK_A_ASSINGMENT_ID_1",
            "Assgnr": {
                "Agt": {
                    "FinInstnId": {
                        "BICFI": "DBCAAU3LXXX"
                    }
                }
            },
            "Assgne": {
                "Agt": {
                    "FinInstnId": {
                        "BICFI": "TBCAAU3MXXX"
                    }
                }
            },
            "CreDtTm": "2016-12-12T12:30:00Z"
        },
        "Case": {
            "Id": "DBCAAU3LXXXC201802090800000000301X",
            "Cretr": {
                "Agt": {
                    "FinInstnId": {
                        "BICFI": "DBCAAU3LXXX"
                    }
                }
            }
        },
        "CtrlData": {
            "NbOfTxs": "1"
        },
        "Undrlyg": {
            "TxInf": {
                "OrgnlGrpInf": {
                    "OrgnlMsgId": "pacs008_inward_payment",
                    "OrgnlMsgNmId": "pacs.008.001.05",
                    "OrgnlCreDtTm": "2016-12-11T12:30:00Z"
                },
                "OrgnlEndToEndId": "outward_e2e_id_1",
                "OrgnlTxId": "TBCAAU3MXXXN20171103010000000000010",
                "OrgnlClrSysRef": "NPP",
                "OrgnlIntrBkSttlmAmt": {
                    "@Ccy": "AUD",
                    "#text": "240.00"
                },
                "CxlRsnInf": {
                    "Rsn": {
                        "Cd": "DUPL"
                    },
                    "AddtlInf": "Payment Repeated in Error"
                }
            }
        }
    }
};

NPPObj.FIToFIPmtCxlReq.Case.Id = "DBCAAU3LXXXC201802090800000000301X";

var callMe = require('./req.js');
callMe.http(NPPObj, "Request for Payment Return", "camt.056");

