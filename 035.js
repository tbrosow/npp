var NPPObj = {
    "@xmlns": "urn:iso:std:iso:20022:tech:xsd:camt.035.001.03",
    "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "@xsi:schemaLocation": "urn:iso:std:iso:20022:tech:xsd:camt.035.001.03.xsd",
    "PrtryFrmtInvstgtn": {
        "Assgnmt": {
            "Id": "kk",
            "Assgnr": {
                "Agt": {
                    "FinInstnId": {
                        "BICFI": "DBCAAU3LXXX1"
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
            "CreDtTm": "2018-02-09T01:26:55.055Z"
        },
        "Case": {
            "Id": "TBBCAAU3LXXXC20180209080000000000A9",
            "Cretr": {
                "Agt": {
                    "FinInstnId": {
                        "BICFI": "DBCAAU3LXXX"
                    }
                }
            },
            "ReopCaseIndctn": "false"
        },
        "PrtryData": {
            "Tp": "PrtryFrmtInvstgtnData",
            "Data": {
                "Document": {
                    "@xmlns": "urn:iso:std:iso:20022:tech:xsd:data.001.001.01",
                    "PrtryFrmtInvstgtnData": {
                        "InvstgtnTp": {
                            "Prtry": "INV4"
                        },
                        "OrgnlTxId": "DBCAAU3LXXXN20180209000000000000160",
                        "IntrBkSttlmAmt": {
                            "@Ccy": "AUD",
                            "#text": "200.87"
                        },
                        "Dbtr": {
                            "Nm": "C LTEST"
                        },
                        "DbtrAcct": {
                            "Id": {
                                "Othr": {
                                    "Id": "633000157573262",
                                    "SchmeNm": {
                                        "Cd": "BBAN"
                                    },
                                    "Issr": "633000"
                                }
                            }
                        },
                        "Cdtr": {
                            "Nm": "BOYES N"
                        },
                        "CdtrAcct": {
                            "Id": {
                                "Othr": {
                                    "Id": "013355180026426",
                                    "SchmeNm": {
                                        "Cd": "BBAN"
                                    },
                                    "Issr": "013355"
                                }
                            }
                        },
                        "Nrrtv": {
                            "CreDtTm": "2018-02-09T01:26:55.055Z",
                            "Cretr": {
                                "Agt": {
                                    "FinInstnId": {
                                        "BICFI": "DBCAAU3LXXX"
                                    }
                                }
                            },
                            "Nrrtv": "Please refund the $$$"
                        }
                    }
                }
            }
        }
    }
};
// Create
NPPObj.PrtryFrmtInvstgtn.Case.Id = "TBBCAAU3LXXXC20180209080000000000A9";
NPPObj.PrtryFrmtInvstgtn.Assgnmt.Id = "kk";
NPPObj.PrtryFrmtInvstgtn.PrtryData.Data.Document.PrtryFrmtInvstgtnData.Nrrtv.Nrrtv = "Please refund the $$$";

// Update
// NPPObj.PrtryFrmtInvstgtn.Case.Id = "TBBCAAU3LXXXC20180209080000000000A8";
// NPPObj.PrtryFrmtInvstgtn.Assgnmt.Id = "C2018111300000000010170";

var callMe = require('./req.js');
callMe.http(NPPObj, "Request for Additional Information / General Query / Investigation", "camt.035");