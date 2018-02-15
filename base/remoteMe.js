WebrtcConnectingStatusEnum ={
	CONNECTED :0,
	DISCONNECTED:1,
	FAILED:2,
	CONNECTING:3,
	DISCONNECTING:4,
	CHECKING:5
};
WebsocketConnectingStatusEnum ={
	CONNECTED :0,
	DISCONNECTED:1,
	ERROR:2,
};


class RemoteMe {


	constructor(config = undefined) {
		RemoteMe.thiz = this;
		var remoteMeDefaultConfig = {
			automaticlyConnectWS: false,
			automaticlyConnectWebRTC: false,
			webSocketConnectionChange: undefined,
			webRtcConnectionChange: undefined,
			onUserMessage:undefined,
			onUserSyncMessage:undefined,
			pcConfig: {"iceServers": [{"urls": "stun:stun.l.google.com:19302"}]},
			pcOptions: {optional: [{DtlsSrtpKeyAgreement: true}]},
			mediaConstraints: {'mandatory': {'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true}}
		};


		this.remoteMeConfig;
		this.webSocket;
		this.openedChanel = undefined;
		this.messageCounter = 0;
		this.peerConnection;


		this.remoteMeConfig = remoteMeDefaultConfig;
		if (config != undefined) {
			for (var k in config) {
				this.remoteMeConfig[k] = config[k];
			}
		}

		if (this.remoteMeConfig.automaticlyConnectWS) {
			this.connectWebSocket();
		}

		window.onbeforeunload = function(event) {
			this.disconnectWebRTC();

		}.bind(this);
	}


	log(text) {
		var now = (window.performance.now() / 1000).toFixed(3);
		console.log(now + ': ', text);
	}


	logTrace(text) {
		//	var now = (window.performance.now() / 1000).toFixed(3);
		//	console.debug(now + ': ', text);
	}


	getWSUrl() {
		var ret;
		if (window.location.protocol == 'https') {
			ret = "wss://";
		} else {
			ret = "ws://";
		}
		ret += window.location.host + "/api/ws/v1/" + thisDeviceId;
		return ret;

	}

	getRestUrl() {
		return  window.location.protocol+"//"+window.location.host + "/api/rest/v1/" ;

	}


	connectWebSocket() {

		this.log("connectiong WS");
		this.webSocket = new WebSocket(RemoteMe.thiz.getWSUrl());
		this.webSocket.binaryType = "arraybuffer";
		this.webSocket.onopen = this.onOpenWS.bind(this);
		this.webSocket.onmessage = this.onMessageWS.bind(this);
		this.webSocket.onerror = this.onErrorWS.bind(this);
		this.webSocket.onclose = this.onCloseWS.bind(this);

	}


	restartWebSocket() {
		if (this.isWebSocketConnected()) {
			this.disconnectWebSocket();
			setTimeout(this.connectWebSocket.bind(this), 1000);
		} else {
			this.connectWebSocket();
		}

	}


	isWebSocketConnected() {
		return this.webSocket != undefined && this.webSocket.readyState === this.webSocket.OPEN;
	}


	disconnectWebSocket() {
		if (this.isWebSocketConnected()) {
			this.webSocket.close();
		}
		this.webSocket = undefined;

	}


	sendWebSocket(bytearray) {
		if (this.isWebSocketConnected()) {
			this.webSocket.send(bytearray.buffer);
			return true;
		} else {
			this.log("websocket is not opened");
			return false;
		}
	}


	sendRest(bytearray) {
		var url = this.getRestUrl()+"message/sendMessage/";
		var xhttp = new XMLHttpRequest();
		xhttp.responseType = "arraybuffer";
		xhttp.open("POST", url,true);
		xhttp.setRequestHeader("Content-type", "text/plain");
		xhttp.send(bytearray);


	}

	sendRestSync(bytearray,reponseFunction) {
		var url = this.getRestUrl()+"message/sendSyncMessage/";
		var xhttp = new XMLHttpRequest();
		xhttp.responseType = "arraybuffer";

		xhttp.addEventListener("load", function(){
			var output =new Uint8Array (this.response);
			reponseFunction(output);
		});

		xhttp.open("POST", url,true);
		xhttp.setRequestHeader("Content-type", "text/plain");
		xhttp.send(bytearray);



	}



	sendWebSocketText(text) {
		if (this.isWebSocketConnected()) {
			this.webSocket.send(text);
			return true;
		} else {
			this.log("websocket is not opened");
			return false;
		}
	}

	sendWebRtc(bytearray) {
		if (this.isWebRTCConnected()) {
			this.openedChanel.send(bytearray.buffer)
		} else {
			this.log("webrtc channels is not opened")
		}

	}

	onErrorWS(event) {
		this.log("on error");
		if (this.remoteMeConfig.webSocketConnectionChange) {
			this.remoteMeConfig.webSocketConnectionChange(WebsocketConnectingStatusEnum.ERROR);
		}

	};


	onCloseWS(event) {
		this.log("on close");

		if (this.remoteMeConfig.webSocketConnectionChange) {
			this.remoteMeConfig.webSocketConnectionChange(WebsocketConnectingStatusEnum.DISCONNECTED);
		}


	};


	onOpenWS(event) {
		this.log("websocket connected");
		if (this.remoteMeConfig.automaticlyConnectWebRTC) {
			setTimeout(function () {
				this.connectWebRTC();
			}.bind(this),1000);
		}
		if (this.remoteMeConfig.webSocketConnectionChange) {
			this.remoteMeConfig.webSocketConnectionChange(WebsocketConnectingStatusEnum.CONNECTED);
		}

	};


	onMessageWS(event) {

		this.log(JSON.stringify(event));
		var isWebrtcConfiguration = false;
		{
			var ex = false;
			this.log("got websocket config ")
			try {

				var dataJson = JSON.parse(event.data);

			}
			catch (e) {
				ex = true;
			}

			if (!ex) {
				if (dataJson["cmd"] == "send") {
					this.isWebrtcConfiguration = true;
					this.doHandlePeerMessage(dataJson["msg"]);
				}
			}
		}

		if (!isWebrtcConfiguration) {

			var ret = new Object();

			var pos = new Object();
			pos.pos=0;

			var bytearray = new Uint8Array(event.data);

			ret.typeId = readShort(bytearray,pos);
			if (ret.typeId==MessageType.USER_MESSAGE){
				ret.size = readShort(bytearray,pos);
				ret.renevalWhenFailTypeId = readByte(bytearray,pos);
				ret.receiveDeviceId = readShort(bytearray,pos);
				ret.senderDeviceId = readShort(bytearray,pos);
				ret.messageId =  readShort(bytearray,pos);

				ret.data =readRestArray(bytearray,pos) ;

				if (this.remoteMeConfig.onUserMessage!=undefined){
					this.remoteMeConfig.onUserMessage(ret.senderDeviceId,ret.data);
				}


			}else if (ret.typeId==MessageType.USER_SYNC_MESSAGE){
				ret.size = readShort(bytearray,pos);

				ret.receiveDeviceId = readShort(bytearray,pos);
				ret.senderDeviceId = readShort(bytearray,pos);
				ret.messageId =  readLong(bytearray,pos);

				console.info(ret.messageId);

				ret.data =readRestArray(bytearray,pos) ;

				if (this.remoteMeConfig.onUserSyncMessage!=undefined){
					var functionRet=this.remoteMeConfig.onUserSyncMessage(ret.senderDeviceId,ret.data);

					var toSend=getUserSyncResponseMessage(ret.messageId,functionRet);
					if (this.isWebSocketConnected()){
						this.sendWebSocket(toSend);
					}else{
						this.sendRest(toSend);
					}
				}else{
					console.error("Sync message came but no function to handle it");
				}


			}else{
				console.error("Message id "+ret.typeId+" was not reconized");
			}



		}

	}




//--------------- webrtc


	isWebRTCConnected() {
		if ((this.peerConnection==undefined) || (this.openedChanel==undefined)){
			return false;
		}else{
			return this.peerConnection.iceConnectionState == 'connected';
		}

	}


	restartWebRTC() {
		this.disconnectWebRTC();
		this.connectWebRTC();
	}

	onWebrtcChange(status) {
		if (this.remoteMeConfig.webRTCConnectionChange){
			this.remoteMeConfig.webRTCConnectionChange(status);
		}
	}


	connectWebRTC() {
		if (!this.isWebSocketConnected()) {
			console.error("websocket is not connected cannot create webrtc connection");
			return;
		}

		this.onWebrtcChange(WebrtcConnectingStatusEnum.CONNECTING);

		// No Room concept, random generate room and client id.
		var register = {
			cmd: 'register',
			targetDeviceId: raspberryPiDeviceId
		};
		var register_message = JSON.stringify(register);
		this.sendWebSocketText(register_message);
	}


	doSend(data) {
		var message = {
			cmd: "send",
			msg: data,
			error: "",
			targetDeviceId: raspberryPiDeviceId
		};
		var data_message = JSON.stringify(message);
		if (RemoteMe.thiz.sendWebSocketText(data_message) == false) {
			RemoteMe.thiz.log("Failed to send data: " + data_message);
			return false;
		}

		return true;
	}


	disconnectWebRTC() {

		if (!this.isWebSocketConnected()) {
			console.error("websocket is not connected cannot disconnect  webrtc connection");
			return;
		}


		this.onWebrtcChange(WebrtcConnectingStatusEnum.DISCONNECTING);

		var message = {
			cmd: "disconnect",
			msg: "",
			error: "",
			targetDeviceId: raspberryPiDeviceId
		};
		var data_message = JSON.stringify(message);
		if (this.sendWebSocketText(data_message) == false) {
			this.log("Failed to send data: " + data_message);
			return false;
		}

		this.openedChanel = undefined;

	}

//PEER conenction


///////////////////////////////////////////////////////////////////////////////
//
// PeerConnection
//
///////////////////////////////////////////////////////////////////////////////

	createPeerConnection() {

		this.peerConnection = new RTCPeerConnection(this.remoteMeConfig.pcConfig, this.remoteMeConfig.pcOptions);
		this.peerConnection.oniceconnectionstatechange = function () {
			if (RemoteMe.thiz.peerConnection.iceConnectionState == 'disconnected'){
				RemoteMe.thiz.onWebrtcChange(WebrtcConnectingStatusEnum.DISCONNECTED);
			}else if (RemoteMe.thiz.peerConnection.iceConnectionState == 'failed'){
				RemoteMe.thiz.onWebrtcChange(WebrtcConnectingStatusEnum.FAILED);
			}else if (RemoteMe.thiz.peerConnection.iceConnectionState == 'connected'){
				RemoteMe.thiz.onWebrtcChange(WebrtcConnectingStatusEnum.CONNECTED);
			}else if (RemoteMe.thiz.peerConnection.iceConnectionState == 'checking'){
				RemoteMe.thiz.onWebrtcChange(WebrtcConnectingStatusEnum.CHECKING);
			}

			RemoteMe.thiz.log("webrtc connection status changed" + RemoteMe.thiz.peerConnection.iceConnectionState)
		}
		this.peerConnection.onicecandidate = function (event) {
			if (event.candidate) {
				var candidate = {
					type: 'candidate',
					label: event.candidate.sdpMLineIndex,
					id: event.candidate.sdpMid,
					candidate: event.candidate.candidate
				};
				RemoteMe.thiz.doSend(JSON.stringify(candidate));
			} else {
				RemoteMe.thiz.logTrace("End of candidates.");
			}
		};
		this.peerConnection.onconnecting = this.onSessionConnecting;
		this.peerConnection.onopen = this.onSessionOpened;
		this.peerConnection.ontrack = this.onRemoteStreamAdded;
		this.peerConnection.onremovestream = this.onRemoteStreamRemoved;
		this.peerConnection.ondatachannel = this.onDataChannel;

		this.logTrace("Created RTCPeerConnnection with config: " + JSON.stringify(this.remoteMeConfig.pcConfig));


	}


	onDataChannel(event) {
		RemoteMe.thiz.openedChanel = event.channel;

		RemoteMe.thiz.logTrace("on data channel " + event.channel.label);


		/*event.channel.onclose = function () {
			RemoteMe.thiz.log("on data channel close  ");
			if (RemoteMe.thiz.remoteMeConfig.webRTCConnectionChange) {
				RemoteMe.thiz.remoteMeConfig.webRTCConnectionChange(false);
			}
		};*/
		event.channel.onmessage = function (e) {
			RemoteMe.thiz.log("on Message " + e);
		}
	}


	onRemoteStreamAdded(event) {
		RemoteMe.thiz.logTrace("Remote stream added:", event.streams);
		var remoteVideoElement = document.getElementById('remoteVideo');
		remoteVideo.srcObject = event.streams[0];
	}


	sld_success_cb() {
		RemoteMe.thiz.logTrace("setLocalDescription success");
	}


	sld_failure_cb() {
		RemoteMe.thiz.logTrace("setLocalDescription failed");
	}


	aic_success_cb() {
		RemoteMe.thiz.logTrace("addIceCandidate success");
	}


	aic_failure_cb(x) {
		RemoteMe.thiz.logTrace("addIceCandidate failed", x);
	}


	doHandlePeerMessage(data) {
		++this.messageCounter;
		var dataJson = JSON.parse(data);
		this.logTrace("Handle Message :", JSON.stringify(dataJson));


		if (dataJson["type"] == "offer") {        // Processing offer
			this.logTrace("Offer from PeerConnection");
			var sdp_returned = this.forceChosenVideoCodec(dataJson.sdp, 'H264/90000');
			dataJson.sdp = sdp_returned;
			// Creating PeerConnection
			this.createPeerConnection();
			this.peerConnection.setRemoteDescription(new RTCSessionDescription(dataJson), this.onRemoteSdpSucces, this.onRemoteSdpError);
			this.peerConnection.createAnswer(function (sessionDescription) {

				RemoteMe.thiz.logTrace("Create answer:", sessionDescription);
				RemoteMe.thiz.peerConnection.setLocalDescription(sessionDescription, RemoteMe.thiz.sld_success_cb, RemoteMe.thiz.sld_failure_cb);
				var data = JSON.stringify(sessionDescription);
				RemoteMe.thiz.logTrace("Sending Answer: " + data);
				RemoteMe.thiz.doSend(data);
			}, function (error) { // error
				this.logTrace("Create answer error:", error);
			}, this.remoteMeConfig.mediaConstraints); // type error
		}
		else if (dataJson["type"] == "candidate") {    // Processing candidate
			this.logTrace("Adding ICE candiate " + dataJson["candidate"]);

			var candidate = new RTCIceCandidate({sdpMLineIndex: dataJson.label, candidate: dataJson.candidate});
			this.peerConnection.addIceCandidate(candidate, this.aic_success_cb, this.aic_failure_cb);

			this.logTrace("sdpMLineIndex is null >>>>>> " + dataJson.sdpMLineIndex);


		}
	}


	onSessionConnecting(message) {
		this.logTrace("Session connecting.");

	}


	onSessionOpened(message) {
		this.logTrace("Session opened.");

	}


	onRemoteStreamRemoved(event) {
		this.logTrace("Remote stream removed.");

	}


	onRemoteSdpError(event) {
		console.error('onRemoteSdpError', event.name, event.message);
		if (remoteMeConfig.webRTCConnectionChange) {
			remoteMeConfig.webRTCConnectionChange(false);
		}
	}


	onRemoteSdpSucces() {
		RemoteMe.thiz.logTrace('onRemoteSdpSucces');

	}


	forceChosenVideoCodec(sdp, codec) {
		return this.maybePreferCodec(sdp, 'video', 'send', codec);
	}


	forceChosenAudioCodec(sdp, codec) {
		return this.maybePreferCodec(sdp, 'audio', 'send', codec);
	}

// Copied from AppRTC's sdputils.js:

// Sets |codec| as the default |type| codec if it's present.
// The format of |codec| is 'NAME/RATE', e.g. 'opus/48000'.


	maybePreferCodec(sdp, type, dir, codec) {
		var str = type + ' ' + dir + ' codec';
		if (codec === '') {
			this.logTrace('No preference on ' + str + '.');
			return sdp;
		}

		this.logTrace('Prefer ' + str + ': ' + codec);	// kclyu

		var sdpLines = sdp.split('\r\n');

		// Search for m line.
		var mLineIndex = this.findLine(sdpLines, 'm=', type);
		if (mLineIndex === null) {
			this.logTrace('* not found error: ' + str + ': ' + codec);	// kclyu
			return sdp;
		}

		// If the codec is available, set it as the default in m line.
		var codecIndex = this.findLine(sdpLines, 'a=rtpmap', codec);
		this.logTrace('mLineIndex Line: ' + sdpLines[mLineIndex]);
		this.logTrace('found Prefered Codec in : ' + codecIndex + ': ' + sdpLines[codecIndex]);
		this.logTrace('codecIndex', codecIndex);
		if (codecIndex) {
			var payload = this.getCodecPayloadType(sdpLines[codecIndex]);
			if (payload) {
				sdpLines[mLineIndex] = this.setDefaultCodec(sdpLines[mLineIndex], payload);
				//sdpLines[mLineIndex] = setDefaultCodecAndRemoveOthers(sdpLines, sdpLines[mLineIndex], payload);
			}
		}

		// delete id 100(VP8) and 101(VP8)

		this.logTrace('** Modified LineIndex Line: ' + sdpLines[mLineIndex]);
		sdp = sdpLines.join('\r\n');
		return sdp;
	}

// Find the line in sdpLines that starts with |prefix|, and, if specified,
// contains |substr| (case-insensitive search).


	findLine(sdpLines, prefix, substr) {
		return this.findLineInRange(sdpLines, 0, -1, prefix, substr);
	}

// Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
// and, if specified, contains |substr| (case-insensitive search).


	findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
		var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
		for (var i = startLine; i < realEndLine; ++i) {
			if (sdpLines[i].indexOf(prefix) === 0) {
				if (!substr ||
					sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
					return i;
				}
			}
		}
		return null;
	}

// Gets the codec payload type from an a=rtpmap:X line.


	getCodecPayloadType(sdpLine) {
		var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
		var result = sdpLine.match(pattern);
		return (result && result.length === 2) ? result[1] : null;
	}

// Returns a new m= line with the specified codec as the first one.


	setDefaultCodec(mLine, payload) {
		var elements = mLine.split(' ');

		// Just copy the first three parameters; codec order starts on fourth.
		var newLine = elements.slice(0, 3);

		// Put target payload first and copy in the rest.
		newLine.push(payload);
		for (var i = 3; i < elements.length; i++) {
			if (elements[i] !== payload) {
				newLine.push(elements[i]);
			}
		}
		return newLine.join(' ');
	}


	setDefaultCodecAndRemoveOthers(sdpLines, mLine, payload) {
		var elements = mLine.split(' ');

		// Just copy the first three parameters; codec order starts on fourth.
		var newLine = elements.slice(0, 3);


		// Put target payload first and copy in the rest.
		newLine.push(payload);
		for (var i = 3; i < elements.length; i++) {
			if (elements[i] !== payload) {

				//  continue to remove all matching lines
				for (var line_removed = true; line_removed;) {
					line_removed = RemoveLineInRange(sdpLines, 0, -1, "a=rtpmap", elements[i]);
				}
				//  continue to remove all matching lines
				for (var line_removed = true; line_removed;) {
					line_removed = RemoveLineInRange(sdpLines, 0, -1, "a=rtcp-fb", elements[i]);
				}
			}
		}
		return newLine.join(' ');
	}


	RemoveLineInRange(sdpLines, startLine, endLine, prefix, substr) {
		var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
		for (var i = startLine; i < realEndLine; ++i) {
			if (sdpLines[i].indexOf(prefix) === 0) {
				if (!substr ||
					sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
					var str = "Deleting(index: " + i + ") : " + sdpLines[i];
					this.logTrace(str);
					sdpLines.splice(i, 1);
					return true;
				}
			}
		}
		return false;
	}


//PEER connection closed


// functions for users


	sendUserMessageByFasterChannel(receiveDeviceId, data) {
		if (receiveDeviceId>0){
			if (this.isWebRTCConnected()) {
				this.sendWebRtc(getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data))
			} else {
				this.sendWebSocket(getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data));
			}
		}else{
			console.error("Cannot send message to deviceId with this id, did You configure your script correct ?");
		}


	}


	sendUserMessageWebsocket(receiveDeviceId, data) {
		this.sendWebSocket(getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data));
	}


	sendUserMessageWebrtc(receiveDeviceId, data) {
		this.sendWebRtc(getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data));
	}

	sendUserMessageRest(receiveDeviceId, data) {
		this.sendRest(getUserMessage(WSUserMessageSettings.NO_RENEWAL, receiveDeviceId, thisDeviceId, 0, data));
	}

	sendUserSyncMessageRest(receiveDeviceId, data,reponseFunction) {
		this.sendRestSync(getUserSyncMessage( receiveDeviceId, thisDeviceId,  data),reponseFunction);
	}



}


