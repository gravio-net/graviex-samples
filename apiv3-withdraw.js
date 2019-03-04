function Endpoint(timeout)
{
    this.timeout = timeout ? timeout : 5000;
    this.request = null;

    this.process = function(action, method, parameters, callback)
    {
        var lTimestamp = gApp.nextTonce();
        parameters.tonce = lTimestamp;

        var lParameters = "";
        var lProperties = Object.keys(parameters).sort();
        for (var lIdx = 0; lIdx < lProperties.length; lIdx++)
        {
            lParameters += "&" + lProperties[lIdx] + "=" + parameters[lProperties[lIdx]];
        }

        var lRequest = "access_key=" + graviexAccount.accessKey + lParameters;
        var lMessage = action + "|/webapi/v3/" + method +"|" + lRequest;

        var lSignature = cryptoHelper.hash(lMessage, graviexAccount.secretKey, "sha256");

        var lQuery = gApp.getEndPoint() + "/webapi/v3/" + method + "?" + lRequest + '&signature=' + lSignature;

        var lHttpRequest = gApp.createHttpRequest();
        lHttpRequest.open(action, lQuery, true);

        lHttpRequest.onreadystatechange.connect(function()
        {
            var lState = "";
            if (lHttpRequest.readyState === XMLHttpRequest.UNSENT) lState = "UNSENT";
            else if (lHttpRequest.readyState === XMLHttpRequest.OPENED) lState = "OPENED";
            else if (lHttpRequest.readyState === XMLHttpRequest.HEADERS_RECEIVED) lState = "HEADERS_RECEIVED";
            else if (lHttpRequest.readyState === XMLHttpRequest.LOADING) lState = "LOADING";
            else if (lHttpRequest.readyState === 5) lState = "ERROR";
            else if (lHttpRequest.readyState === XMLHttpRequest.DONE) lState = "DONE";

            console.log("[API/" + method +  "/state]: " + lState + ", status = " + lHttpRequest.status + ", error = " + lHttpRequest.error);

            if (lHttpRequest.readyState === XMLHttpRequest.DONE || lHttpRequest.readyState === 5 /*ERROR*/)
            {
                if (!lHttpRequest.processed)
                {
                    if (gApp.getNetworkDebug()) console.log("[API/" + method + "/result]: status = " + lHttpRequest.status + ", dataLength = " + lHttpRequest.responseText.length);
                    if (gApp.getDebug()) console.log("[API/" + method + "/result]: status = " + lHttpRequest.status + ", data = " + lHttpRequest.responseText);
                    callback(lHttpRequest.status === 200 ? "success" : "error", lHttpRequest.responseText);
                    lHttpRequest.processed = true;
                }
            }
        });

        this.request = lHttpRequest;
        lHttpRequest.send();
    }

    this.abort = function()
    {
        this.request.abort();
    }
	
    this.createWithdraw = function(currency, address, sum, provider, callback)
    {
        var lParameters = {};
        lParameters.currency = currency;
        lParameters.fund_uid = address;
        lParameters.sum = sum;

        if (provider) lParameters.provider = provider;

        this.process("POST", "create_withdraw", lParameters, callback);
    }
}
