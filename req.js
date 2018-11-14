module.exports = {
    http: function(payload, desc, msg) {

        additional_info = JSON.stringify({"u_payload": JSON.stringify(payload)})
        console.log(JSON.stringify(payload, null, 4));

        console.log("Calling ... ");

        var proxyUrl = "http://torsten.brosow:r3m0t3S3rv1ceN0wtb9254@52.63.30.45:3128";
        var request = require("request");

        var options = {
            proxy: proxyUrl,
            method: 'POST',
            url: 'https://boqdev.service-now.com/api/now/table/em_event',
            headers: {
                'Postman-Token': '93a8b9bf-0639-436f-b5b7-f67d460b2b8d',
                'cache-control': 'no-cache',
                'Authorization': 'Basic dG9yc3Rlbi5icm9zb3dAdmFsdWVmbG93LmNvbS5hdTp0b3JzdGVuLmJyb3Nvdw==',
                'X-UserToken': '24556618db202380d9b517564a9619adfeb747974f369552ffe3408b13daa80093ec3005',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: {
                additional_info: additional_info,
                source: 'NPP',
                description: 'Request for Additional Information / General Query / Investigation',
                severity: '5',
                message_key: new Date(),
                resource: 'camt.035'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log("Called ... HTTP-Code: " + response.statusCode)
        });

    }
};
