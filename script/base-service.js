/*!
 * BaseService v2.1.0 
 * Copyright 2016-2018 HIT ROBOT GROUP 
 * Date: 2017-2-4 9:23:00  WZB
 * 
 */
 
 /**
  * 调用方法
  * BaseService.VoiceWakeUp()	语音唤醒订阅
  * BaseService.closeWakeUp()	语音唤醒取消订阅
  * BaseService.getPower()	    获取电量
  * BaseService.getQuickStop()	获取急停状态
  *
  *
  *
  *
  *
  *
  *
  *
  *
  *
  *
  *
  *
  *
  *
  */
(function (factory) {
    this.BaseService= factory();
})(function () {
	function BaseService (){
       this.name="123";
       var ReconnectingWebSocket=window.ReconnectingWebSocket || window.WebSocket;
       var websocket = new ReconnectingWebSocket('ws://127.0.0.1:9003');
       this.websocket=websocket;
       this.websocket.onclose=function(){
       	console.log('navigation sevice connect close!');
       };
       this.websocket.onerror=function(){
       	console.log('navigation sevice connect error!');
       };


    
    /**
     * 语音唤醒订阅
     */
    this.openWakeUpCmd=0;
    this.openWakeUp=function(){
    	var sendData={};
        sendData.cmd=0;
        this.websocket.send(JSON.stringify(sendData));
    };
    /**
     * 语音唤醒取消订阅
     */
    this.closeWakeUpCmd=1;
    this.closeWakeUp=function(){
    	var sendData={};
        sendData.cmd=1;
        this.websocket.send(JSON.stringify(sendData));
    };
    /**
     * 语音唤醒推送
     */
    this.pushWakeUpCmd=2;
	/**
     * 获取电量
     */
    this.getPowerCmd=3;
    this.getPower=function(){
    	var sendData={};
        sendData.cmd=3;
        this.websocket.send(JSON.stringify(sendData));
    };
    /**
     * 获取急停状态
     */
    this.getQuickStopCmd=4;
    this.getQuickStop=function(){
    	var sendData={};
        sendData.cmd=4;
        this.websocket.send(JSON.stringify(sendData));
    };






	}
    return BaseService;
});